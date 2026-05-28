import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Decision, DecisionStatus } from './entities/decision.entity';
import { Application, ApplicationStatus } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { UserRole } from 'src/common/constants/roles.constants';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { RankingsService } from 'src/rankings/rankings.service';

@Injectable()
export class DecisionService {
    // Komisyon üyelerinin verebileceği tek geçerli kararlar
    private readonly COMMISSIONER_ALLOWED_STATUSES = [DecisionStatus.ACCEPTED, DecisionStatus.REJECTED];

    constructor(
        @InjectRepository(Decision)
        private readonly decisionRepository: Repository<Decision>,
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ProgramCommissioner)
        private readonly programCommissionerRepo: Repository<ProgramCommissioner>,
        private readonly notificationsService: NotificationsService,
        private readonly rankingsService: RankingsService,
    ) {}

    private async assertCommissionerAssigned(commissionerId: number, programId: number) {
        const row = await this.programCommissionerRepo.findOne({
            where: { commissioner: { id: commissionerId }, program: { id: programId } } as any,
            select: ['id'],
        });
        if (!row) throw new ForbiddenException('Bu programa atanmış komisyon üyesi değilsiniz.');
    }

    private async resolveConsensus(application: Application): Promise<void> {
        const program = application.program as any;

        const commissioners = await this.programCommissionerRepo.find({
            where: { program: { id: program.id } } as any,
            select: ['id'],
        });
        const totalCommissioners = commissioners.length;
        if (totalCommissioners === 0) return;

        const decisions = await this.decisionRepository.find({
            where: { application: { id: application.id } } as any,
            select: ['id', 'status'],
        });

        if (decisions.length < totalCommissioners) return;

        const counts: Record<string, number> = {};
        for (const d of decisions) {
            counts[d.status] = (counts[d.status] ?? 0) + 1;
        }

        let finalStatus: ApplicationStatus;

        if (counts[DecisionStatus.INTERVIEW_REQUIRED]) {
            finalStatus = ApplicationStatus.INTERVIEW_REQUIRED;
        } else {
            const candidates = [DecisionStatus.ACCEPTED, DecisionStatus.REJECTED, DecisionStatus.WAITLISTED];
            const sorted = candidates
                .filter((s) => (counts[s] ?? 0) > 0)
                .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

            if (sorted.length === 0) return;

            const top = sorted[0];
            const topCount = counts[top] ?? 0;
            const hasTie = sorted.filter((s) => (counts[s] ?? 0) === topCount).length > 1;

            if (hasTie) return;

            if (top === DecisionStatus.ACCEPTED) {
                const acceptedCount = await this.applicationRepository.count({
                    where: { program: { id: program.id }, status: ApplicationStatus.ACCEPTED } as any,
                });
                finalStatus = acceptedCount >= program.Quota
                    ? ApplicationStatus.WAITLISTED
                    : ApplicationStatus.ACCEPTED;
            } else {
                finalStatus = top === DecisionStatus.REJECTED
                    ? ApplicationStatus.REJECTED
                    : ApplicationStatus.WAITLISTED;
            }
        }

        if (finalStatus === application.status) return;

        await this.applicationRepository.update({ id: application.id }, { status: finalStatus, updatedAt: new Date() });

        const userId = (application.user as any)?.id;
        const programName = program.name ?? '';
        const notifMap: Record<string, { type: NotificationType; title: string; message: string }> = {
            [ApplicationStatus.ACCEPTED]: {
                type: NotificationType.APPLICATION_ACCEPTED,
                title: 'Başvurunuz kabul edildi',
                message: `"${programName}" programına başvurunuz komisyon kararıyla kabul edildi. Tebrikler!`,
            },
            [ApplicationStatus.REJECTED]: {
                type: NotificationType.APPLICATION_REJECTED,
                title: 'Başvurunuz reddedildi',
                message: `"${programName}" programına başvurunuz komisyon kararıyla reddedildi.`,
            },
            [ApplicationStatus.WAITLISTED]: {
                type: NotificationType.APPLICATION_WAITLISTED,
                title: 'Başvurunuz bekleme listesinde',
                message: `"${programName}" programına başvurunuz bekleme listesine alındı.`,
            },
            [ApplicationStatus.INTERVIEW_REQUIRED]: {
                type: NotificationType.APPLICATION_INTERVIEW_REQUIRED,
                title: 'Mülakat gerekiyor',
                message: `"${programName}" programına başvurunuz için mülakat planlanacak.`,
            },
        };

        const notif = notifMap[finalStatus];
        if (notif && userId) {
            await this.notificationsService.create({
                userId,
                ...notif,
                metadata: { applicationId: application.id, programId: program.id },
            }).catch(() => {});
        }
    }

    async create(dto: CreateDecisionDto, commissionerId: number): Promise<Decision> {
        // Komisyon üyesi sadece kabul veya red kararı verebilir
        if (!this.COMMISSIONER_ALLOWED_STATUSES.includes(dto.status as DecisionStatus)) {
            throw new BadRequestException('Komisyon üyeleri yalnızca "Kabul" veya "Red" kararı verebilir.');
        }

        const application = await this.applicationRepository.findOne({
            where: { id: dto.applicationId },
            relations: ['program', 'user'],
        });
        if (!application) throw new NotFoundException('Başvuru bulunamadı.');

        const program = application.program as any;
        const now = new Date();

        if (now < new Date(program.ApplicationEnddate)) {
            throw new BadRequestException('Başvuru dönemi henüz sona ermedi. Değerlendirme yapılamaz.');
        }
        if (now > new Date(program.EvaluationDate)) {
            throw new BadRequestException('Değerlendirme dönemi sona ermiştir.');
        }

        await this.assertCommissionerAssigned(commissionerId, program.id);

        const alreadyVoted = await this.decisionRepository.findOne({
            where: { application: { id: application.id }, commissioner: { id: commissionerId } } as any,
            select: ['id'],
        });
        if (alreadyVoted) throw new BadRequestException('Bu başvuru için zaten bir değerlendirme yapmışsınız. Güncelleme yapın.');

        const commissioner = await this.userRepository.findOneBy({ id: commissionerId });
        if (!commissioner) throw new NotFoundException('Komisyon üyesi bulunamadı.');

        const isFirstDecision = (await this.decisionRepository.count({
            where: { application: { id: application.id } } as any,
        })) === 0;

        const decision = this.decisionRepository.create({
            decisionDate: new Date(),
            status: dto.status,
            notes: dto.notes,
            score: dto.score,
            application,
            commissioner,
            createdAt: new Date(),
        });

        const saved = await this.decisionRepository.save(decision);

        if (isFirstDecision && application.status === ApplicationStatus.SUBMITTED) {
            await this.applicationRepository.update({ id: application.id }, { status: ApplicationStatus.UNDER_REVIEW, updatedAt: new Date() });
            await this.notificationsService.create({
                userId: (application.user as any).id,
                type: NotificationType.APPLICATION_UNDER_REVIEW,
                title: 'Başvurunuz inceleniyor',
                message: `"${program.name}" programına başvurunuz komisyon tarafından incelenmeye başlandı.`,
                metadata: { applicationId: application.id, programId: program.id },
            }).catch(() => {});
            application.status = ApplicationStatus.UNDER_REVIEW;
        }

        await this.notificationsService.create({
            userId: (application.user as any).id,
            type: NotificationType.DECISION_MADE,
            title: 'Başvurunuz değerlendirildi',
            message: `"${program.name}" programına başvurunuz için bir komisyon üyesi değerlendirme yaptı.`,
            metadata: { applicationId: application.id, programId: program.id, decisionStatus: dto.status },
        }).catch(() => {});

        // Route to correct ranking trigger based on application status
        await this.rankingsService.checkAndTriggerRanking(program.id).catch(() => {});

        return saved;
    }

    async getById(id: number): Promise<Decision> {
        const decision = await this.decisionRepository.findOne({
            where: { id },
            relations: ['application', 'application.program', 'application.user', 'commissioner'],
        });
        if (!decision) throw new NotFoundException('Karar bulunamadı.');
        return decision;
    }

    async findAll(): Promise<Decision[]> {
        return this.decisionRepository.find({
            relations: ['application', 'application.program', 'application.user', 'commissioner'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByApplication(applicationId: number, commissionerId?: number): Promise<Decision[]> {
        if (commissionerId) {
            const app = await this.applicationRepository.findOne({ where: { id: applicationId }, relations: ['program'] });
            if (!app) throw new NotFoundException('Başvuru bulunamadı.');
            await this.assertCommissionerAssigned(commissionerId, (app.program as any)?.id);
        }

        return this.decisionRepository.find({
            where: { application: { id: applicationId } } as any,
            relations: ['application', 'application.program', 'application.user', 'commissioner'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByProgram(programId: number, commissionerId?: number): Promise<Decision[]> {
        if (commissionerId) await this.assertCommissionerAssigned(commissionerId, programId);
        return this.decisionRepository
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.application', 'app')
            .leftJoinAndSelect('app.program', 'prog')
            .leftJoinAndSelect('app.user', 'usr')
            .leftJoinAndSelect('d.commissioner', 'comm')
            .where('prog.id = :programId', { programId })
            .orderBy('d.createdAt', 'DESC')
            .getMany();
    }

    async findByCommissioner(commissionerId: number): Promise<Decision[]> {
        return this.decisionRepository
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.application', 'app')
            .leftJoinAndSelect('app.program', 'prog')
            .leftJoinAndSelect('app.user', 'usr')
            .leftJoinAndSelect('d.commissioner', 'comm')
            .where('comm.id = :commissionerId', { commissionerId })
            .orderBy('d.createdAt', 'DESC')
            .getMany();
    }

    async update(id: number, dto: UpdateDecisionDto, commissionerId: number): Promise<Decision> {
        const decision = await this.decisionRepository.findOne({
            where: { id },
            relations: ['application', 'application.program', 'application.user', 'commissioner'],
        });
        if (!decision) throw new NotFoundException('Karar bulunamadı.');

        if (decision.commissioner.id !== commissionerId) {
            throw new ForbiddenException('Yalnızca kararı veren komisyon üyesi güncelleyebilir.');
        }

        const program = decision.application.program as any;
        const appStatus = (decision.application as any).status as string;

        // Skip evaluation date check during interview phase
        if (appStatus !== ApplicationStatus.INTERVIEW_REQUIRED) {
            const now = new Date();
            if (now > new Date(program.EvaluationDate)) {
                throw new BadRequestException('Değerlendirme dönemi sona ermiştir. Güncelleme yapılamaz.');
            }
        }

        await this.assertCommissionerAssigned(commissionerId, program.id);

        if (dto.status !== undefined) decision.status = dto.status;
        if (dto.notes !== undefined) decision.notes = dto.notes;
        if (dto.score !== undefined) decision.score = dto.score;
        decision.updatedAt = new Date();
        decision.updatedBy = commissionerId;

        if (!this.COMMISSIONER_ALLOWED_STATUSES.includes(decision.status)) {
            throw new BadRequestException('Komisyon üyeleri yalnızca "Kabul" veya "Red" kararı verebilir.');
        }

        const saved = await this.decisionRepository.save(decision);

        // Route to correct ranking trigger
        if (appStatus === ApplicationStatus.INTERVIEW_REQUIRED) {
            await this.rankingsService.checkAndTriggerFinalRanking(program.id).catch(() => {});
        } else {
            await this.rankingsService.checkAndTriggerRanking(program.id).catch(() => {});
        }

        return saved;
    }

    async remove(id: number): Promise<void> {
        const decision = await this.decisionRepository.findOne({ where: { id }, relations: ['application'] });
        if (!decision) throw new NotFoundException('Karar bulunamadı.');
        await this.decisionRepository.softDelete({ id });
    }

    async restore(id: number): Promise<void> {
        const decision = await this.decisionRepository.findOne({ where: { id }, withDeleted: true });
        if (!decision) throw new NotFoundException('Karar bulunamadı.');
        if (!decision.deletedAt) throw new BadRequestException('Bu karar arşivlenmemiş.');
        await this.decisionRepository.restore({ id });
    }

    async findAllArchived(): Promise<Decision[]> {
        return this.decisionRepository.find({
            where: { deletedAt: Not(IsNull()) } as any,
            withDeleted: true,
            relations: ['application', 'application.program', 'application.user', 'commissioner'],
            order: { deletedAt: 'DESC' },
        });
    }
}

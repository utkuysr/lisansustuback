import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision, DecisionStatus } from './entities/decision.entity';
import { Application, ApplicationStatus } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { UserRole } from 'src/common/constants/roles.constants';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';

@Injectable()
export class DecisionService {
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
    ) {}

    private async assertCommissionerAssigned(commissionerId: number, programId: number) {
        const row = await this.programCommissionerRepo.findOne({
            where: { commissioner: { id: commissionerId }, program: { id: programId } } as any,
            select: ['id'],
        });
        if (!row) {
            throw new ForbiddenException('Bu programa atanmış komisyon üyesi değilsiniz.');
        }
    }

    async create(dto: CreateDecisionDto, commissionerId: number): Promise<Decision> {
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
            where: {
                application: { id: application.id },
                commissioner: { id: commissionerId },
            } as any,
            select: ['id'],
        });
        if (alreadyVoted) {
            throw new BadRequestException('Bu başvuru için zaten bir değerlendirme yapmışsınız. Güncelleme yapın.');
        }

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
            await this.applicationRepository.update(
                { id: application.id },
                { status: ApplicationStatus.UNDER_REVIEW, updatedAt: new Date() },
            );

            await this.notificationsService.create({
                userId: (application.user as any).id,
                type: NotificationType.APPLICATION_UNDER_REVIEW,
                title: 'Başvurunuz inceleniyor',
                message: `"${program.name}" programına başvurunuz komisyon tarafından incelenmeye başlandı.`,
                metadata: { applicationId: application.id, programId: program.id },
            }).catch(() => {});
        }

        await this.notificationsService.create({
            userId: (application.user as any).id,
            type: NotificationType.DECISION_MADE,
            title: 'Başvurunuz değerlendirildi',
            message: `"${program.name}" programına başvurunuz için bir komisyon üyesi değerlendirme yaptı.`,
            metadata: { applicationId: application.id, programId: program.id, decisionStatus: dto.status },
        }).catch(() => {});

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
            const app = await this.applicationRepository.findOne({
                where: { id: applicationId },
                relations: ['program'],
            });
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
        if (commissionerId) {
            await this.assertCommissionerAssigned(commissionerId, programId);
        }
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
        const now = new Date();
        if (now > new Date(program.EvaluationDate)) {
            throw new BadRequestException('Değerlendirme dönemi sona ermiştir. Güncelleme yapılamaz.');
        }

        await this.assertCommissionerAssigned(commissionerId, program.id);

        if (dto.status !== undefined) decision.status = dto.status;
        if (dto.notes !== undefined) decision.notes = dto.notes;
        if (dto.score !== undefined) decision.score = dto.score;
        decision.updatedAt = new Date();
        decision.updatedBy = commissionerId;

        return this.decisionRepository.save(decision);
    }

    async remove(id: number): Promise<void> {
        const decision = await this.decisionRepository.findOne({
            where: { id },
            relations: ['application'],
        });
        if (!decision) throw new NotFoundException('Karar bulunamadı.');
        await this.decisionRepository.remove(decision);
    }
}

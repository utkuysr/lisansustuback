import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus, VALID_STATUS_TRANSITIONS } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { User } from '../users/entities/user.entity';
import { Program } from '../programs/entities/program.entity';
import { University } from 'src/universities/entities/university.entity';
import { Department } from 'src/departments/entities/department.entity';
import { ApplicationDocument, ApplicationDocumentType } from 'src/documents/entities/application-document.entity';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { UserRole } from 'src/common/constants/roles.constants';
import { EmailService } from 'src/auth/services/email.service';

const DEFAULT_RELATIONS = ['program', 'user', 'university', 'department', 'decisions', 'decisions.commissioner', 'documents'];

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(ApplicationDocument)
    private readonly documentRepo: Repository<ApplicationDocument>,
    @InjectRepository(ProgramCommissioner)
    private readonly programCommissionerRepo: Repository<ProgramCommissioner>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private async validateFileRequirementsByDocuments(applicationId: number) {
    const docs = await this.documentRepo.find({
      where: { application: { id: applicationId } } as any,
      select: ['id', 'type'],
    });

    const hasTranscript = docs.some((d) => d.type === ApplicationDocumentType.TRANSCRIPT);
    const hasDiploma = docs.some((d) => d.type === ApplicationDocumentType.DIPLOMA);

    if (!hasTranscript) throw new BadRequestException('Transkript dosyası zorunludur.');
    if (!hasDiploma) throw new BadRequestException('Diploma dosyası zorunludur.');
  }

  private async checkQuota(programId: number): Promise<void> {
    const program = await this.programRepo.findOneBy({ id: programId });
    if (!program) return;

    const acceptedCount = await this.applicationRepo.count({
      where: { program: { id: programId }, status: ApplicationStatus.ACCEPTED } as any,
    });

    if (acceptedCount >= program.Quota) {
      throw new BadRequestException(`Bu programın kontenjanı dolmuştur (${program.Quota} kişi). Başvurunuz bekleme listesine alınacaktır.`);
    }
  }

  private validateStatusTransition(from: ApplicationStatus, to: ApplicationStatus, isAdmin: boolean): void {
    if (isAdmin) return;
    const allowed = VALID_STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`"${from}" durumundan "${to}" durumuna geçiş yapılamaz.`);
    }
  }

  async create(dto: CreateApplicationDto) {
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const program = await this.programRepo.findOneBy({ id: dto.programId });
    if (!program) throw new NotFoundException('Program bulunamadı.');

    if (!program.isActive) throw new BadRequestException('Bu program aktif değildir.');

    const now = new Date();
    if (now < new Date(program.ApplicationStartdate))
      throw new BadRequestException('Bu program için başvuru dönemi henüz başlamamıştır.');
    if (now > new Date(program.ApplicationEnddate))
      throw new BadRequestException('Bu program için başvuru dönemi sona ermiştir.');

    if (program.minAlesScore != null && dto.alesScore != null && dto.alesScore < program.minAlesScore)
      throw new BadRequestException(`Bu program için minimum ALES puanı ${program.minAlesScore}'dır. Girdiğiniz puan: ${dto.alesScore}.`);

    if (program.minGpa != null && dto.GradePointAverage != null) {
      // GradePointAverage is always sent in 4.0 scale (frontend converts 100-scale before sending)
      if (dto.GradePointAverage < program.minGpa)
        throw new BadRequestException(`Bu program için minimum not ortalaması ${program.minGpa} (4'lük sistem) olarak belirlenmiştir.`);
    }

    if (program.languageExamRequired && (dto.ydsScore == null || dto.ydsScore === 0))
      throw new BadRequestException('Bu program için dil sınavı belgesi zorunludur. YDS/YÖKDİL/TOEFL puanınızı girmeniz gerekmektedir.');

    if (program.minLanguageScore != null && dto.ydsScore != null && dto.ydsScore < program.minLanguageScore)
      throw new BadRequestException(`Bu program için minimum dil sınavı puanı ${program.minLanguageScore}'dır.`);

    const existing = await this.applicationRepo.findOne({
      where: { user: { id: user.id }, program: { id: program.id } } as any,
      select: ['id'],
    });
    if (existing) throw new BadRequestException('Bu programa daha önce başvuru yapılmış.');

    let university: University | undefined;
    if (dto.universityId) {
      const found = await this.universityRepo.findOneBy({ id: dto.universityId });
      if (!found) throw new BadRequestException('Belirtilen üniversite bulunamadı.');
      university = found;
    }

    let department: Department | undefined;
    if (dto.departmentId) {
      const found = await this.departmentRepo.findOneBy({ id: dto.departmentId });
      if (!found) throw new BadRequestException('Belirtilen bölüm bulunamadı.');
      department = found;
    }

    const application = this.applicationRepo.create({
      status: ApplicationStatus.DRAFT,
      GradePointAverage: dto.GradePointAverage,
      gpaScale: dto.gpaScale ?? '4.0',
      alesScore: dto.alesScore,
      ydsScore: dto.ydsScore,
      degreeType: dto.degreeType,
      graduateUniversity: dto.graduateUniversity,
      graduateFaculty: dto.graduateFaculty,
      graduateDepartment: dto.graduateDepartment,
      user,
      program,
      university,
      department,
    } as any);

    const saved = await this.applicationRepo.save(application) as unknown as Application;

    await this.notificationsService.create({
      userId: user.id,
      type: NotificationType.APPLICATION_SUBMITTED,
      title: 'Başvurunuz oluşturuldu',
      message: `"${program.name}" programına başvurunuz taslak olarak oluşturuldu.`,
      metadata: { applicationId: saved.id, programId: program.id },
    }).catch(() => {});

    return saved;
  }

  async findByUserId(userId: number) {
    return this.applicationRepo.find({
      where: { user: { id: userId } },
      relations: DEFAULT_RELATIONS,
    });
  }

  async findAll(page = 1, limit = 20, filters?: { programId?: number; status?: string }) {
    const qb = this.applicationRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.program', 'program')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.university', 'university')
      .leftJoinAndSelect('app.department', 'department')
      .leftJoinAndSelect('app.decisions', 'decisions')
      .leftJoinAndSelect('decisions.commissioner', 'commissioner')
      .leftJoinAndSelect('app.documents', 'documents');

    if (filters?.programId) qb.andWhere('program.id = :programId', { programId: filters.programId });
    if (filters?.status) qb.andWhere('app.status = :status', { status: filters.status });

    const [data, total] = await qb
      .orderBy('app.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findForCommissioner(commissionerId: number, page = 1, limit = 20, programId?: number) {
    const rows = await this.programCommissionerRepo.find({
      where: { commissioner: { id: commissionerId } } as any,
      relations: ['program'],
    });

    let programIds = rows.map((r) => (r.program as any)?.id).filter(Boolean);
    if (programIds.length === 0) return { data: [], total: 0, page, limit, pages: 0 };

    if (programId) {
      if (!programIds.includes(programId)) throw new ForbiddenException('Bu programa atanmış değilsiniz.');
      programIds = [programId];
    }

    const [data, total] = await this.applicationRepo.findAndCount({
      where: programIds.map((pid) => ({ program: { id: pid } })) as any,
      relations: DEFAULT_RELATIONS,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async assertCommissionerAssignedToProgram(params: { commissionerId: number; programId: number }) {
    const { commissionerId, programId } = params;
    const row = await this.programCommissionerRepo.findOne({
      where: { commissioner: { id: commissionerId }, program: { id: programId } } as any,
      select: ['id'],
    });
    if (!row) throw new BadRequestException('Bu programa atanmış komisyon üyesi değilsiniz.');
  }

  async findOne(id: number) {
    const app = await this.applicationRepo.findOne({
      where: { id },
      relations: DEFAULT_RELATIONS,
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    return app;
  }

  async update(id: number, dto: UpdateApplicationDto, requesterRole?: string) {
    const app = await this.findOne(id);
    const prevStatus = app.status;
    const isAdmin = requesterRole === UserRole.ADMIN;

    if (dto.status && dto.status !== prevStatus) {
      this.validateStatusTransition(prevStatus, dto.status as ApplicationStatus, isAdmin);
    }

    if (dto.status === ApplicationStatus.SUBMITTED || (dto.status && dto.status !== ApplicationStatus.DRAFT)) {
      await this.validateFileRequirementsByDocuments(app.id);
    }

    if (dto.programId) {
      const program = await this.programRepo.findOneBy({ id: dto.programId });
      if (!program) throw new NotFoundException('Program bulunamadı.');
      app.program = program;

      const dup = await this.applicationRepo.findOne({
        where: { user: { id: app.user.id }, program: { id: dto.programId } } as any,
        select: ['id'],
      });
      if (dup && dup.id !== app.id) throw new BadRequestException('Bu programa daha önce başvuru yapılmış.');
    }

    if (dto.universityId !== undefined) {
      app.university = dto.universityId
        ? await this.universityRepo.findOneBy({ id: dto.universityId }) ?? undefined
        : undefined;
      delete (dto as any).universityId;
    }

    if (dto.departmentId !== undefined) {
      app.department = dto.departmentId
        ? await this.departmentRepo.findOneBy({ id: dto.departmentId }) ?? undefined
        : undefined;
      delete (dto as any).departmentId;
    }

    Object.assign(app, dto);
    app.updatedAt = new Date();
    const saved = await this.applicationRepo.save(app);

    if (dto.status && dto.status !== prevStatus) {
      await this.sendStatusNotification(
        app.user.id, dto.status, (app.program as any)?.name ?? '', id,
        (app.user as any)?.email, (app.user as any)?.firstName,
      ).catch(() => {});
    }

    return saved;
  }

  private async sendStatusNotification(
    userId: number,
    status: string,
    programName: string,
    applicationId: number,
    userEmail?: string,
    firstName?: string,
  ) {
    const map: Record<string, { type: NotificationType; title: string; message: string }> = {
      [ApplicationStatus.SUBMITTED]: {
        type: NotificationType.APPLICATION_SUBMITTED,
        title: 'Başvurunuz alındı',
        message: `"${programName}" programına başvurunuz alındı.`,
      },
      [ApplicationStatus.UNDER_REVIEW]: {
        type: NotificationType.APPLICATION_UNDER_REVIEW,
        title: 'Başvurunuz değerlendiriliyor',
        message: `"${programName}" programına başvurunuz komisyon tarafından değerlendiriliyor.`,
      },
      [ApplicationStatus.INTERVIEW_REQUIRED]: {
        type: NotificationType.APPLICATION_INTERVIEW_REQUIRED,
        title: 'Mülakata davet edildiniz',
        message: `"${programName}" programına başvurunuz için mülakata davet edildiniz.`,
      },
      [ApplicationStatus.ACCEPTED]: {
        type: NotificationType.APPLICATION_ACCEPTED,
        title: 'Başvurunuz kabul edildi',
        message: `"${programName}" programına başvurunuz kabul edildi. Tebrikler!`,
      },
      [ApplicationStatus.REJECTED]: {
        type: NotificationType.APPLICATION_REJECTED,
        title: 'Başvurunuz reddedildi',
        message: `"${programName}" programına başvurunuz reddedildi.`,
      },
      [ApplicationStatus.WAITLISTED]: {
        type: NotificationType.APPLICATION_WAITLISTED,
        title: 'Yedek listeye alındınız',
        message: `"${programName}" programına başvurunuz yedek listesine alındı.`,
      },
    };

    const notif = map[status];
    if (!notif) return;
    await this.notificationsService.create({ userId, ...notif, metadata: { applicationId, programName } });

    // E-posta bildirimi (sadece final kararlar için)
    const emailStatuses = [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED, ApplicationStatus.WAITLISTED];
    if (userEmail && firstName && emailStatuses.includes(status as ApplicationStatus)) {
      this.emailService.sendDecisionNotification({
        to: userEmail,
        firstName,
        programName,
        status,
      }).catch(() => {});
    }
  }

  async cancel(id: number, userId: number): Promise<{ message: string }> {
    const app = await this.applicationRepo.findOne({ where: { id }, relations: ['user'] });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if ((app.user as any)?.id !== userId) throw new ForbiddenException('Bu başvuruyu iptal etme yetkiniz yok.');
    const cancelable = [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED];
    if (!cancelable.includes(app.status)) {
      throw new BadRequestException('Değerlendirme sürecine giren başvurular iptal edilemez.');
    }
    await this.applicationRepo.remove(app);
    return { message: 'Başvuru iptal edildi.' };
  }

  async remove(id: number) {
    // Kalıcı silme yalnızca arşivlenmiş başvurulara uygulanabilir
    const app = await this.applicationRepo.findOne({ where: { id }, withDeleted: true });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (!app.archivedAt) {
      throw new BadRequestException(
        'Aktif başvurular kalıcı olarak silinemez. Önce başvuruyu arşivleyin.',
      );
    }
    const RETENTION_DAYS = 30;
    const archivedMs = Date.now() - new Date(app.archivedAt).getTime();
    const archivedDays = archivedMs / (1000 * 60 * 60 * 24);
    if (archivedDays < RETENTION_DAYS) {
      throw new BadRequestException(
        `Başvuru, arşivlendikten ${RETENTION_DAYS} gün sonra kalıcı olarak silinebilir. ` +
        `Kalan süre: ${Math.ceil(RETENTION_DAYS - archivedDays)} gün.`,
      );
    }
    return this.applicationRepo.remove(app);
  }

  async archive(id: number, archiverId: number, reason?: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.applicationRepo.update(id, {
      archivedBy: archiverId,
      archiveReason: reason ?? null,
      updatedAt: new Date(),
    } as any);
    await this.applicationRepo.softDelete(id);
    return { message: 'Başvuru arşivlendi.' };
  }

  async restore(id: number): Promise<{ message: string }> {
    const result = await this.applicationRepo.restore(id);
    if (!result.affected) throw new NotFoundException('Arşivde böyle bir başvuru bulunamadı.');
    await this.applicationRepo.update(id, { archivedBy: null, archiveReason: null, updatedAt: new Date() } as any);
    return { message: 'Başvuru arşivden geri alındı.' };
  }

  async findArchived(page = 1, limit = 20) {
    const [data, total] = await this.applicationRepo
      .createQueryBuilder('app')
      .withDeleted()
      .leftJoinAndSelect('app.program', 'program')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.university', 'university')
      .leftJoinAndSelect('app.decisions', 'decisions')
      .leftJoinAndSelect('decisions.commissioner', 'commissioner')
      .leftJoinAndSelect('app.documents', 'documents')
      .where('app.archived_at IS NOT NULL')
      .orderBy('app.archived_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAcceptedCountForProgram(programId: number): Promise<number> {
    return this.applicationRepo.count({
      where: { program: { id: programId }, status: ApplicationStatus.ACCEPTED } as any,
    });
  }
}

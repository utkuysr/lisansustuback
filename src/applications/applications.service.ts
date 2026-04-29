import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
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
  ) {}

  private async validateFileRequirementsByDocuments(applicationId: number) {
    const docs = await this.documentRepo.find({
      where: { application: { id: applicationId } } as any,
      select: ['id', 'type'],
    });

    const hasTranscript = docs.some((d) => d.type === ApplicationDocumentType.TRANSCRIPT);
    const hasDiploma = docs.some((d) => d.type === ApplicationDocumentType.DIPLOMA);
    const hasYds = docs.some((d) => d.type === ApplicationDocumentType.YDS);

    if (!hasTranscript) throw new BadRequestException('Transcript dosyası zorunludur.');
    if (!hasDiploma && !hasYds) throw new BadRequestException('Diploma veya YDS dosyalarından en az biri zorunludur.');
  }

  async create(dto: CreateApplicationDto) {
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const program = await this.programRepo.findOneBy({ id: dto.programId });
    if (!program) throw new NotFoundException('Program bulunamadı.');

    const now = new Date();
    if (now < new Date(program.ApplicationStartdate))
      throw new BadRequestException('Bu program için başvuru dönemi henüz başlamamıştır.');
    if (now > new Date(program.ApplicationEnddate))
      throw new BadRequestException('Bu program için başvuru dönemi sona ermiştir.');

    const existing = await this.applicationRepo.findOne({
      where: { user: { id: user.id }, program: { id: program.id } } as any,
      select: ['id'],
    });
    if (existing) throw new BadRequestException('Bu programa daha önce başvuru yapılmış.');

    let university: University | undefined = undefined;
    if (dto.universityId) {
      const found = await this.universityRepo.findOneBy({ id: dto.universityId });
      if (!found) throw new BadRequestException('Belirtilen üniversite bulunamadı.');
      university = found;
    }

    let department: Department | undefined = undefined;
    if (dto.departmentId) {
      const found = await this.departmentRepo.findOneBy({ id: dto.departmentId });
      if (!found) throw new BadRequestException('Belirtilen bölüm bulunamadı.');
      department = found;
    }

    const application = this.applicationRepo.create({
      ...dto,
      status: (dto.status as any) || 'draft',
      user,
      program,
      university,
      department,
    });

    const saved = await this.applicationRepo.save(application);

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

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.applicationRepo.findAndCount({
      relations: DEFAULT_RELATIONS,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
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

  async update(id: number, dto: UpdateApplicationDto) {
    const app = await this.findOne(id);
    const prevStatus = app.status;

    if (dto.status && dto.status !== 'draft') {
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
      if (!dto.universityId) {
        app.university = undefined;
      } else {
        const univ = await this.universityRepo.findOneBy({ id: dto.universityId });
        if (!univ) throw new BadRequestException('Belirtilen üniversite bulunamadı.');
        app.university = univ;
      }
      delete (dto as any).universityId;
    }

    if (dto.departmentId !== undefined) {
      if (!dto.departmentId) {
        app.department = undefined;
      } else {
        const dept = await this.departmentRepo.findOneBy({ id: dto.departmentId });
        if (!dept) throw new BadRequestException('Belirtilen bölüm bulunamadı.');
        app.department = dept;
      }
      delete (dto as any).departmentId;
    }

    Object.assign(app, dto);
    const saved = await this.applicationRepo.save(app);

    if (dto.status && dto.status !== prevStatus) {
      await this.sendStatusNotification(app.user.id, dto.status, (app.program as any)?.name ?? '', id).catch(() => {});
    }

    return saved;
  }

  private async sendStatusNotification(userId: number, status: string, programName: string, applicationId: number) {
    const map: Record<string, { type: NotificationType; title: string; message: string }> = {
      [ApplicationStatus.SUBMITTED]: {
        type: NotificationType.APPLICATION_SUBMITTED,
        title: 'Başvurunuz gönderildi',
        message: `"${programName}" programına başvurunuz gönderildi ve incelemeye alınacak.`,
      },
      [ApplicationStatus.UNDER_REVIEW]: {
        type: NotificationType.APPLICATION_UNDER_REVIEW,
        title: 'Başvurunuz inceleniyor',
        message: `"${programName}" programına başvurunuz komisyon tarafından incelenmeye başlandı.`,
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
        title: 'Başvurunuz bekleme listesinde',
        message: `"${programName}" programına başvurunuz bekleme listesine alındı.`,
      },
    };

    const notif = map[status];
    if (!notif) return;
    await this.notificationsService.create({ userId, ...notif, metadata: { applicationId, programName } });
  }

  async remove(id: number) {
    const app = await this.findOne(id);
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
    await this.applicationRepo.update(id, {
      archivedBy: null,
      archiveReason: null,
      updatedAt: new Date(),
    } as any);
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
}

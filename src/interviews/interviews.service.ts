import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewStatus } from './entities/interview.entity';
import { Application, ApplicationStatus } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { UserRole } from 'src/common/constants/roles.constants';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProgramCommissioner)
    private readonly programCommissionerRepo: Repository<ProgramCommissioner>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateInterviewDto, createdBy: number): Promise<Interview> {
    const application = await this.applicationRepo.findOne({
      where: { id: dto.applicationId },
      relations: ['program', 'user'],
    });
    if (!application) throw new NotFoundException('Başvuru bulunamadı.');

    if (application.status !== ApplicationStatus.INTERVIEW_REQUIRED) {
      throw new ForbiddenException('Mülakat yalnızca "Mülakat Gerekli" durumundaki başvurular için oluşturulabilir.');
    }

    let interviewer: User | undefined;
    if (dto.interviewerId) {
      const u = await this.userRepo.findOneBy({ id: dto.interviewerId });
      if (!u) throw new NotFoundException('Mülakat yapacak kullanıcı bulunamadı.');
      interviewer = u;
    }

    const interview = this.interviewRepo.create({
      application,
      scheduledAt: dto.scheduledAt,
      location: dto.location,
      notes: dto.notes,
      interviewer,
      createdBy,
    });

    const saved = await this.interviewRepo.save(interview);

    await this.notificationsService.create({
      userId: (application.user as any).id,
      type: NotificationType.INTERVIEW_SCHEDULED,
      title: 'Mülakatınız planlandı',
      message: `"${(application.program as any)?.name}" programı için mülakatınız ${new Date(dto.scheduledAt).toLocaleString('tr-TR')} tarihine planlandı.`,
      metadata: { applicationId: application.id, interviewId: saved.id },
    }).catch(() => {});

    return saved;
  }

  async findAll(): Promise<Interview[]> {
    return this.interviewRepo.find({
      relations: ['application', 'application.program', 'application.user', 'interviewer'],
      order: { scheduledAt: 'ASC' },
    });
  }

  async findByApplication(applicationId: number, requesterId: number, requesterRole: string): Promise<Interview[]> {
    if (requesterRole !== UserRole.ADMIN) {
      const application = await this.applicationRepo.findOne({
        where: { id: applicationId },
        relations: ['user', 'program'],
      });
      if (!application) throw new NotFoundException('Başvuru bulunamadı.');

      if (requesterRole === UserRole.STUDENT) {
        const appUserId = (application.user as any)?.id;
        if (appUserId !== requesterId) throw new ForbiddenException('Bu başvurunun mülakatlarını görme yetkiniz yok.');
      } else if (requesterRole === UserRole.KOMISYON_UYESI) {
        const programId = (application.program as any)?.id;
        const assigned = await this.programCommissionerRepo.findOne({
          where: { commissioner: { id: requesterId }, program: { id: programId } } as any,
          select: ['id'],
        });
        if (!assigned) throw new ForbiddenException('Bu programa atanmış komisyon üyesi değilsiniz.');
      }
    }

    return this.interviewRepo.find({
      where: { applicationId },
      relations: ['application', 'application.program', 'application.user', 'interviewer'],
      order: { scheduledAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Interview> {
    const interview = await this.interviewRepo.findOne({
      where: { id },
      relations: ['application', 'application.program', 'application.user', 'interviewer'],
    });
    if (!interview) throw new NotFoundException('Mülakat bulunamadı.');
    return interview;
  }

  async update(id: number, dto: UpdateInterviewDto, updatedBy: number): Promise<Interview> {
    const interview = await this.findOne(id);

    if (dto.interviewerId !== undefined) {
      if (!dto.interviewerId) {
        interview.interviewer = undefined;
      } else {
        const u = await this.userRepo.findOneBy({ id: dto.interviewerId });
        if (!u) throw new NotFoundException('Kullanıcı bulunamadı.');
        interview.interviewer = u;
      }
    }

    if (dto.scheduledAt !== undefined) interview.scheduledAt = dto.scheduledAt;
    if (dto.status !== undefined) interview.status = dto.status;
    if (dto.location !== undefined) interview.location = dto.location;
    if (dto.notes !== undefined) interview.notes = dto.notes;
    if (dto.score !== undefined) interview.score = dto.score;
    interview.updatedAt = new Date();
    interview.updatedBy = updatedBy;

    return this.interviewRepo.save(interview);
  }

  async remove(id: number): Promise<{ message: string }> {
    const interview = await this.findOne(id);
    await this.interviewRepo.remove(interview);
    return { message: 'Mülakat silindi.' };
  }
}

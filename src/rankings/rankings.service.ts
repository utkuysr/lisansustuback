import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProgramRanking, RankingEntry } from './entities/program-ranking.entity';
import { Application, ApplicationStatus } from 'src/applications/entities/application.entity';
import { Program } from 'src/programs/entities/program.entity';
import { Decision, DecisionStatus } from 'src/decision/entities/decision.entity';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { InstituteManager } from 'src/institute-managers/entities/institute-manager.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { UserRole } from 'src/common/constants/roles.constants';
import { EmailService } from 'src/auth/services/email.service';

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(ProgramRanking)
    private readonly rankingRepo: Repository<ProgramRanking>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Decision)
    private readonly decisionRepo: Repository<Decision>,
    @InjectRepository(ProgramCommissioner)
    private readonly programCommissionerRepo: Repository<ProgramCommissioner>,
    @InjectRepository(InstituteManager)
    private readonly instituteManagerRepo: Repository<InstituteManager>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async calculateRanking(programId: number): Promise<ProgramRanking> {
    const program = await this.programRepo.findOneBy({ id: programId });
    if (!program) throw new NotFoundException('Program bulunamadı.');

    const hasInterview = program.hasInterview ?? false;

    // Detect phase: if there are interview_required apps, we're in phase 2 (final)
    const interviewApps = await this.appRepo.find({
      where: { program: { id: programId }, status: ApplicationStatus.INTERVIEW_REQUIRED } as any,
      relations: ['user', 'decisions', 'decisions.commissioner'],
    });
    const isFinalPhase = hasInterview && interviewApps.length > 0;

    const applications = isFinalPhase
      ? interviewApps
      : await this.appRepo.find({
          where: {
            program: { id: programId },
            status: In([ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SUBMITTED]),
          } as any,
          relations: ['user', 'decisions', 'decisions.commissioner'],
        });

    const commissioners = await this.programCommissionerRepo.find({
      where: { program: { id: programId } } as any,
    });
    const totalCommissioners = commissioners.length;

    const gpaWeight = program.gpaWeight ?? 0;
    const alesWeight = program.alesWeight ?? 0;
    const ydsWeight = program.writtenExamWeight ?? 0;
    const interviewWeight = program.interviewWeight ?? 0;
    const totalWeight = gpaWeight + alesWeight + ydsWeight + interviewWeight;

    const scored: { entry: RankingEntry; rejected: boolean }[] = [];

    for (const app of applications) {
      const decisions = app.decisions ?? [];
      if (decisions.length < totalCommissioners && totalCommissioners > 0) continue;

      const rejectedVotes = decisions.filter((d) => d.status === DecisionStatus.REJECTED).length;
      const majorityRejected = totalCommissioners > 0 && rejectedVotes > totalCommissioners / 2;

      const scoringDecisions = decisions.filter((d) => d.score != null);
      const avgScore =
        scoringDecisions.length > 0
          ? scoringDecisions.reduce((sum, d) => sum + (d.score ?? 0), 0) / scoringDecisions.length
          : 0;

      let totalScore = 0;
      if (totalWeight > 0) {
        const gpa = app.GradePointAverage ?? 0;
        const gpaScale = app.gpaScale ?? '4.0';
        const normalizedGpa = gpaScale === '4.0' ? (gpa / 4) * 100 : gpa;
        totalScore =
          (normalizedGpa * gpaWeight +
            (app.alesScore ?? 0) * alesWeight +
            (app.ydsScore ?? 0) * ydsWeight +
            avgScore * (isFinalPhase ? interviewWeight : (program.interviewWeight ?? 0))) /
          totalWeight;
      } else {
        totalScore = avgScore;
      }

      const entry: RankingEntry = {
        applicationId: app.id,
        rank: 0,
        totalScore: Math.round(totalScore * 100) / 100,
        commissionerScore: isFinalPhase ? 0 : Math.round(avgScore * 100) / 100,
        interviewScore: isFinalPhase ? Math.round(avgScore * 100) / 100 : undefined,
        gpa: app.GradePointAverage ?? 0,
        alesScore: app.alesScore ?? 0,
        ydsScore: app.ydsScore ?? 0,
        decision: majorityRejected ? 'rejected' : 'accepted',
        applicantName: `${app.user?.firstName ?? ''} ${app.user?.lastName ?? ''}`.trim(),
        applicantEmail: app.user?.email ?? '',
        graduateUniversity: (app as any).graduateUniversity,
        graduateFaculty: (app as any).graduateFaculty,
        graduateDepartment: (app as any).graduateDepartment,
      };

      scored.push({ entry, rejected: majorityRejected });
    }

    const quota = program.Quota ?? 0;
    const nonRejected = scored
      .filter((s) => !s.rejected)
      .sort((a, b) => b.entry.totalScore - a.entry.totalScore);
    const rejected = scored.filter((s) => s.rejected);

    // ── Phase 1: interview program, first evaluation ──────────────────────
    if (hasInterview && !isFinalPhase) {
      const rankingData: RankingEntry[] = [
        ...nonRejected.map((s, i) => ({
          ...s.entry,
          rank: i + 1,
          decision: i < quota ? ('accepted' as const) : ('rejected' as const),
        })),
        ...rejected.map((s) => ({ ...s.entry, rank: -1, decision: 'rejected' as const })),
      ];

      // Update application statuses and clear decision scores for interview candidates
      for (let i = 0; i < nonRejected.length; i++) {
        const appId = nonRejected[i].entry.applicationId;
        if (i < quota) {
          await this.appRepo.update(
            { id: appId },
            { status: ApplicationStatus.INTERVIEW_REQUIRED, updatedAt: new Date() },
          );
          // Reset scores so commissioners enter fresh interview scores
          const existingDecisions = await this.decisionRepo.find({
            where: { application: { id: appId } } as any,
          });
          for (const d of existingDecisions) {
            d.score = null as any;
            d.updatedAt = new Date();
            await this.decisionRepo.save(d);
          }
          // Notify candidate
          const candidateApp = applications.find((a) => a.id === appId);
          const userId = (candidateApp?.user as any)?.id;
          if (userId) {
            await this.notificationsService
              .create({
                userId,
                type: NotificationType.APPLICATION_INTERVIEW_REQUIRED,
                title: 'Mülakata davet edildiniz',
                message: `"${program.name}" programı için ön değerlendirmeyi geçtiniz ve mülakata davet edildiniz.`,
                metadata: { applicationId: appId, programId },
              })
              .catch(() => {});
          }
        } else {
          await this.appRepo.update(
            { id: appId },
            { status: ApplicationStatus.REJECTED, updatedAt: new Date() },
          );
        }
      }
      for (const r of rejected) {
        await this.appRepo.update(
          { id: r.entry.applicationId },
          { status: ApplicationStatus.REJECTED, updatedAt: new Date() },
        );
      }

      let ranking = await this.rankingRepo.findOne({
        where: { program: { id: programId } } as any,
      });
      if (ranking) {
        ranking.rankingData = rankingData;
        ranking.status = 'interview_phase';
        ranking.updatedAt = new Date();
      } else {
        ranking = this.rankingRepo.create({ program, rankingData, status: 'interview_phase' });
      }
      return this.rankingRepo.save(ranking);
    }

    // ── Final phase (no interview, or after interview scores entered) ──────
    const rankingData: RankingEntry[] = [
      ...nonRejected.map((s, i) => ({
        ...s.entry,
        rank: i + 1,
        decision: i < quota ? ('accepted' as const) : ('waitlisted' as const),
      })),
      ...rejected.map((s) => ({ ...s.entry, rank: -1, decision: 'rejected' as const })),
    ];

    let ranking = await this.rankingRepo.findOne({
      where: { program: { id: programId } } as any,
    });
    if (ranking) {
      ranking.rankingData = rankingData;
      ranking.status = 'pending_approval';
      ranking.updatedAt = new Date();
      ranking.approvedBy = undefined;
      ranking.approvedAt = undefined;
    } else {
      ranking = this.rankingRepo.create({ program, rankingData, status: 'pending_approval' });
    }

    const saved = await this.rankingRepo.save(ranking);

    // Notify institute manager
    const instituteId = (program.institute as any)?.id;
    if (instituteId) {
      const manager = await this.instituteManagerRepo.findOne({
        where: { institute: { id: instituteId } } as any,
        relations: ['user'],
      });
      if (manager?.user?.id) {
        await this.notificationsService
          .create({
            userId: manager.user.id,
            type: NotificationType.GENERAL,
            title: 'Liste onay bekliyor',
            message: `"${program.name}" programı için ${hasInterview ? 'mülakat değerlendirmeleri' : 'komisyon değerlendirmesi'} tamamlandı. Nihai listeyi onaylamanız bekleniyor.`,
            metadata: { programId, rankingId: saved.id },
          })
          .catch(() => {});
      }
    }

    return saved;
  }

  async findAll(requesterId: number, requesterRole: string): Promise<ProgramRanking[]> {
    if (requesterRole === UserRole.ADMIN) {
      return this.rankingRepo.find({ order: { createdAt: 'DESC' } });
    }
    if (requesterRole === UserRole.INSTITUTE_MANAGER) {
      const assignment = await this.instituteManagerRepo.findOne({
        where: { user: { id: requesterId } } as any,
        relations: ['institute'],
      });
      if (!assignment) return [];
      const rankings = await this.rankingRepo.find({ order: { createdAt: 'DESC' } });
      return rankings.filter(
        (r) => (r.program?.institute as any)?.id === assignment.institute?.id,
      );
    }
    throw new ForbiddenException('Yetkiniz yok.');
  }

  async findByProgram(
    programId: number,
    requesterId: number,
    requesterRole: string,
  ): Promise<ProgramRanking | null> {
    await this.assertAccess(programId, requesterId, requesterRole);
    return this.rankingRepo.findOne({ where: { program: { id: programId } } as any });
  }

  async overrideDecision(
    rankingId: number,
    applicationId: number,
    decision: 'accepted' | 'waitlisted' | 'rejected',
    requesterId: number,
    requesterRole: string,
  ): Promise<ProgramRanking> {
    const ranking = await this.rankingRepo.findOneBy({ id: rankingId });
    if (!ranking) throw new NotFoundException('Sıralama bulunamadı.');
    if (ranking.status === 'approved')
      throw new BadRequestException('Onaylanmış sıralama değiştirilemez.');

    await this.assertAccess((ranking.program as any)?.id, requesterId, requesterRole);

    const entry = ranking.rankingData?.find((e) => e.applicationId === applicationId);
    if (!entry) throw new NotFoundException('Başvuru sıralamada bulunamadı.');

    entry.decision = decision;
    entry.overridden = true;
    ranking.updatedAt = new Date();

    return this.rankingRepo.save(ranking);
  }

  async approve(
    rankingId: number,
    requesterId: number,
    requesterRole: string,
  ): Promise<ProgramRanking> {
    const ranking = await this.rankingRepo.findOne({
      where: { id: rankingId },
      relations: ['program'],
    });
    if (!ranking) throw new NotFoundException('Sıralama bulunamadı.');
    if (ranking.status === 'approved')
      throw new BadRequestException('Bu liste zaten onaylandı.');

    await this.assertAccess((ranking.program as any)?.id, requesterId, requesterRole);

    for (const entry of ranking.rankingData ?? []) {
      const newStatus =
        entry.decision === 'accepted'
          ? ApplicationStatus.ACCEPTED
          : entry.decision === 'waitlisted'
          ? ApplicationStatus.WAITLISTED
          : ApplicationStatus.REJECTED;

      const app = await this.appRepo.findOne({
        where: { id: entry.applicationId },
        relations: ['user', 'program'],
      });
      if (!app) continue;

      await this.appRepo.update(
        { id: entry.applicationId },
        { status: newStatus, updatedAt: new Date() },
      );

      const userId = (app.user as any)?.id;
      if (!userId) continue;

      const programName = (app.program as any)?.name ?? '';
      const notifMap: Partial<
        Record<ApplicationStatus, { type: NotificationType; title: string; message: string }>
      > = {
        [ApplicationStatus.ACCEPTED]: {
          type: NotificationType.APPLICATION_ACCEPTED,
          title: 'Başvurunuz kabul edildi',
          message: `Tebrikler! "${programName}" programına başvurunuz kabul edildi.`,
        },
        [ApplicationStatus.REJECTED]: {
          type: NotificationType.APPLICATION_REJECTED,
          title: 'Başvurunuz reddedildi',
          message: `"${programName}" programına başvurunuz reddedildi.`,
        },
        [ApplicationStatus.WAITLISTED]: {
          type: NotificationType.APPLICATION_WAITLISTED,
          title: 'Başvurunuz yedek listede',
          message: `"${programName}" programına başvurunuz yedek listesine alındı.`,
        },
      };

      const notif = notifMap[newStatus];
      if (notif) {
        await this.notificationsService
          .create({ userId, ...notif, metadata: { applicationId: entry.applicationId } })
          .catch(() => {});
      }

      const userEmail = (app.user as any)?.email;
      const userFirstName = (app.user as any)?.firstName;
      if (userEmail && userFirstName) {
        this.emailService
          .sendDecisionNotification({
            to: userEmail,
            firstName: userFirstName,
            programName: (app.program as any)?.name ?? '',
            status: entry.decision,
          })
          .catch(() => {});
      }
    }

    ranking.status = 'approved';
    ranking.approvedAt = new Date();
    ranking.approvedBy = { id: requesterId } as any;
    ranking.updatedAt = new Date();

    return this.rankingRepo.save(ranking);
  }

  // Triggered after all commissioners vote on under_review applications
  async checkAndTriggerRanking(programId: number): Promise<void> {
    const commissioners = await this.programCommissionerRepo.find({
      where: { program: { id: programId } } as any,
      relations: ['commissioner'],
    });
    if (commissioners.length === 0) return;

    const applications = await this.appRepo.find({
      where: { program: { id: programId }, status: ApplicationStatus.UNDER_REVIEW } as any,
      relations: ['decisions'],
    });
    if (applications.length === 0) return;

    const allVoted = applications.every(
      (app) => (app.decisions?.length ?? 0) >= commissioners.length,
    );

    if (allVoted) {
      await this.calculateRanking(programId).catch(() => {});
    }
  }

  // Triggered after commissioners enter interview scores for interview_required applications
  async checkAndTriggerFinalRanking(programId: number): Promise<void> {
    const commissioners = await this.programCommissionerRepo.find({
      where: { program: { id: programId } } as any,
    });
    if (commissioners.length === 0) return;

    const applications = await this.appRepo.find({
      where: { program: { id: programId }, status: ApplicationStatus.INTERVIEW_REQUIRED } as any,
      relations: ['decisions'],
    });
    if (applications.length === 0) return;

    // All interview candidates must have scores from all commissioners
    const allScored = applications.every((app) => {
      const scoredDecisions = (app.decisions ?? []).filter((d) => d.score != null);
      return scoredDecisions.length >= commissioners.length;
    });

    if (allScored) {
      await this.calculateRanking(programId).catch(() => {});
    }
  }

  private async assertAccess(
    programId: number,
    requesterId: number,
    requesterRole: string,
  ): Promise<void> {
    if (requesterRole === UserRole.ADMIN) return;
    if (requesterRole === UserRole.INSTITUTE_MANAGER) {
      const program = await this.programRepo.findOneBy({ id: programId });
      if (!program) throw new NotFoundException('Program bulunamadı.');
      const instituteId = (program.institute as any)?.id;
      const assignment = await this.instituteManagerRepo.findOne({
        where: { user: { id: requesterId }, institute: { id: instituteId } } as any,
      });
      if (!assignment) throw new ForbiddenException('Bu programa erişim yetkiniz yok.');
      return;
    }
    throw new ForbiddenException('Yetkiniz yok.');
  }
}

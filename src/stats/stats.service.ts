import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { Program } from 'src/programs/entities/program.entity';
import { Decision } from 'src/decision/entities/decision.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Decision)
    private readonly decisionRepo: Repository<Decision>,
  ) {}

  async getOverview() {
    const [totalUsers, totalApplications, totalPrograms, totalDecisions] = await Promise.all([
      this.userRepo.count(),
      this.applicationRepo.count(),
      this.programRepo.count(),
      this.decisionRepo.count(),
    ]);

    const usersByRole = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .select('r.name', 'role')
      .addSelect('COUNT(u.id)', 'count')
      .groupBy('r.name')
      .getRawMany();

    const applicationsByStatus = await this.applicationRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('a.status')
      .getRawMany();

    return { totalUsers, totalApplications, totalPrograms, totalDecisions, usersByRole, applicationsByStatus };
  }

  async getApplicationStats() {
    const byStatus = await this.applicationRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('a.status')
      .getRawMany();

    const byProgram = await this.applicationRepo
      .createQueryBuilder('a')
      .leftJoin('a.program', 'p')
      .select('p.id', 'programId')
      .addSelect('p.name', 'programName')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('p.id, p.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    const recentByDay = await this.applicationRepo
      .createQueryBuilder('a')
      .select("DATE_TRUNC('day', a.createdAt)", 'date')
      .addSelect('COUNT(a.id)', 'count')
      .where("a.createdAt >= NOW() - INTERVAL '30 days'")
      .groupBy("DATE_TRUNC('day', a.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return { byStatus, byProgram, recentByDay };
  }

  async getProgramStats() {
    return this.programRepo
      .createQueryBuilder('p')
      .leftJoin('p.department', 'd')
      .leftJoin('p.institute', 'i')
      .leftJoin(
        (qb) =>
          qb
            .select('a."programId"', 'programId')
            .addSelect('COUNT(a.id)', 'cnt')
            .addSelect(`SUM(CASE WHEN a.status = '${ApplicationStatus.ACCEPTED}' THEN 1 ELSE 0 END)`, 'acceptedCnt')
            .addSelect(`SUM(CASE WHEN a.status = '${ApplicationStatus.REJECTED}' THEN 1 ELSE 0 END)`, 'rejectedCnt')
            .from('belek_graduate_admission.applications', 'a')
            .where('a.archived_at IS NULL')
            .groupBy('a."programId"'),
        'apps',
        'apps."programId" = p.id',
      )
      .select('p.id', 'id')
      .addSelect('p.name', 'name')
      .addSelect('p."Quota"', 'quota')
      .addSelect('p.degree_type', 'degreeType')
      .addSelect('p.is_active', 'isActive')
      .addSelect('d.name', 'departmentName')
      .addSelect('i.name', 'instituteName')
      .addSelect('COALESCE(apps.cnt, 0)', 'applicationCount')
      .addSelect('COALESCE(apps.acceptedCnt, 0)', 'acceptedCount')
      .addSelect('COALESCE(apps.rejectedCnt, 0)', 'rejectedCount')
      .addSelect(
        `CASE WHEN COALESCE(apps.cnt, 0) = 0 THEN 0 ELSE ROUND((COALESCE(apps.acceptedCnt, 0)::decimal / apps.cnt::decimal) * 100, 1) END`,
        'acceptanceRate',
      )
      .orderBy('COALESCE(apps.cnt, 0)', 'DESC')
      .getRawMany();
  }

  async getUserStats() {
    const byRole = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .select('r.name', 'role')
      .addSelect('COUNT(u.id)', 'count')
      .groupBy('r.name')
      .getRawMany();

    const recentRegistrations = await this.userRepo
      .createQueryBuilder('u')
      .select("DATE_TRUNC('day', u.createDate)", 'date')
      .addSelect('COUNT(u.id)', 'count')
      .where("u.createDate >= NOW() - INTERVAL '30 days'")
      .groupBy("DATE_TRUNC('day', u.createDate)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return { byRole, recentRegistrations };
  }

  async getDecisionStats() {
    const avgScoreByProgram = await this.decisionRepo
      .createQueryBuilder('d')
      .leftJoin('d.application', 'a')
      .leftJoin('a.program', 'p')
      .select('p.id', 'programId')
      .addSelect('p.name', 'programName')
      .addSelect('AVG(d.score)', 'avgScore')
      .addSelect('COUNT(d.id)', 'decisionCount')
      .where('d.score IS NOT NULL')
      .groupBy('p.id, p.name')
      .orderBy('avgScore', 'DESC')
      .getRawMany();

    const pendingByCommissioner = await this.decisionRepo
      .createQueryBuilder('d')
      .leftJoin('d.commissioner', 'u')
      .select('u.id', 'commissionerId')
      .addSelect("CONCAT(u.first_name, ' ', u.last_name)", 'commissionerName')
      .addSelect('COUNT(d.id)', 'decidedCount')
      .groupBy('u.id, u.first_name, u.last_name')
      .getRawMany();

    const byStatus = await this.decisionRepo
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(d.id)', 'count')
      .groupBy('d.status')
      .getRawMany();

    return { avgScoreByProgram, pendingByCommissioner, byStatus };
  }
}

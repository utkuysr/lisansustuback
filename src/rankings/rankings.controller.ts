import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@UseGuards(JwtAuthGuard)
@Controller('rankings')
export class RankingsController {
  constructor(private readonly service: RankingsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.sub, req.user.role);
  }

  @Get('program/:programId')
  findByProgram(@Param('programId', ParseIntPipe) programId: number, @Request() req: any) {
    return this.service.findByProgram(programId, req.user.sub, req.user.role);
  }

  @Post('program/:programId/calculate')
  calculate(@Param('programId', ParseIntPipe) programId: number, @Request() req: any) {
    const role = req.user.role;
    if (role !== UserRole.ADMIN && role !== UserRole.INSTITUTE_MANAGER) {
      throw new Error('Yetkiniz yok.');
    }
    return this.service.calculateRanking(programId);
  }

  @Post(':rankingId/approve')
  approve(@Param('rankingId', ParseIntPipe) rankingId: number, @Request() req: any) {
    return this.service.approve(rankingId, req.user.sub, req.user.role);
  }

  @Put(':rankingId/override')
  override(
    @Param('rankingId', ParseIntPipe) rankingId: number,
    @Body() body: { applicationId: number; decision: 'accepted' | 'waitlisted' | 'rejected' },
    @Request() req: any,
  ) {
    return this.service.overrideDecision(rankingId, body.applicationId, body.decision, req.user.sub, req.user.role);
  }

  @Post(':rankingId/schedule-interviews')
  scheduleInterviews(
    @Param('rankingId', ParseIntPipe) rankingId: number,
    @Body() body: { scheduledAt: string; location: string; notes?: string },
    @Request() req: any,
  ) {
    return this.service.scheduleInterviews(rankingId, body, req.user.sub, req.user.role);
  }

  @Put(':rankingId/interview-scores')
  updateInterviewScores(
    @Param('rankingId', ParseIntPipe) rankingId: number,
    @Body() body: { entries: { applicationId: number; interviewScore: number }[] },
    @Request() req: any,
  ) {
    return this.service.updateInterviewScores(rankingId, body.entries, req.user.sub, req.user.role);
  }
}

import { Controller, ForbiddenException, Get, Request, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly service: StatsService) {}

  private assertAdmin(req: any) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin erişebilir.');
  }

  @Get()
  getOverview(@Request() req) {
    this.assertAdmin(req);
    return this.service.getOverview();
  }

  @Get('applications')
  getApplicationStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getApplicationStats();
  }

  @Get('programs')
  getProgramStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getProgramStats();
  }

  @Get('users')
  getUserStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getUserStats();
  }
}

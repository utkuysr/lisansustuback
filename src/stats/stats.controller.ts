import { Controller, ForbiddenException, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@ApiTags('admin/stats')
@ApiBearerAuth()
@Controller('admin/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly service: StatsService) {}

  private assertAdmin(req: any) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin erişebilir.');
  }

  @Get()
  @ApiOperation({ summary: 'Genel özet istatistikler' })
  getOverview(@Request() req) {
    this.assertAdmin(req);
    return this.service.getOverview();
  }

  @Get('applications')
  @ApiOperation({ summary: 'Başvuru istatistikleri' })
  getApplicationStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getApplicationStats();
  }

  @Get('programs')
  @ApiOperation({ summary: 'Program istatistikleri (kontenjan doluluk, kabul oranı)' })
  getProgramStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getProgramStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Kullanıcı istatistikleri' })
  getUserStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getUserStats();
  }

  @Get('decisions')
  @ApiOperation({ summary: 'Karar istatistikleri (ortalama skor, komisyon üyesi bazında)' })
  getDecisionStats(@Request() req) {
    this.assertAdmin(req);
    return this.service.getDecisionStats();
  }
}

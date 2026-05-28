import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { InstituteManagersService } from './institute-managers.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';
import { ForbiddenException } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('institute-managers')
export class InstituteManagersController {
  constructor(private readonly service: InstituteManagersService) {}

  @Get()
  async findAll(@Request() req: any) {
    if (req.user.role === UserRole.ADMIN) return this.service.findAll();
    if (req.user.role === UserRole.INSTITUTE_MANAGER) {
      const profile = await this.service.findMyProfile(req.user.sub);
      return profile ? [profile] : [];
    }
    throw new ForbiddenException();
  }

  @Get('my-profile')
  getMyProfile(@Request() req: any) {
    return this.service.findMyProfile(req.user.sub);
  }

  @Post()
  create(@Body() body: { userId: number; instituteId: number }, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException();
    return this.service.create(body.userId, body.instituteId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException();
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException();
    return this.service.restore(id);
  }
}

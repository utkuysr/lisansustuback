import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  findAll(@Query('instituteId') instituteId?: string, @Query('withArchived') withArchived?: string) {
    return this.service.findAll(instituteId ? +instituteId : undefined, withArchived === 'true');
  }

  @Get('archived')
  findArchived(@Query('instituteId') instituteId?: string) {
    return this.service.findArchived(instituteId ? +instituteId : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDepartmentDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin bölüm oluşturabilir.');
    return this.service.create(dto, req.user.sub);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepartmentDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin bölüm güncelleyebilir.');
    return this.service.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin anabilim dalı arşivleyebilir.');
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin anabilim dalı geri yükleyebilir.');
    return this.service.restore(id);
  }
}

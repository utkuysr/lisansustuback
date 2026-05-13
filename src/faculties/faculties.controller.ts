import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@Controller('faculties')
@UseGuards(JwtAuthGuard)
export class FacultiesController {
  constructor(private readonly service: FacultiesService) {}

  @Get()
  findAll(@Query('universityId') universityId?: string) {
    return this.service.findAll(universityId ? +universityId : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFacultyDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin fakülte oluşturabilir.');
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFacultyDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin fakülte güncelleyebilir.');
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin fakülte silebilir.');
    return this.service.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InstituteService } from './institute.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@ApiTags('institutes')
@ApiBearerAuth()
@Controller('institutes')
@UseGuards(JwtAuthGuard)
export class InstituteController {
  constructor(private readonly institutesService: InstituteService) {}

  @Post()
  @ApiOperation({ summary: 'Enstitü oluştur (Admin)' })
  async create(@Body() createDto: CreateInstituteDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin enstitü oluşturabilir.');
    return this.institutesService.create(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Enstitüleri listele' })
  @ApiQuery({ name: 'universityId', required: false, type: Number })
  async findAll(@Query('universityId') universityId?: string) {
    return this.institutesService.findAll(universityId ? +universityId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Enstitü detayı' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institutesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Enstitü güncelle (Admin)' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateInstituteDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin enstitü güncelleyebilir.');
    return this.institutesService.update(id, updateDto, req.user.sub);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Enstitü arşivle (Admin)' })
  async archive(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin arşivleyebilir.');
    return this.institutesService.archive(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Enstitüyü arşivden geri al (Admin)' })
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin arşivden geri alabilir.');
    return this.institutesService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Enstitü sil (Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin enstitü silebilir.');
    return this.institutesService.remove(id);
  }
}

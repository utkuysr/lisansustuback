import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Post, Put, Request, UseGuards, ForbiddenException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@ApiTags('interviews')
@ApiBearerAuth()
@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Mülakat oluştur (Admin veya Komisyon Üyesi)' })
  async create(@Body() dto: CreateInterviewDto, @Request() req) {
    if (req.user.role === UserRole.STUDENT) throw new ForbiddenException('Öğrenciler mülakat oluşturamaz.');
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm mülakatları listele (Admin)' })
  async findAll(@Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin tüm mülakatları görebilir.');
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @ApiOperation({ summary: 'Başvuruya ait mülakatlar' })
  async findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Request() req,
  ) {
    return this.service.findByApplication(applicationId, req.user.sub, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mülakat detayı' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mülakat güncelle (Admin veya Komisyon Üyesi)' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInterviewDto, @Request() req) {
    if (req.user.role === UserRole.STUDENT) throw new ForbiddenException('Öğrenciler mülakat güncelleyemez.');
    return this.service.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mülakat arşivle (Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin mülakat arşivleyebilir.');
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arşivlenen mülakatı geri yükle (Admin)' })
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin mülakat geri yükleyebilir.');
    return this.service.restore(id);
  }

  @Get('archived/list')
  @ApiOperation({ summary: 'Arşivlenen mülakatları listele (Admin)' })
  async findArchived(@Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Sadece admin arşivlenen mülakatları görebilir.');
    return this.service.findAllArchived();
  }
}

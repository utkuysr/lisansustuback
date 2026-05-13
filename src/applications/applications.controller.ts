import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ArchiveApplicationDto } from './dto/archive-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Giriş yapan kullanıcının kendi başvuruları' })
  async findMyApplications(@Request() req) {
    return this.applicationsService.findByUserId(req.user.sub);
  }

  @Get('archived')
  @ApiOperation({ summary: 'Arşivlenmiş başvurular (Admin)' })
  async findArchived(@Request() req, @Query() pagination: PaginationDto) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Yalnızca admin arşivi görüntüleyebilir.');
    return this.applicationsService.findArchived(pagination.page, pagination.limit);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Başvuruyu arşivle (Admin)' })
  async archive(@Param('id', ParseIntPipe) id: number, @Body() dto: ArchiveApplicationDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Yalnızca admin arşivleyebilir.');
    return this.applicationsService.archive(id, req.user.sub, dto.reason);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Arşivden geri al (Admin)' })
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Yalnızca admin arşivden geri alabilir.');
    return this.applicationsService.restore(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni başvuru oluştur' })
  async create(@Body() createApplicationDto: CreateApplicationDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      createApplicationDto.userId = req.user.sub;
    } else {
      createApplicationDto.userId = createApplicationDto.userId ?? req.user.sub;
    }
    return this.applicationsService.create(createApplicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Başvuruları listele' })
  @ApiQuery({ name: 'programId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Request() req,
    @Query() pagination: PaginationDto,
    @Query('programId') programId?: string,
    @Query('status') status?: string,
  ) {
    const pid = programId ? +programId : undefined;
    if (req.user.role === UserRole.ADMIN) {
      return this.applicationsService.findAll(pagination.page, pagination.limit, { programId: pid, status });
    }
    if (req.user.role === UserRole.KOMISYON_UYESI) {
      return this.applicationsService.findForCommissioner(req.user.sub, pagination.page, pagination.limit, pid);
    }
    return this.applicationsService.findByUserId(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Başvuru detayı' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const application = await this.applicationsService.findOne(id);
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.INSTITUTE_MANAGER) {
      return application;
    }
    if (req.user.role === UserRole.KOMISYON_UYESI) {
      await this.applicationsService.assertCommissionerAssignedToProgram({
        commissionerId: req.user.sub,
        programId: application.program.id,
      });
      return application;
    }
    if (application.user.id !== req.user.sub) {
      throw new ForbiddenException('Bu başvuruya erişim yetkiniz yok.');
    }
    return application;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Başvuru güncelle' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateApplicationDto: UpdateApplicationDto, @Request() req) {
    const application = await this.applicationsService.findOne(id);

    if (req.user.role !== UserRole.ADMIN && application.user.id !== req.user.sub) {
      throw new ForbiddenException('Bu başvuruyu güncelleme yetkiniz yok.');
    }

    if (req.user.role === UserRole.STUDENT) {
      // Öğrenci yalnızca draft/submitted durumda düzenleyebilir
      const editableStatuses = ['draft', 'submitted'];
      if (!editableStatuses.includes(application.status)) {
        throw new ForbiddenException('Değerlendirme sürecine giren başvurular düzenlenemez.');
      }
      // Öğrenci status değiştiremez (sadece submitted'a geçiş - ApplyPage akışı için)
      if (updateApplicationDto.status && updateApplicationDto.status !== 'submitted') {
        throw new ForbiddenException('Öğrenciler başvuru durumunu değiştiremez.');
      }
    }

    return this.applicationsService.update(id, updateApplicationDto, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Başvuruyu sil' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role === UserRole.ADMIN) {
      return this.applicationsService.remove(id);
    }
    if (req.user.role === UserRole.STUDENT) {
      return this.applicationsService.cancel(id, req.user.sub);
    }
    throw new ForbiddenException('Bu işlem için yetkiniz yok.');
  }
}

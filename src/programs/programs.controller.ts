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
  ForbiddenException,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';
import { InstituteManagersService } from 'src/institute-managers/institute-managers.service';

@ApiTags('programs')
@ApiBearerAuth()
@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly instituteManagersService: InstituteManagersService,
  ) {}

  private isAdminOrManager(role: string) {
    return role === UserRole.ADMIN || role === UserRole.INSTITUTE_MANAGER;
  }

  private async getManagerInstituteId(userId: number): Promise<number> {
    const profile = await this.instituteManagersService.findMyProfile(userId);
    if (!profile) throw new ForbiddenException('Enstitü atamanız bulunamadı.');
    return (profile.institute as any).id;
  }

  @Post()
  @ApiOperation({ summary: 'Program oluştur (Admin / Enstitü Yöneticisi)' })
  async create(@Body() createDto: CreateProgramDto, @Request() req) {
    if (!this.isAdminOrManager(req.user.role)) throw new ForbiddenException();
    if (req.user.role === UserRole.INSTITUTE_MANAGER) {
      const myInstId = await this.getManagerInstituteId(req.user.sub);
      if (!createDto.instituteId || createDto.instituteId !== myInstId) {
        throw new ForbiddenException('Sadece kendi enstitünüze program ekleyebilirsiniz.');
      }
    }
    return this.programsService.create(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Programları listele' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'instituteId', required: false, type: Number })
  @ApiQuery({ name: 'degreeType', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('instituteId') instituteId?: string,
    @Query('degreeType') degreeType?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.programsService.findAll({
      departmentId: departmentId ? +departmentId : undefined,
      instituteId: instituteId ? +instituteId : undefined,
      degreeType: degreeType || undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('my-programs')
  @ApiOperation({ summary: 'Kendi programlarım (Komisyon Üyesi)' })
  async findMyPrograms(@Request() req) {
    if (req.user.role !== UserRole.KOMISYON_UYESI) throw new ForbiddenException('Bu endpoint sadece komisyon üyelerine özeldir.');
    return this.programsService.findMyPrograms(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Program detayı' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  @Get(':id/quota')
  @ApiOperation({ summary: 'Program kontenjan durumu' })
  async getQuota(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.getQuotaStatus(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Program güncelle (Admin / Enstitü Yöneticisi)' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProgramDto, @Request() req) {
    if (!this.isAdminOrManager(req.user.role)) throw new ForbiddenException();
    if (req.user.role === UserRole.INSTITUTE_MANAGER) {
      const myInstId = await this.getManagerInstituteId(req.user.sub);
      const program = await this.programsService.findOne(id);
      const progInstId = (program.institute as any)?.id ?? (program.department as any)?.institute?.id;
      if (progInstId !== myInstId) throw new ForbiddenException('Bu program kendi enstitünüze ait değil.');
    }
    return this.programsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Program sil (Admin / Enstitü Yöneticisi)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (!this.isAdminOrManager(req.user.role)) throw new ForbiddenException();
    if (req.user.role === UserRole.INSTITUTE_MANAGER) {
      const myInstId = await this.getManagerInstituteId(req.user.sub);
      const program = await this.programsService.findOne(id);
      const progInstId = (program.institute as any)?.id ?? (program.department as any)?.institute?.id;
      if (progInstId !== myInstId) throw new ForbiddenException('Bu program kendi enstitünüze ait değil.');
    }
    return this.programsService.remove(id);
  }

  @Get(':id/commissioners')
  @ApiOperation({ summary: 'Program komisyon üyeleri (Admin / Enstitü Yöneticisi)' })
  async listCommissioners(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (!this.isAdminOrManager(req.user.role)) throw new ForbiddenException();
    if (req.user.role === UserRole.INSTITUTE_MANAGER) {
      const myInstId = await this.getManagerInstituteId(req.user.sub);
      const program = await this.programsService.findOne(id);
      const progInstId = (program.institute as any)?.id ?? (program.department as any)?.institute?.id;
      if (progInstId !== myInstId) throw new ForbiddenException('Bu program kendi enstitünüze ait değil.');
    }
    return this.programsService.listCommissioners(id);
  }

  @Put(':id/commissioners')
  @ApiOperation({ summary: 'Program komisyon üyelerini ata (Admin / Enstitü Yöneticisi)' })
  async setCommissioners(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { commissionerIds: number[] },
    @Request() req,
  ) {
    if (!this.isAdminOrManager(req.user.role)) throw new ForbiddenException();
    if (req.user.role === UserRole.INSTITUTE_MANAGER) {
      const myInstId = await this.getManagerInstituteId(req.user.sub);
      const program = await this.programsService.findOne(id);
      const progInstId = (program.institute as any)?.id ?? (program.department as any)?.institute?.id;
      if (progInstId !== myInstId) throw new ForbiddenException('Bu program kendi enstitünüze ait değil.');
    }
    return this.programsService.setCommissioners(id, body?.commissionerIds ?? []);
  }
}

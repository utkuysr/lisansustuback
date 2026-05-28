import {
    Controller, Post, Body, Req, Param, Get, Put, Delete,
    UseGuards, ForbiddenException, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DecisionService } from './decision.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@ApiTags('decisions')
@ApiBearerAuth()
@Controller('decisions')
@UseGuards(JwtAuthGuard)
export class DecisionController {
    constructor(private readonly decisionService: DecisionService) {}

    @Post()
    @ApiOperation({ summary: 'Başvuruya değerlendirme ekle (Komisyon Üyesi)' })
    async create(@Body() dto: CreateDecisionDto, @Req() req: any) {
        if (req.user.role !== UserRole.KOMISYON_UYESI) {
            throw new ForbiddenException('Yalnızca komisyon üyeleri değerlendirme yapabilir.');
        }
        return this.decisionService.create(dto, req.user.sub);
    }

    @Get()
    @ApiOperation({ summary: 'Kararları listele (Admin: hepsi | Komisyon Üyesi: kendi kararları)' })
    async findAll(@Req() req: any) {
        if (req.user.role === UserRole.ADMIN) {
            return this.decisionService.findAll();
        }
        if (req.user.role === UserRole.KOMISYON_UYESI) {
            return this.decisionService.findByCommissioner(req.user.sub);
        }
        throw new ForbiddenException('Bu kaynağa erişim yetkiniz yok.');
    }

    @Get('program/:programId')
    @ApiOperation({ summary: 'Programa göre kararları listele (Admin veya o programın komisyon üyesi)' })
    async findByProgram(@Param('programId', ParseIntPipe) programId: number, @Req() req: any) {
        if (req.user.role === UserRole.ADMIN) {
            return this.decisionService.findByProgram(programId);
        }
        if (req.user.role === UserRole.KOMISYON_UYESI) {
            return this.decisionService.findByProgram(programId, req.user.sub);
        }
        throw new ForbiddenException('Bu kaynağa erişim yetkiniz yok.');
    }

    @Get('application/:applicationId')
    @ApiOperation({ summary: 'Başvuruya göre kararları listele (Admin veya o programın komisyon üyesi)' })
    async findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number, @Req() req: any) {
        if (req.user.role === UserRole.ADMIN) {
            return this.decisionService.findByApplication(applicationId);
        }
        if (req.user.role === UserRole.KOMISYON_UYESI) {
            return this.decisionService.findByApplication(applicationId, req.user.sub);
        }
        throw new ForbiddenException('Bu kaynağa erişim yetkiniz yok.');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Karar detayı' })
    async getById(@Param('id', ParseIntPipe) id: number) {
        return this.decisionService.getById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Kararı güncelle (Kararı veren komisyon üyesi)' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDecisionDto,
        @Req() req: any,
    ) {
        if (req.user.role !== UserRole.KOMISYON_UYESI) {
            throw new ForbiddenException('Yalnızca komisyon üyeleri değerlendirme güncelleyebilir.');
        }
        return this.decisionService.update(id, dto, req.user.sub);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Kararı arşivle (Admin)' })
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        if (req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Yalnızca admin karar arşivleyebilir.');
        }
        return this.decisionService.remove(id);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Arşivlenen kararı geri yükle (Admin)' })
    async restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        if (req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Yalnızca admin karar geri yükleyebilir.');
        }
        return this.decisionService.restore(id);
    }

    @Get('archived/list')
    @ApiOperation({ summary: 'Arşivlenen kararları listele (Admin)' })
    async findArchived(@Req() req: any) {
        if (req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Bu kaynağa erişim yetkiniz yok.');
        }
        return this.decisionService.findAllArchived();
    }
}

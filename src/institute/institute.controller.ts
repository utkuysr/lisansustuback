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
} from '@nestjs/common';
import { InstituteService } from './institute.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@Controller('institutes')
@UseGuards(JwtAuthGuard)
export class InstituteController {
  constructor(private readonly institutesService: InstituteService) {}

  @Post()
  async create(@Body() createDto: CreateInstituteDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin enstitü oluşturabilir.');
    }
    return this.institutesService.create(createDto, req.user);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin enstitüleri görüntüleyebilir.');
    }
    return this.institutesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin enstitü görüntüleyebilir.');
    }
    return this.institutesService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateInstituteDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin enstitü güncelleyebilir.');
    }
    return this.institutesService.update(+id, updateDto);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin arşivleyebilir.');
    }
    return this.institutesService.archive(+id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin arşivden geri alabilir.');
    }
    return this.institutesService.restore(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin enstitü silebilir.');
    }
    return this.institutesService.remove(+id);
  }
}

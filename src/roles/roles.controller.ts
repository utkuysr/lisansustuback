import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/constants/roles.constants';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto, @Request() req): Promise<Role> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin rol oluşturabilir.');
    }
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req,
  ): Promise<Role> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin rol güncelleyebilir.');
    }
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin rol silebilir.');
    }
    return this.rolesService.remove(+id);
  }
}

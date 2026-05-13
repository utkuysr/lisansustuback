import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ForbiddenException, HttpCode, HttpStatus, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from '../common/constants/roles.constants';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Kullanıcı oluştur (Admin)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createUserDto: CreateUserDto, @Request() req): Promise<User> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece admin kullanıcı oluşturabilir.');
    }
    return this.usersService.create(createUserDto, { allowRoleOverride: true, createdById: req.user.sub });
  }

  // Tüm kullanıcıları listele (Admin: hepsi | InstituteManager: sadece görüntüleme için)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req): Promise<User[]> {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.INSTITUTE_MANAGER) {
      throw new ForbiddenException('Sadece admin kullanıcıları listeleyebilir.');
    }
    return this.usersService.findAll();
  }

 @UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@Get('me')
  async getMe(@Request() req) {
    const user = await this.usersService.findOne(req.user.sub); // Veritabanından gelen ham veri
    
    
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
  // Kullanıcıyı id'ye göre bul (Admin veya kendisi)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req): Promise<User> {
    if (req.user.role !== UserRole.ADMIN && req.user.sub !== +id) {
      throw new ForbiddenException('Sadece kendi profilinizi görüntüleyebilirsiniz.');
    }
    return this.usersService.findOne(id);
  }

  // Kullanıcıyı güncelle (Admin veya kendisi)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<User> {
    const userId = +id;
    if (req.user.role !== UserRole.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('Sadece kendi profilinizi güncelleyebilirsiniz (veya admin olmalısınız).');
    }
    if (req.user.role !== UserRole.ADMIN) {
      if (updateUserDto.roleId !== undefined) {
        throw new ForbiddenException('Sadece admin kullanıcı rolünü güncelleyebilir.');
      }
      if (updateUserDto.isActive !== undefined) {
        throw new ForbiddenException('Sadece admin kullanıcı aktiflik durumunu güncelleyebilir.');
      }
      if (updateUserDto.isEmailVerified !== undefined) {
        throw new ForbiddenException('Sadece admin email doğrulama durumunu güncelleyebilir.');
      }
    }
    return this.usersService.update(id, updateUserDto);
  }

  // Kullanıcı şifresini sıfırla (Admin sadece başkalarının, user kendi şifresini)
  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Request() req,
  ) {
    const userId = +id;
    if (req.user.role !== UserRole.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('Sadece kendi şifrenizi sıfırlayabilirsiniz (veya admin olmalısınız).');
    }
    return this.usersService.resetPassword(id, body.newPassword);
  }

  // Kullanıcıyı sil (Admin veya kendisi)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = +id;
    if (req.user.role !== UserRole.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('Sadece kendi hesabınızı silebilirsiniz (veya admin olmalısınız).');
    }
    return this.usersService.remove(id);
  }
}
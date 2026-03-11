import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Kullanıcı oluştur
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  // Tüm kullanıcıları listele
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // Kullanıcıyı id'ye göre bul
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
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
    if (req.user.role !== 'admin' && req.user.sub !== userId) {
      throw new ForbiddenException('You can only update your own profile or be an admin');
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
    if (req.user.role !== 'admin' && req.user.sub !== userId) {
      throw new ForbiddenException('You can only reset your own password or be an admin');
    }
    return this.usersService.resetPassword(id, body.newPassword);
  }

  // Kullanıcıyı sil (Admin veya kendisi)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = +id;
    if (req.user.role !== 'admin' && req.user.sub !== userId) {
      throw new ForbiddenException('You can only delete your own account or be an admin');
    }
    return this.usersService.remove(id);
  }
}
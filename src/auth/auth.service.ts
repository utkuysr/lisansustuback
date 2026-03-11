import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Password kontrolü
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Veritabanından fresh veri çek (en güncel role bilgisini al)
    const freshUser = await this.usersService.findOne(user.id.toString());

    const payload = {
      sub: freshUser.id,
      email: freshUser.email,
      role: freshUser.role.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: freshUser.id,
        email: freshUser.email,
        username: freshUser.username,
        firstName: freshUser.firstName,
        lastName: freshUser.lastName,
        role: freshUser.role.name,
      },
    };
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.usersService.findOne(userId.toString());
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.passwordHash = hashedPassword;
    await this.usersService.update(userId.toString(), { passwordHash: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

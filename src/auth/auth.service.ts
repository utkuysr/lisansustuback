import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UserAuth } from './entities/user-auth.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { validatePasswordPolicy } from 'src/auth/utils/password-policy';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

const REFRESH_EXPIRES_DAYS = 7;

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        @InjectRepository(UserAuth)
        private readonly userAuthRepository: Repository<UserAuth>,
    ) {}

    async register(createUserDto: CreateUserDto) {
        const { roleId, ...safeDto } = createUserDto as any;
        const user = await this.usersService.create(safeDto);
        return { message: 'Kullanıcı başarıyla kaydedildi.', userId: user.id };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) throw new UnauthorizedException('E-posta veya şifre hatalı.');

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) throw new UnauthorizedException('E-posta veya şifre hatalı.');

        if (!user.isActive) throw new UnauthorizedException('Hesabınız devre dışı bırakılmıştır.');

        const freshUser = await this.usersService.findOne(user.id.toString());
        const roleName = freshUser.role?.name ?? freshUser.userType;
        if (!roleName) throw new UnauthorizedException('Kullanıcı rolü tanımlı değil.');

        const payload = { sub: freshUser.id, email: freshUser.email, role: roleName };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign({ sub: freshUser.id }, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        const refreshTokenExpires = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400 * 1000);

        await this.userAuthRepository.update(
            { userId: freshUser.id },
            {
                lastLogin: new Date(),
                refreshTokenHash,
                refreshTokenExpires,
                updatedAt: new Date(),
            },
        );

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: freshUser.id,
                email: freshUser.email,
                firstName: freshUser.firstName,
                lastName: freshUser.lastName,
                role: roleName,
            },
        };
    }

    async refreshTokens(rawRefreshToken: string) {
        let payload: any;
        try {
            payload = this.jwtService.verify(rawRefreshToken);
        } catch {
            throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token.');
        }

        const userAuth = await this.userAuthRepository.findOneBy({ userId: payload.sub });
        if (!userAuth?.refreshTokenHash || !userAuth.refreshTokenExpires) {
            throw new UnauthorizedException('Refresh token bulunamadı.');
        }
        if (new Date() > userAuth.refreshTokenExpires) {
            throw new UnauthorizedException('Refresh token süresi dolmuş.');
        }
        const isValid = await bcrypt.compare(rawRefreshToken, userAuth.refreshTokenHash);
        if (!isValid) throw new UnauthorizedException('Geçersiz refresh token.');

        const user = await this.usersService.findOne(String(payload.sub));
        const roleName = user.role?.name ?? user.userType;
        const newAccessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: roleName }, { expiresIn: '1h' });
        const newRefreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });
        const newHash = await bcrypt.hash(newRefreshToken, 10);

        await this.userAuthRepository.update(
            { userId: user.id },
            { refreshTokenHash: newHash, refreshTokenExpires: new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400 * 1000), updatedAt: new Date() },
        );

        return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }

    async logout(userId: number): Promise<{ message: string }> {
        await this.userAuthRepository.update(
            { userId },
            { refreshTokenHash: undefined, refreshTokenExpires: undefined, updatedAt: new Date() },
        );
        return { message: 'Çıkış yapıldı.' };
    }

    async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
        const { currentPassword, newPassword, confirmPassword } = dto;

        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Yeni şifreler uyuşmuyor.');
        }

        const policy = validatePasswordPolicy(newPassword);
        if (!policy.ok) throw new BadRequestException(policy.message);

        const user = await this.usersService.findOne(userId.toString());
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) throw new BadRequestException('Mevcut şifre hatalı.');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePasswordHash(userId.toString(), hashedPassword);

        await this.userAuthRepository.update(
            { userId },
            {
                mustChangePassword: false,
                refreshTokenHash: undefined,
                refreshTokenExpires: undefined,
                updatedAt: new Date(),
                updatedBy: userId,
            },
        );

        return { message: 'Şifre başarıyla değiştirildi. Lütfen yeniden giriş yapın.' };
    }

    validateToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch {
            throw new UnauthorizedException('Geçersiz token.');
        }
    }
}

import {
    Controller, Post, Body, UseGuards, Request,
    HttpCode, HttpStatus, Delete,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailService } from './services/email.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly emailService: EmailService,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Giriş yap — access_token + refresh_token döner' })
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @ApiOperation({ summary: 'Kayıt ol' })
    register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Yeni access_token al (refresh_token ile)' })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @Delete('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Çıkış yap (refresh_token geçersiz kılınır)' })
    logout(@Request() req) {
        return this.authService.logout(req.user.sub);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Şifre değiştir' })
    changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.sub, dto);
    }

    @Post('send-verification-code')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @ApiOperation({ summary: 'E-posta doğrulama kodu gönder' })
    sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
        return this.emailService.sendVerificationCode(dto.email);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'E-posta doğrulama kodunu onayla' })
    verifyEmail(@Body() dto: VerifyEmailCodeDto) {
        return this.emailService.verifyCode(dto.email, dto.code);
    }
}

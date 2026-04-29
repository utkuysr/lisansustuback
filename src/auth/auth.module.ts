import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailService } from './services/email.service';
import { MustChangePasswordGuard } from './guards/must-change-password.guard';
import { UsersModule } from 'src/users/users.module';
import { UserAuth } from './entities/user-auth.entity';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET ortam değişkeni tanımlı değil. .env dosyasını kontrol edin.');
}

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }),
        TypeOrmModule.forFeature([UserAuth]),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, EmailService, MustChangePasswordGuard],
    exports: [AuthService, EmailService, MustChangePasswordGuard, TypeOrmModule],
})
export class AuthModule {}

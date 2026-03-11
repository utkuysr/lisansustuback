import { Injectable, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly usersService: UsersService) {
    // Email configuration (Gmail example)
    // Production'da environment variables'dan al
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER || 'u3234240@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'lkfl ytrg hwhw ndfi',
      },
    });
  }

  // 6 haneli random code generate et
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Verification code gönder
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // Verification code generate et
    const code = this.generateVerificationCode();
    // 15 dakika geçerli
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Database'e kaydet
    await this.usersService.setVerificationCode(email, code, expiresAt);

    // Email gönder
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: 'Email Verification Code',
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #007bff; font-weight: bold;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { message: 'Verification code sent to your email' };
    } catch (error) {
      throw new BadRequestException('Failed to send verification code');
    }
  }

  // Verification code doğrula
  async verifyCode(email: string, code: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      throw new BadRequestException('No verification code found for this email');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    const now = new Date();
    if (now > user.verificationCodeExpiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    // Email verified olarak işaretle
    await this.usersService.markEmailAsVerified(email);

    return { message: 'Email verified successfully' };
  }
}

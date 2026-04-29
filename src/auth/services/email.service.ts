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
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
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

  async sendDecisionNotification(params: {
    to: string;
    firstName: string;
    programName: string;
    status: string;
    notes?: string;
    score?: number;
  }): Promise<void> {
    const statusLabels: Record<string, string> = {
      accepted: 'KABUL EDİLDİ',
      rejected: 'REDDEDİLDİ',
      waitlisted: 'BEKLEME LİSTESİNE ALINDI',
      interview_required: 'MÜLAKAT GEREKLİ',
      pending_review: 'İNCELEMEDE',
    };
    const label = statusLabels[params.status] ?? params.status.toUpperCase();
    const scoreHtml = params.score != null ? `<p>Puan: <strong>${params.score}</strong>/100</p>` : '';
    const notesHtml = params.notes ? `<p>Notlar: ${params.notes}</p>` : '';

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: params.to,
      subject: `Başvuru Sonucu: ${params.programName}`,
      html: `
        <h2>Sayın ${params.firstName},</h2>
        <p><strong>${params.programName}</strong> programına yaptığınız başvurunun değerlendirmesi tamamlanmıştır.</p>
        <h3 style="color:#007bff;">Sonuç: ${label}</h3>
        ${scoreHtml}
        ${notesHtml}
        <hr/>
        <p style="font-size:12px;color:#888;">Bu e-posta otomatik olarak gönderilmiştir.</p>
      `,
    });
  }

  // Verification code doğrula
  async verifyCode(email: string, code: string): Promise<{ message: string }> {
    const userAuth = await this.usersService.findUserAuthByEmail(email);

    if (!userAuth?.passwordResetToken || !userAuth?.passwordResetExpires) {
      throw new BadRequestException('No verification code found for this email');
    }

    if (userAuth.passwordResetToken !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    const now = new Date();
    if (now > userAuth.passwordResetExpires) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.usersService.markEmailAsVerified(email);

    return { message: 'Email verified successfully' };
  }
}

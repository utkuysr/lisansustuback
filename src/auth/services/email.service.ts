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

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: 'E-posta Doğrulama Kodu — LBS Portal',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1a3a6b;margin-bottom:8px;">E-posta Doğrulama</h2>
          <p style="color:#374151;">Doğrulama kodunuz aşağıdadır:</p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a3a6b;">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:14px;">Bu kod <strong>15 dakika</strong> geçerlidir.</p>
          <p style="color:#6b7280;font-size:13px;">Bu kodu siz talep etmediyseniz bu e-postayı dikkate almayınız.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="color:#9ca3af;font-size:12px;">LBS Portal — Lisansüstü Başvuru Sistemi</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { message: 'Doğrulama kodu e-posta adresinize gönderildi.' };
    } catch (error) {
      throw new BadRequestException('Doğrulama kodu gönderilemedi. Lütfen daha sonra tekrar deneyin.');
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
      throw new BadRequestException('Bu e-posta için geçerli bir doğrulama kodu bulunamadı.');
    }

    if (userAuth.passwordResetToken !== code) {
      throw new BadRequestException('Doğrulama kodu hatalı.');
    }

    const now = new Date();
    if (now > userAuth.passwordResetExpires) {
      throw new BadRequestException('Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.');
    }

    await this.usersService.markEmailAsVerified(email);

    return { message: 'E-posta adresiniz başarıyla doğrulandı.' };
  }
}

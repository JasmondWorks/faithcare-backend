import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('email.host'),
      port: this.config.get<number>('email.port'),
      secure: this.config.get<number>('email.port') === 465,
      auth: {
        user: this.config.get<string>('email.user'),
        pass: this.config.get<string>('email.pass'),
      },
    });
  }

  async sendOtp(
    email: string,
    otp: string,
    type: 'email_verification' | 'password_reset',
  ) {
    const isVerification = type === 'email_verification';
    const subject = isVerification
      ? 'Verify your FaithCare account'
      : 'Reset your FaithCare password';
    const heading = isVerification ? 'Email Verification' : 'Password Reset';
    const body = isVerification
      ? 'Thank you for joining FaithCare! Use the code below to verify your email address.'
      : 'Use the code below to reset your password. If you did not request this, ignore this email.';

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;background:#f4f7fb;margin:0;padding:40px 0;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h2 style="margin:0 0 8px;color:#0f1f35;">${heading}</h2>
            <p style="color:#555;margin:0 0 28px;">${body}</p>
            <div style="background:#f0f6ff;border-radius:8px;padding:20px;text-align:center;margin-bottom:28px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2e86ab;">${otp}</span>
            </div>
            <p style="color:#888;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('email.from'),
        to: email,
        subject,
        html,
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${email}`, err);
      throw err;
    }
  }

  async sendAdminInvite(email: string, name: string, tempPassword: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;background:#f4f7fb;margin:0;padding:40px 0;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h2 style="margin:0 0 8px;color:#0f1f35;">You've been invited to FaithCare 🎉</h2>
            <p style="color:#555;">Hi ${name}, you've been added as an Admin on the FaithCare platform.</p>
            <p style="color:#555;margin-bottom:4px;">Your temporary login credentials:</p>
            <div style="background:#f0f6ff;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="margin:4px 0;color:#333;"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0;color:#333;"><strong>Temporary Password:</strong> <code style="font-size:16px;letter-spacing:2px;">${tempPassword}</code></p>
            </div>
            <p style="color:#888;font-size:13px;">You will be prompted to change your password after your first login. Do not share these credentials.</p>
          </div>
        </body>
      </html>
    `;
    await this.transporter.sendMail({
      from: this.config.get<string>('email.from'),
      to: email,
      subject: "You've been invited to FaithCare",
      html,
    });
  }

  async sendWelcome(email: string, name: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;background:#f4f7fb;margin:0;padding:40px 0;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h2 style="margin:0 0 8px;color:#0f1f35;">Welcome to FaithCare, ${name}!</h2>
            <p style="color:#555;">Your account has been verified. You can now log in and start your spiritual journey.</p>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('email.from'),
      to: email,
      subject: 'Welcome to FaithCare!',
      html,
    });
  }
}

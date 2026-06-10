import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendPasswordResetEmail(email: string, otp: string) {
    const from = process.env.SMTP_FROM ?? 'Moons Jobs <noreply@moons.com>';
    const subject = 'Reset your Moons password';
    const text = `Your password reset code is ${otp}. It expires in 15 minutes.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Reset your password</h2>
        <p style="color: #475569;">Use this code to reset your Moons password:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${otp}</p>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `;

    await this.deliverEmail(from, email, subject, text, html, otp, 'reset');
  }

  async sendOtpEmail(email: string, otp: string) {
    const from = process.env.SMTP_FROM ?? 'Moons Jobs <noreply@moons.com>';
    const subject = 'Your Moons verification code';
    const text = `Your verification code is ${otp}. It expires in 10 minutes.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Verify your email</h2>
        <p style="color: #475569;">Use this code to complete your Moons registration:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${otp}</p>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes.</p>
      </div>
    `;

    await this.deliverEmail(from, email, subject, text, html, otp, 'OTP');
  }

  private async deliverEmail(
    from: string,
    to: string,
    subject: string,
    text: string,
    html: string,
    devCode: string,
    label: string,
  ) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        `SMTP not configured — ${label} for ${to}: ${devCode} (dev mode)`,
      );
      return;
    }

    try {
      await transporter.sendMail({ from, to, subject, text, html });
    } catch (err) {
      const message = this.formatSendError(err);
      this.logger.error(`Failed to send ${label} to ${to}: ${message}`);
      throw new BadRequestException(message);
    }
  }

  private formatSendError(err: unknown): string {
    const raw =
      err && typeof err === 'object' && 'response' in err
        ? String((err as { response?: string }).response ?? '')
        : err instanceof Error
          ? err.message
          : 'Failed to send verification email';

    if (raw.includes('only send testing emails to your own email address')) {
      const match = raw.match(/\(([^)]+)\)/);
      const allowed = match?.[1] ?? 'your Resend account email';
      return `Resend test mode: verification emails can only be sent to ${allowed}. Register with that email, or verify a domain at resend.com/domains.`;
    }

    if (raw.includes('domain is not verified') || raw.includes('verify a domain')) {
      return 'The sender domain is not verified on Resend. Use SMTP_FROM=onboarding@resend.dev for testing, or verify your domain at resend.com/domains.';
    }

    if (raw.includes('Invalid API key') || raw.includes('authentication failed')) {
      return 'Invalid Resend API key. Check SMTP_PASS in services/api/.env.';
    }

    this.logger.error(`Raw email error: ${raw}`);
    return raw || 'Failed to send verification email. Please try again later.';
  }
}

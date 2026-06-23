import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  buildApplicationReceivedEmail,
  buildApplicationStatusEmail,
  buildOtpEmail,
  buildPasswordResetEmail,
} from './email-templates';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  onModuleInit() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? 'MoonsJob <noreply@moonsjob.com>';

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP not configured — OTP codes will only appear in this API console (dev mode)',
      );
      return;
    }

    this.logger.log(`SMTP ready (${host}, from: ${from})`);
  }

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
    const from = process.env.SMTP_FROM ?? 'MoonsJob <noreply@moonsjob.com>';
    const subject = 'Reset your Moons password';
    const { text, html } = buildPasswordResetEmail(otp);

    await this.deliverEmail(from, email, subject, text, html, otp, 'reset');
  }

  async sendOtpEmail(email: string, otp: string) {
    const from = process.env.SMTP_FROM ?? 'MoonsJob <noreply@moonsjob.com>';
    const subject = 'Your Moons verification code';
    const { text, html } = buildOtpEmail(otp);

    await this.deliverEmail(from, email, subject, text, html, otp, 'OTP');
  }

  async sendApplicationReceivedEmail(
    recruiterEmail: string,
    jobTitle: string,
    candidateName: string,
  ) {
    const from = process.env.SMTP_FROM ?? 'MoonsJob <noreply@moonsjob.com>';
    const subject = `New application for ${jobTitle}`;
    const { text, html } = buildApplicationReceivedEmail(jobTitle, candidateName);
    await this.deliverEmail(from, recruiterEmail, subject, text, html, subject, 'application');
  }

  async sendApplicationStatusEmail(
    candidateEmail: string,
    jobTitle: string,
    companyName: string,
    status: string,
  ) {
    const from = process.env.SMTP_FROM ?? 'MoonsJob <noreply@moonsjob.com>';
    const subject = `Application update: ${jobTitle}`;
    const { text, html } = buildApplicationStatusEmail(jobTitle, companyName, status);
    await this.deliverEmail(
      from,
      candidateEmail,
      subject,
      text,
      html,
      `${jobTitle}:${status}`,
      'status',
    );
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
      const info = await transporter.sendMail({ from, to, subject, text, html });
      this.logger.log(`Email sent to ${to} (${label}) — ${info.messageId ?? 'ok'}`);
      if (process.env.NODE_ENV !== 'production' && (label === 'OTP' || label === 'reset')) {
        this.logger.warn(`[dev] ${label} code for ${to}: ${devCode}`);
      }
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

    if (raw.includes('domain is not verified') || raw.includes('verify a domain')) {
      return 'The sender domain is not verified. Set SMTP_FROM to an address on your verified domain (e.g. noreply@moonsjob.com) in services/api/.env.';
    }

    if (
      raw.includes('Invalid API key') ||
      raw.includes('authentication failed') ||
      raw.includes('535') ||
      raw.includes('Unauthorized')
    ) {
      return 'SMTP authentication failed. For Resend, set SMTP_USER=resend and SMTP_PASS to your API key (re_...) in services/api/.env.';
    }

    if (raw.includes('suspended') || raw.includes('blocked')) {
      return 'Email sending is blocked. Verify your domain on Resend and check your account status.';
    }

    this.logger.error(`Raw email error: ${raw}`);
    return raw || 'Failed to send verification email. Please try again later.';
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from =
      this.config.get<string>('mail.from') ?? 'No Reply <no-reply@shop.com>';

    const host = this.config.get<string>('mail.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port') ?? 587,
        secure: this.config.get<boolean>('mail.secure') ?? false,
        auth: {
          user: this.config.get<string>('mail.user'),
          pass: this.config.get<string>('mail.pass'),
        },
      });
    } else {
      // No SMTP configured (typical in local dev) — links get logged instead.
      this.transporter = null;
      this.logger.warn(
        'MAIL_HOST not set — emails will be logged to the console, not sent.',
      );
    }
  }

  async sendVerificationEmail(to: string, link: string) {
    const html = this.renderEmail({
      eyebrow: 'Verify your email',
      heading: 'Confirm your email address',
      bodyHtml:
        "Thanks for creating a Maison account. Click the button below to confirm it's really you.",
      ctaLabel: 'Verify my email',
      link,
    });
    await this.send(
      to,
      'Verify your email',
      html,
      `Verify your email: ${link}`,
    );
  }

  async sendPasswordResetEmail(to: string, link: string) {
    const html = this.renderEmail({
      eyebrow: 'Password reset',
      heading: 'Reset your password',
      bodyHtml:
        "We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
      ctaLabel: 'Reset my password',
      link,
    });
    await this.send(
      to,
      'Reset your password',
      html,
      `Reset your password: ${link}`,
    );
  }

  /**
   * Shared editorial email shell (matches the Maison "Serif" design system:
   * ivory background, serif headings, burnished-gold CTA). Kept table-based
   * with inline styles for compatibility across email clients.
   */
  private renderEmail(opts: {
    eyebrow: string;
    heading: string;
    bodyHtml: string;
    ctaLabel: string;
    link: string;
  }): string {
    const serif = "Georgia, 'Times New Roman', serif";
    const sans = "Arial, Helvetica, sans-serif";
    const ivory = '#faf9f6';
    const ink = '#1a1a1a';
    const muted = '#6b6b6b';
    const border = '#e8e4df';
    const gold = '#b8860b';

    return `
<div style="background-color:${ivory};padding:40px 16px;font-family:${sans};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid ${border};border-radius:8px;">
    <tr>
      <td style="padding:32px 40px;text-align:center;border-bottom:1px solid ${border};">
        <span style="font-family:${serif};font-size:22px;letter-spacing:0.02em;color:${ink};">MAISON</span>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;text-align:center;">
        <p style="margin:0 0 16px;font-family:${sans};font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:${gold};">${opts.eyebrow}</p>
        <h1 style="margin:0 0 20px;font-family:${serif};font-weight:normal;font-size:26px;line-height:1.3;color:${ink};">${opts.heading}</h1>
        <p style="margin:0 0 32px;font-family:${sans};font-size:15px;line-height:1.7;color:${muted};">${opts.bodyHtml}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr>
            <td style="border-radius:6px;background-color:${gold};">
              <a href="${opts.link}" style="display:inline-block;padding:14px 32px;font-family:${sans};font-size:14px;font-weight:bold;letter-spacing:0.02em;color:#ffffff;text-decoration:none;border-radius:6px;">${opts.ctaLabel}</a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-family:${sans};font-size:12px;line-height:1.6;color:${muted};">
          Or copy this link into your browser:<br>
          <a href="${opts.link}" style="color:${gold};word-break:break-all;">${opts.link}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px;border-top:1px solid ${border};text-align:center;">
        <p style="margin:0;font-family:${sans};font-size:11px;letter-spacing:0.05em;color:${muted};">Maison &mdash; Considered clothing, cut to last.</p>
      </td>
    </tr>
  </table>
</div>`.trim();
  }

  private async send(to: string, subject: string, html: string, text: string) {
    if (!this.transporter) {
      this.logger.log(`[DEV MAIL] To: ${to} | ${subject}\n${text}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text,
    });
    this.logger.log(`Email sent to ${to}: ${subject}`);
  }
}

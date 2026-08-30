import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const BRAND_COLOR = '#2563eb';

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND_COLOR};padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">Smart Parking Prizren</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#18181b;">
                <h1 style="margin:0 0 16px;font-size:20px;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function actionButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin:8px 0 16px;padding:12px 24px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>
    <p style="font-size:12px;color:#71717a;word-break:break-all;">${url}</p>`;
}

/**
 * I mbështjell klientin e Resend — nëse RESEND_API_KEY s'është vendosur ende
 * (dev lokal para se Gent të vendosë çelësin real), regjistron paralajmërim
 * dhe s'dërgon asgjë, në vend që të hedhë gabim dhe të bllokojë register/forgot-password.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.config.get<string>(
      'EMAIL_FROM',
      'Smart Parking Prizren <onboarding@resend.dev>',
    );

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY s\'është vendosur — email-et (verifikim/rivendosje fjalëkalimi) do të regjistrohen vetëm në log, jo të dërgohen.',
      );
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[DEV, s'u dërgua] Email te ${to}: "${subject}"`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      // Mos e hedh gabimin — regjistrimi/kërkesa e rivendosjes s'duhet të
      // dështojë vetëm sepse dërgimi i email-it dështoi (p.sh. domain jo i
      // verifikuar te Resend); përdoruesi mund ta ridërgojë më vonë.
      this.logger.error(`Dërgimi i email-it te ${to} dështoi: ${error.message}`);
    }
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    const html = emailShell(
      'Verifiko email-in tënd',
      `<p style="color:#3f3f46;line-height:1.5;">Faleminderit që u regjistrove te Smart Parking Prizren. Kliko butonin më poshtë për të verifikuar adresën tënde të email-it.</p>
      ${actionButton(verifyUrl, 'Verifiko email-in')}
      <p style="font-size:12px;color:#a1a1aa;">Lidhja skadon pas 24 orësh. Nëse s'e ke kërkuar këtë, injoroje këtë email.</p>`,
    );
    await this.send(to, 'Verifiko email-in — Smart Parking Prizren', html);
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const html = emailShell(
      'Rivendos fjalëkalimin',
      `<p style="color:#3f3f46;line-height:1.5;">Kemi marrë një kërkesë për të rivendosur fjalëkalimin e llogarisë tënde. Kliko butonin më poshtë për të zgjedhur një fjalëkalim të ri.</p>
      ${actionButton(resetUrl, 'Rivendos fjalëkalimin')}
      <p style="font-size:12px;color:#a1a1aa;">Lidhja skadon pas 1 ore. Nëse s'e ke kërkuar këtë, injoroje këtë email — fjalëkalimi yt mbetet i pandryshuar.</p>`,
    );
    await this.send(to, 'Rivendos fjalëkalimin — Smart Parking Prizren', html);
  }
}

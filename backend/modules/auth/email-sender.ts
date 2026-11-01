import { Resend } from "resend";
import type { OtpPurpose } from "./otp.js";

export interface EmailSender {
  sendOtp(toEmail: string, code: string, purpose: OtpPurpose): Promise<void>;
}

const SUBJECTS: Record<OtpPurpose, string> = {
  verify_email: "Verify your email",
  reset_password: "Reset your password",
};

/** Dev fallback — logs the OTP instead of sending an email. Used whenever
 * no real provider key is configured, so sign-up/reset can be tested without
 * waiting on an email account (OPEN item until a provider is picked). */
class ConsoleEmailSender implements EmailSender {
  async sendOtp(toEmail: string, code: string, purpose: OtpPurpose) {
    console.log(`[email-sender:console] ${purpose} OTP for ${toEmail}: ${code}`);
  }
}

class ResendEmailSender implements EmailSender {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async sendOtp(toEmail: string, code: string, purpose: OtpPurpose) {
    await this.client.emails.send({
      from: this.from,
      to: toEmail,
      subject: SUBJECTS[purpose],
      html: `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });
  }
}

/** Picks the real sender automatically once RESEND_API_KEY is set — no code
 * change needed, per the swappable-provider engineering rule. */
function buildEmailSender(): EmailSender {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return new ConsoleEmailSender();

  const from = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
  return new ResendEmailSender(apiKey, from);
}

export const emailSender: EmailSender = buildEmailSender();

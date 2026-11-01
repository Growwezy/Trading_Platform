import crypto from "node:crypto";
import { redis } from "../../lib/redis.js";

const OTP_TTL_SECONDS = 10 * 60;

export type OtpPurpose = "verify_email" | "reset_password";

function otpKey(purpose: OtpPurpose, email: string) {
  return `otp:${purpose}:${email.toLowerCase()}`;
}

export async function issueOtp(purpose: OtpPurpose, email: string) {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  await redis.set(otpKey(purpose, email), code, "EX", OTP_TTL_SECONDS);
  return code;
}

/** Single-use: deletes the code as soon as it's checked, pass or fail. */
export async function consumeOtp(purpose: OtpPurpose, email: string, code: string) {
  const key = otpKey(purpose, email);
  const stored = await redis.get(key);
  if (!stored) return false;
  await redis.del(key);
  return stored === code;
}

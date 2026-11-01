import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { emailSender } from "./email-sender.js";
import { consumeOtp, issueOtp } from "./otp.js";

const BCRYPT_ROUNDS = 12;

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function signupTrader(
  tenantId: string,
  email: string,
  password: string,
  referralCode?: string,
) {
  const existing = await prisma.user.findFirst({ where: { tenantId, email } });
  if (existing) throw new AuthError(409, "An account with this email already exists.");

  let referredByUserId: string | undefined;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (!referrer) throw new AuthError(400, "Invalid referral code.");
    referredByUserId = referrer.id;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { tenantId, role: "trader", email, passwordHash, referredByUserId },
  });

  const code = await issueOtp("verify_email", email);
  await emailSender.sendOtp(email, code, "verify_email");

  return { id: user.id, email: user.email };
}

export async function verifyTraderEmail(tenantId: string, email: string, code: string) {
  const ok = await consumeOtp("verify_email", email, code);
  if (!ok) throw new AuthError(400, "Invalid or expired code.");

  const user = await prisma.user.findFirst({ where: { tenantId, email, role: "trader" } });
  if (!user) throw new AuthError(404, "Account not found.");

  await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
}

export async function loginTrader(tenantId: string, email: string, password: string) {
  const user = await prisma.user.findFirst({ where: { tenantId, email, role: "trader" } });
  if (!user) throw new AuthError(401, "Invalid email or password.");

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) throw new AuthError(401, "Invalid email or password.");

  if (user.status === "blocked") throw new AuthError(403, "This account has been blocked.");
  if (!user.emailVerifiedAt) throw new AuthError(403, "Verify your email before logging in.");

  return user;
}

export async function requestPasswordReset(tenantId: string, email: string) {
  const user = await prisma.user.findFirst({ where: { tenantId, email, role: "trader" } });
  // Deliberately no "account not found" error — don't reveal whether an email is registered.
  if (user) {
    const code = await issueOtp("reset_password", email);
    await emailSender.sendOtp(email, code, "reset_password");
  }
}

export async function resetTraderPassword(
  tenantId: string,
  email: string,
  code: string,
  newPassword: string,
) {
  const ok = await consumeOtp("reset_password", email, code);
  if (!ok) throw new AuthError(400, "Invalid or expired code.");

  const user = await prisma.user.findFirst({ where: { tenantId, email, role: "trader" } });
  if (!user) throw new AuthError(404, "Account not found.");

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}

export async function getTraderMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const latestKyc = await prisma.kycSubmission.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const kycStatus = latestKyc?.status ?? "not_submitted";
  const canTrade = user.status === "active" && kycStatus === "approved";

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    balance: user.balance,
    kycStatus,
    canTrade,
  };
}

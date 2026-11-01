import type { Request, Response, NextFunction } from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.types.js";
import {
  getTraderMe,
  loginTrader,
  requestPasswordReset,
  resetTraderPassword,
  signupTrader,
  verifyTraderEmail,
} from "./auth.service.js";

function requireTenant(req: Request, res: Response): string | null {
  if (!req.tenant) {
    res.status(400).json({ error: { code: "no_tenant", message: "No tenant resolved for this host." } });
    return null;
  }
  return req.tenant.id;
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = requireTenant(req, res);
    if (!tenantId) return;

    const { email, password, referralCode } = signupSchema.parse(req.body);
    const user = await signupTrader(tenantId, email, password, referralCode);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = requireTenant(req, res);
    if (!tenantId) return;

    const { email, code } = verifyEmailSchema.parse(req.body);
    await verifyTraderEmail(tenantId, email, code);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = requireTenant(req, res);
    if (!tenantId) return;

    const { email, password } = loginSchema.parse(req.body);
    const user = await loginTrader(tenantId, email, password);

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.tenantId = tenantId;
      req.session.role = user.role;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ user: { id: user.id, email: user.email, role: user.role } });
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = requireTenant(req, res);
    if (!tenantId) return;

    const { email } = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(tenantId, email);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = requireTenant(req, res);
    if (!tenantId) return;

    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
    await resetTraderPassword(tenantId, email, code, newPassword);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("sid_trader");
    res.json({ ok: true });
  });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.userId || req.session.tenantId !== (req.tenant?.id ?? null)) {
      res.status(401).json({ error: { code: "no_session", message: "Not logged in." } });
      return;
    }
    const user = await getTraderMe(req.session.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

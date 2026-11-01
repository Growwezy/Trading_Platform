import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignup, useVerifyEmail } from "@growwezy/api-client";

export function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const signup = useSignup();
  const verifyEmail = useVerifyEmail();
  const navigate = useNavigate();

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    try {
      await signup.mutateAsync({ email, password, referralCode: referralCode || undefined });
      setStep("verify");
    } catch {
      // error surfaced below
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    try {
      await verifyEmail.mutateAsync({ email, code });
      navigate("/login");
    } catch {
      // error surfaced below
    }
  }

  if (step === "verify") {
    return (
      <div className="flex h-screen items-center justify-center">
        <form onSubmit={onVerify} className="w-80 space-y-4 rounded-lg bg-slate-900 p-6">
          <h1 className="text-lg font-semibold">Verify your email</h1>
          <p className="text-sm text-slate-400">
            Enter the 6-digit code sent to {email}. (No email provider configured yet? Check the backend's
            console log.)
          </p>
          <input
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full rounded bg-slate-800 px-3 py-2 text-center text-lg tracking-widest outline-none focus:ring-1 focus:ring-sky-500"
          />
          {verifyEmail.isError && <p className="text-sm text-red-400">{(verifyEmail.error as Error).message}</p>}
          <button
            type="submit"
            disabled={verifyEmail.isPending}
            className="w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {verifyEmail.isPending ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={onSignup} className="w-80 space-y-4 rounded-lg bg-slate-900 p-6">
        <h1 className="text-lg font-semibold">Sign up</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        <input
          placeholder="Referral code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        {signup.isError && <p className="text-sm text-red-400">{(signup.error as Error).message}</p>}
        <button
          type="submit"
          disabled={signup.isPending}
          className="w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {signup.isPending ? "Creating account…" : "Sign up"}
        </button>
        <div className="text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="hover:text-slate-200">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForgotPassword } from "@growwezy/api-client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const forgotPassword = useForgotPassword();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await forgotPassword.mutateAsync({ email });
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="w-80 space-y-4 rounded-lg bg-slate-900 p-6">
        <h1 className="text-lg font-semibold">Forgot password</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={forgotPassword.isPending}
          className="w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {forgotPassword.isPending ? "Sending…" : "Send reset code"}
        </button>
        <div className="text-xs text-slate-400">
          <Link to="/login" className="hover:text-slate-200">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

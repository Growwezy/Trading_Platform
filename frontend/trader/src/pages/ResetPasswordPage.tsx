import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetPassword } from "@growwezy/api-client";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const resetPassword = useResetPassword();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await resetPassword.mutateAsync({ email, code, newPassword });
      navigate("/login");
    } catch {
      // error surfaced below
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="w-80 space-y-4 rounded-lg bg-slate-900 p-6">
        <h1 className="text-lg font-semibold">Reset password</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        <input
          required
          placeholder="Reset code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        {resetPassword.isError && <p className="text-sm text-red-400">{(resetPassword.error as Error).message}</p>}
        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {resetPassword.isPending ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}

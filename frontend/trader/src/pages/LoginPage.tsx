import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "@growwezy/api-client";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate("/");
    } catch {
      // error surfaced below via login.error
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="w-80 space-y-4 rounded-lg bg-slate-900 p-6">
        <h1 className="text-lg font-semibold">Log in</h1>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
        {login.isError && <p className="text-sm text-red-400">{(login.error as Error).message}</p>}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
        <div className="flex justify-between text-xs text-slate-400">
          <Link to="/forgot-password" className="hover:text-slate-200">
            Forgot password?
          </Link>
          <Link to="/signup" className="hover:text-slate-200">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

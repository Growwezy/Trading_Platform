import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { RequireAuth } from "./components/RequireAuth.js";
import { LoginPage } from "./pages/LoginPage.js";
import { SignUpPage } from "./pages/SignUpPage.js";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.js";
import { TradingTerminalPage } from "./pages/TradingTerminalPage.js";
import { HoldingsPage } from "./pages/HoldingsPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<TradingTerminalPage />} />
            <Route path="/holdings" element={<HoldingsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

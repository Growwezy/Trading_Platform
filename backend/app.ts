import express from "express";
import cors from "cors";
import { tenantMiddleware } from "./middleware/tenant.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { tenantsRouter } from "./modules/tenants/tenants.routes.js";
import { traderAuthRouter } from "./modules/auth/auth.routes.js";
import { tradingRouter } from "./modules/trading/trading.routes.js";
import { createSessionMiddleware } from "./modules/auth/session.js";

export const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(tenantMiddleware);

// One session/cookie (`sid_trader`) shared by both the trader auth routes and
// the rest of the trader API (ARCHITECTURE.md §3 — one cookie per surface).
app.use(["/api/auth/trader", "/api/trader"], createSessionMiddleware("trader"));

app.use("/api/tenant", tenantsRouter);
app.use("/api/auth/trader", traderAuthRouter);
app.use("/api/trader", tradingRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(errorMiddleware);

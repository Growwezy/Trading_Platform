import express from "express";
import cors from "cors";
import { tenantMiddleware } from "./middleware/tenant.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { tenantsRouter } from "./modules/tenants/tenants.routes.js";
import { traderAuthRouter } from "./modules/auth/auth.routes.js";

export const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(tenantMiddleware);

app.use("/api/tenant", tenantsRouter);
app.use("/api/auth/trader", traderAuthRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(errorMiddleware);

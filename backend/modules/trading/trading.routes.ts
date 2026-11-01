import { Router } from "express";
import { requireTraderSession } from "../../middleware/require-trader-session.middleware.js";
import { tradingController } from "./trading.controller.js";

export const tradingRouter = Router();

tradingRouter.use(requireTraderSession);

tradingRouter.get("/symbols", tradingController.getSymbols);
tradingRouter.get("/market/history", tradingController.getMarketHistory);
tradingRouter.get("/positions/open", tradingController.getOpenPositions);
tradingRouter.get("/positions/history", tradingController.getPositionHistory);
tradingRouter.post("/orders", tradingController.requireCanTrade, tradingController.placeOrder);
tradingRouter.patch("/positions/:id", tradingController.modifyPosition);
tradingRouter.post("/positions/:id/close", tradingController.closePosition);
tradingRouter.get("/account/summary", tradingController.getAccountSummary);

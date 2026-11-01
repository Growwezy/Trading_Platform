import type { NextFunction, Request, Response } from "express";
import { Prisma, type Position, type PositionHistory } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { getTraderMe } from "../auth/auth.service.js";
import { getCachedPrice } from "../../feeds/feed-manager.js";
import { computeAdjustedPrice } from "./pricing.service.js";
import * as tradingService from "./trading.service.js";
import { modifySlTpSchema, placeOrderSchema } from "./trading.types.js";

function dec(value: Prisma.Decimal | null | undefined) {
  return value === null || value === undefined ? null : value.toString();
}

function serializePosition(p: Position) {
  return {
    id: p.id,
    symbolId: p.symbolId,
    side: p.side,
    lots: dec(p.lots),
    units: dec(p.units),
    leverage: dec(p.leverage),
    entryPrice: dec(p.entryPrice),
    stopLoss: dec(p.stopLoss),
    takeProfit: dec(p.takeProfit),
    requiredMargin: dec(p.requiredMargin),
    openedAt: p.openedAt,
  };
}

function serializeHistory(h: PositionHistory) {
  return {
    ...serializePosition(h as unknown as Position),
    closePrice: dec(h.closePrice),
    realizedPnl: dec(h.realizedPnl),
    closeReason: h.closeReason,
    closedAt: h.closedAt,
  };
}

async function requireCanTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const me = await getTraderMe(req.session.userId!);
    if (!me.canTrade) {
      res.status(403).json({ error: { code: "kyc_not_approved", message: "KYC approval is required before trading." } });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function getSymbols(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.tenant!.id;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.session.userId! } });

    const tenantSymbols = await prisma.tenantSymbol.findMany({
      where: { tenantId, enabled: true },
      include: { symbol: true },
    });

    const symbols = await Promise.all(
      tenantSymbols.map(async (ts) => {
        const tick = await getCachedPrice(ts.symbol.code);
        if (!tick) return { code: ts.symbol.code, assetClass: ts.symbol.assetClass, bid: null, ask: null };
        const adjusted = await computeAdjustedPrice(ts.symbolId, tenantId, user.groupId, tick.price);
        return { code: ts.symbol.code, assetClass: ts.symbol.assetClass, bid: dec(adjusted.bid), ask: dec(adjusted.ask) };
      }),
    );

    res.json({ symbols });
  } catch (err) {
    next(err);
  }
}

async function getOpenPositions(req: Request, res: Response, next: NextFunction) {
  try {
    const snapshot = await tradingService.getAccountSnapshot(req.tenant!.id, req.session.userId!);
    res.json({
      positions: snapshot.openPositions.map((p) => ({
        ...serializePosition(p),
        symbolCode: p.symbolCode,
        unrealizedPnl: dec(p.unrealizedPnl),
        currentClosePrice: dec(p.currentClosePrice),
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function getPositionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await prisma.positionHistory.findMany({
      where: { tenantId: req.tenant!.id, userId: req.session.userId! },
      orderBy: { closedAt: "desc" },
      take: 50,
      include: { symbol: true },
    });
    res.json({ positions: history.map((h) => ({ ...serializeHistory(h), symbolCode: h.symbol.code })) });
  } catch (err) {
    next(err);
  }
}

async function placeOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const input = placeOrderSchema.parse(req.body);
    const position = await tradingService.placeOrder(req.tenant!.id, req.session.userId!, input);
    res.status(201).json({ position: serializePosition(position) });
  } catch (err) {
    next(err);
  }
}

async function modifyPosition(req: Request, res: Response, next: NextFunction) {
  try {
    const input = modifySlTpSchema.parse(req.body);
    const position = await tradingService.modifyStopLossTakeProfit(req.tenant!.id, req.params.id, input);
    res.json({ position: serializePosition(position) });
  } catch (err) {
    next(err);
  }
}

async function closePositionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await tradingService.closePosition(req.tenant!.id, req.params.id, "manual");
    res.json({ position: serializeHistory(history) });
  } catch (err) {
    next(err);
  }
}

async function getAccountSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const snapshot = await tradingService.getAccountSnapshot(req.tenant!.id, req.session.userId!);
    res.json({
      balance: dec(snapshot.balance),
      equity: dec(snapshot.equity),
      marginInUse: dec(snapshot.marginInUse),
      freeMargin: dec(snapshot.freeMargin),
      marginLevel: dec(snapshot.marginLevel),
      openPositionsCount: snapshot.openPositions.length,
    });
  } catch (err) {
    next(err);
  }
}

export const tradingController = {
  requireCanTrade,
  getSymbols,
  getOpenPositions,
  getPositionHistory,
  placeOrder,
  modifyPosition,
  closePosition: closePositionHandler,
  getAccountSummary,
};

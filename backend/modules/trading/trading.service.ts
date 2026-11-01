import { Prisma, type Position, type PositionSide } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { getCachedPrice } from "../../feeds/feed-manager.js";
import { computeAdjustedPrice } from "./pricing.service.js";

const MARGIN_CALL_LEVEL = 100; // TRADING_ENGINE.md §9 — proposed default, pending client confirmation
const STOP_OUT_LEVEL = 50;

interface PlaceOrderInput {
  symbolCode: string;
  side: PositionSide;
  lots: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}

function validateSlTp(side: PositionSide, entryPrice: Prisma.Decimal, stopLoss?: number, takeProfit?: number) {
  if (stopLoss !== undefined) {
    const sl = new Prisma.Decimal(stopLoss);
    const ok = side === "buy" ? sl.lt(entryPrice) : sl.gt(entryPrice);
    if (!ok) throw new AppError(400, `Stop loss must be ${side === "buy" ? "below" : "above"} the entry price.`);
  }
  if (takeProfit !== undefined) {
    const tp = new Prisma.Decimal(takeProfit);
    const ok = side === "buy" ? tp.gt(entryPrice) : tp.lt(entryPrice);
    if (!ok) throw new AppError(400, `Take profit must be ${side === "buy" ? "above" : "below"} the entry price.`);
  }
}

/** Price a position would close at right now — buy closes at bid, sell closes at ask (§5). */
function closePriceFor(side: PositionSide, bid: Prisma.Decimal, ask: Prisma.Decimal) {
  return side === "buy" ? bid : ask;
}

function unrealizedPnl(side: PositionSide, entryPrice: Prisma.Decimal, currentClosePrice: Prisma.Decimal, units: Prisma.Decimal) {
  const diff = side === "buy" ? currentClosePrice.sub(entryPrice) : entryPrice.sub(currentClosePrice);
  return diff.mul(units);
}

export interface AccountSnapshot {
  balance: Prisma.Decimal;
  equity: Prisma.Decimal;
  marginInUse: Prisma.Decimal;
  freeMargin: Prisma.Decimal;
  marginLevel: Prisma.Decimal | null;
  openPositions: Array<Position & { symbolCode: string; unrealizedPnl: Prisma.Decimal; currentClosePrice: Prisma.Decimal }>;
}

export async function getAccountSnapshot(tenantId: string, userId: string): Promise<AccountSnapshot> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const positions = await prisma.position.findMany({ where: { tenantId, userId }, include: { symbol: true } });

  let totalFloatingPnl = new Prisma.Decimal(0);
  let marginInUse = new Prisma.Decimal(0);
  const openPositions: AccountSnapshot["openPositions"] = [];

  for (const position of positions) {
    const tick = await getCachedPrice(position.symbol.code);
    marginInUse = marginInUse.add(position.requiredMargin);

    if (!tick) {
      // No price yet (feed hasn't ticked since boot) — treat as flat, not wrong-direction.
      openPositions.push({ ...position, symbolCode: position.symbol.code, unrealizedPnl: new Prisma.Decimal(0), currentClosePrice: position.entryPrice });
      continue;
    }

    const adjusted = await computeAdjustedPrice(position.symbolId, tenantId, user.groupId, tick.price);
    const currentClosePrice = closePriceFor(position.side, adjusted.bid, adjusted.ask);
    const pnl = unrealizedPnl(position.side, position.entryPrice, currentClosePrice, position.units);

    totalFloatingPnl = totalFloatingPnl.add(pnl);
    openPositions.push({ ...position, symbolCode: position.symbol.code, unrealizedPnl: pnl, currentClosePrice });
  }

  const equity = user.balance.add(totalFloatingPnl);
  const freeMargin = equity.sub(marginInUse);
  const marginLevel = marginInUse.gt(0) ? equity.div(marginInUse).mul(100) : null;

  return { balance: user.balance, equity, marginInUse, freeMargin, marginLevel, openPositions };
}

export async function placeOrder(tenantId: string, userId: string, input: PlaceOrderInput) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.status === "blocked") throw new AppError(403, "This account has been blocked.");

  const tenantSymbol = await prisma.tenantSymbol.findFirst({
    where: { tenantId, enabled: true, symbol: { code: input.symbolCode } },
    include: { symbol: true },
  });
  if (!tenantSymbol) throw new AppError(400, "Symbol not available for this account.");

  const lots = new Prisma.Decimal(input.lots);
  if (lots.lt(tenantSymbol.minLot) || lots.gt(tenantSymbol.maxLot)) {
    throw new AppError(400, `Lot size must be between ${tenantSymbol.minLot} and ${tenantSymbol.maxLot}.`);
  }

  const leverage = new Prisma.Decimal(input.leverage);
  if (leverage.gt(tenantSymbol.leverageCap)) {
    throw new AppError(400, `Leverage cannot exceed ${tenantSymbol.leverageCap}x for this symbol.`);
  }

  const tick = await getCachedPrice(tenantSymbol.symbol.code);
  if (!tick) throw new AppError(503, "Price not available yet — try again in a moment.");

  const adjusted = await computeAdjustedPrice(tenantSymbol.symbolId, tenantId, user.groupId, tick.price);
  const entryPrice = input.side === "buy" ? adjusted.ask : adjusted.bid;

  validateSlTp(input.side, entryPrice, input.stopLoss, input.takeProfit);

  const units = lots.mul(tenantSymbol.symbol.contractSize);
  const notionalValue = units.mul(entryPrice);
  const requiredMargin = notionalValue.div(leverage);

  const snapshot = await getAccountSnapshot(tenantId, userId);
  if (requiredMargin.gt(snapshot.freeMargin)) {
    throw new AppError(
      400,
      `Insufficient margin: this order needs ${requiredMargin.toFixed(2)} but only ${snapshot.freeMargin.toFixed(2)} is free.`,
    );
  }

  return prisma.position.create({
    data: {
      tenantId,
      userId,
      symbolId: tenantSymbol.symbolId,
      side: input.side,
      lots,
      units,
      leverage,
      entryPrice,
      stopLoss: input.stopLoss !== undefined ? new Prisma.Decimal(input.stopLoss) : undefined,
      takeProfit: input.takeProfit !== undefined ? new Prisma.Decimal(input.takeProfit) : undefined,
      requiredMargin,
    },
  });
}

export async function modifyStopLossTakeProfit(
  tenantId: string,
  positionId: string,
  input: { stopLoss?: number | null; takeProfit?: number | null },
) {
  const position = await prisma.position.findFirst({ where: { id: positionId, tenantId } });
  if (!position) throw new AppError(404, "Position not found.");

  const nextStopLoss = input.stopLoss === undefined ? position.stopLoss : input.stopLoss;
  const nextTakeProfit = input.takeProfit === undefined ? position.takeProfit : input.takeProfit;

  validateSlTp(
    position.side,
    position.entryPrice,
    nextStopLoss !== null && nextStopLoss !== undefined ? Number(nextStopLoss) : undefined,
    nextTakeProfit !== null && nextTakeProfit !== undefined ? Number(nextTakeProfit) : undefined,
  );

  return prisma.position.update({
    where: { id: positionId },
    data: {
      stopLoss: nextStopLoss === null ? null : nextStopLoss !== undefined ? new Prisma.Decimal(nextStopLoss) : undefined,
      takeProfit: nextTakeProfit === null ? null : nextTakeProfit !== undefined ? new Prisma.Decimal(nextTakeProfit) : undefined,
    },
  });
}

export async function closePosition(
  tenantId: string,
  positionId: string,
  reason: "manual" | "stop_loss" | "take_profit" | "stop_out",
) {
  const position = await prisma.position.findFirst({ where: { id: positionId, tenantId }, include: { symbol: true, user: true } });
  if (!position) throw new AppError(404, "Position not found.");

  const tick = await getCachedPrice(position.symbol.code);
  if (!tick) throw new AppError(503, "Price not available yet — try again in a moment.");

  const adjusted = await computeAdjustedPrice(position.symbolId, tenantId, position.user.groupId, tick.price);
  const closePrice = closePriceFor(position.side, adjusted.bid, adjusted.ask);
  const realizedPnl = unrealizedPnl(position.side, position.entryPrice, closePrice, position.units);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: position.userId },
      data: { balance: { increment: realizedPnl } },
    });

    await tx.transaction.create({
      data: {
        tenantId,
        userId: position.userId,
        type: "trade_close",
        amount: realizedPnl,
        balanceAfter: user.balance,
        referenceTable: "position_history",
        referenceId: position.id,
      },
    });

    const history = await tx.positionHistory.create({
      data: {
        tenantId,
        userId: position.userId,
        symbolId: position.symbolId,
        side: position.side,
        lots: position.lots,
        units: position.units,
        leverage: position.leverage,
        entryPrice: position.entryPrice,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        requiredMargin: position.requiredMargin,
        openedAt: position.openedAt,
        closePrice,
        realizedPnl,
        closeReason: reason,
      },
    });

    await tx.position.delete({ where: { id: position.id } });

    return history;
  });
}

/** Called by the tick processor for every raw tick on a symbol — checks SL/TP, then stop-out. */
export async function processTickForSymbol(symbolCode: string, rawPrice: number) {
  const positions = await prisma.position.findMany({
    where: { symbol: { code: symbolCode } },
    include: { user: true, symbol: true },
  });
  if (positions.length === 0) return;

  const groups = new Map<string, typeof positions>();
  for (const position of positions) {
    const key = `${position.tenantId}:${position.user.groupId ?? "none"}`;
    const list = groups.get(key) ?? [];
    list.push(position);
    groups.set(key, list);
  }

  const touchedUsers = new Set<string>();

  for (const groupPositions of groups.values()) {
    const sample = groupPositions[0];
    const adjusted = await computeAdjustedPrice(sample.symbolId, sample.tenantId, sample.user.groupId, rawPrice);

    for (const position of groupPositions) {
      touchedUsers.add(`${position.tenantId}:${position.userId}`);
      const currentClosePrice = closePriceFor(position.side, adjusted.bid, adjusted.ask);

      let reason: "stop_loss" | "take_profit" | null = null;
      if (position.stopLoss) {
        const hit = position.side === "buy" ? currentClosePrice.lte(position.stopLoss) : currentClosePrice.gte(position.stopLoss);
        if (hit) reason = "stop_loss";
      }
      if (!reason && position.takeProfit) {
        const hit = position.side === "buy" ? currentClosePrice.gte(position.takeProfit) : currentClosePrice.lte(position.takeProfit);
        if (hit) reason = "take_profit";
      }

      if (reason) {
        try {
          await closePosition(position.tenantId, position.id, reason);
        } catch (err) {
          console.error(`[tick-processor] failed to auto-close position ${position.id}`, err);
        }
      }
    }
  }

  for (const key of touchedUsers) {
    const [tenantId, userId] = key.split(":");
    await checkStopOut(tenantId, userId);
  }
}

async function checkStopOut(tenantId: string, userId: string) {
  let snapshot = await getAccountSnapshot(tenantId, userId);

  while (snapshot.marginLevel !== null && snapshot.marginLevel.lt(STOP_OUT_LEVEL) && snapshot.openPositions.length > 0) {
    const biggestLoser = snapshot.openPositions.reduce((worst, p) => (p.unrealizedPnl.lt(worst.unrealizedPnl) ? p : worst));
    try {
      await closePosition(tenantId, biggestLoser.id, "stop_out");
    } catch (err) {
      console.error(`[stop-out] failed to close position ${biggestLoser.id}`, err);
      break;
    }
    snapshot = await getAccountSnapshot(tenantId, userId);
  }
}

export { MARGIN_CALL_LEVEL };

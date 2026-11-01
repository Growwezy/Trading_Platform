import { Prisma, type Symbol as SymbolModel } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export interface AdjustedPrice {
  bid: Prisma.Decimal;
  ask: Prisma.Decimal;
}

const SYMBOL_CACHE_TTL_MS = 60_000; // symbols change rarely (Admin/Super Admin config only)
const MARKUP_CACHE_TTL_MS = 10_000; // group markups change rarely; short TTL keeps edits visible quickly

const symbolCache = new Map<string, { symbol: SymbolModel; expiresAt: number }>();
const markupCache = new Map<string, { points: Prisma.Decimal; expiresAt: number }>();

/**
 * This is called on every price tick, for every open position and every
 * WebSocket subscriber — a naive implementation re-querying Postgres on
 * every call exhausted Prisma's connection pool under a fast-moving symbol
 * (Binance's BTCUSDT trade stream fires several times a second). Small
 * in-memory caches keep this a Redis-speed/memory-speed operation instead.
 */
async function getCachedSymbol(symbolId: string): Promise<SymbolModel> {
  const cached = symbolCache.get(symbolId);
  if (cached && cached.expiresAt > Date.now()) return cached.symbol;

  const symbol = await prisma.symbol.findUniqueOrThrow({ where: { id: symbolId } });
  symbolCache.set(symbolId, { symbol, expiresAt: Date.now() + SYMBOL_CACHE_TTL_MS });
  return symbol;
}

async function getCachedMarkupPoints(tenantId: string, groupId: string, symbolId: string): Promise<Prisma.Decimal> {
  const key = `${tenantId}:${groupId}:${symbolId}`;
  const cached = markupCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.points;

  const specific = await prisma.groupMarkup.findFirst({ where: { tenantId, groupId, symbolId } });
  const blanket = specific ?? (await prisma.groupMarkup.findFirst({ where: { tenantId, groupId, symbolId: null } }));
  const points = blanket?.markupPoints ?? new Prisma.Decimal(0);

  markupCache.set(key, { points, expiresAt: Date.now() + MARKUP_CACHE_TTL_MS });
  return points;
}

/**
 * TRADING_ENGINE.md §5: rawPrice -> symbol's base spread -> tenant/group markup
 * -> adjusted bid/ask. This is the only price the engine (or a chart) ever uses.
 *
 * Simplification (undocumented elsewhere, flagged here): "points" are treated as
 * a direct price-unit offset, not pips — TRADING_ENGINE.md doesn't define a
 * pip/point conversion, and seed data follows the same convention.
 */
export async function computeAdjustedPrice(
  symbolId: string,
  tenantId: string,
  groupId: string | null,
  rawPrice: number,
): Promise<AdjustedPrice> {
  const symbol = await getCachedSymbol(symbolId);

  // open item #25: default markup for an ungrouped trader — 0 extra markup is the placeholder.
  const markupPoints = groupId ? await getCachedMarkupPoints(tenantId, groupId, symbolId) : new Prisma.Decimal(0);

  const totalSpread = symbol.baseSpreadPoints.add(markupPoints);
  const half = totalSpread.div(2);
  const raw = new Prisma.Decimal(rawPrice);

  return { bid: raw.sub(half), ask: raw.add(half) };
}

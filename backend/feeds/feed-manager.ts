import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { binanceFeed } from "./binance.feed.js";
import { twelveDataFeed } from "./twelvedata.feed.js";
import type { FeedAdapter, RawTick } from "./types.js";

const adapters: Record<string, FeedAdapter> = {
  binance: binanceFeed,
  twelvedata: twelveDataFeed,
};

function priceKey(symbolCode: string) {
  return `price:${symbolCode}`;
}

function tickChannel(symbolCode: string) {
  return `rawticks:${symbolCode}`;
}

/**
 * One upstream connection per provider:symbol, shared across every tenant
 * (ARCHITECTURE.md §6) — started once at process boot, not per request.
 */
export async function startFeedManager() {
  const symbols = await prisma.symbol.findMany();

  for (const symbol of symbols) {
    const adapter = adapters[symbol.provider];
    if (!adapter) {
      console.warn(`[feed-manager] no adapter for provider "${symbol.provider}" (${symbol.code})`);
      continue;
    }

    adapter.subscribe(symbol.code, async (tick: RawTick) => {
      await redis.set(priceKey(tick.symbolCode), JSON.stringify(tick));
      await redis.publish(tickChannel(tick.symbolCode), JSON.stringify(tick));
    });
  }

  console.log(`[feed-manager] subscribed to ${symbols.length} symbol(s): ${symbols.map((s) => s.code).join(", ")}`);
}

export async function getCachedPrice(symbolCode: string): Promise<RawTick | null> {
  const raw = await redis.get(priceKey(symbolCode));
  return raw ? JSON.parse(raw) : null;
}

export function tickChannelName(symbolCode: string) {
  return tickChannel(symbolCode);
}

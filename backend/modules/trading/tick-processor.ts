import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { tickChannelName } from "../../feeds/feed-manager.js";
import { processTickForSymbol } from "./trading.service.js";

// A fast-moving symbol (e.g. Binance's BTCUSDT trade stream) can fire several
// ticks a second; SL/TP doesn't need sub-second precision, so each symbol is
// processed at most this often — keeps the DB query-per-tick volume sane.
const MIN_PROCESS_INTERVAL_MS = 300;

/**
 * Subscribes to every symbol's raw-tick channel and runs SL/TP + stop-out
 * checks on each one (TRADING_ENGINE.md §8, §9). Needs its own Redis
 * connection — a client in subscribe mode can't issue other commands.
 */
export async function startTickProcessor() {
  const subscriber = redis.duplicate();
  const symbols = await prisma.symbol.findMany();
  const lastProcessedAt = new Map<string, number>();

  for (const symbol of symbols) {
    await subscriber.subscribe(tickChannelName(symbol.code));
  }

  subscriber.on("message", async (channel, message) => {
    try {
      const tick = JSON.parse(message);

      const last = lastProcessedAt.get(tick.symbolCode) ?? 0;
      const now = Date.now();
      if (now - last < MIN_PROCESS_INTERVAL_MS) return;
      lastProcessedAt.set(tick.symbolCode, now);

      await processTickForSymbol(tick.symbolCode, tick.price);
    } catch (err) {
      console.error(`[tick-processor] error handling message on ${channel}`, err);
    }
  });

  console.log(`[tick-processor] watching ${symbols.length} symbol(s) for SL/TP and stop-out`);
}

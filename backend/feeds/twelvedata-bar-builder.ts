import { redis } from "../lib/redis.js";
import { tickChannelName } from "./feed-manager.js";
import { barChannelName, intervalToSeconds } from "./bar-channel.js";
import type { Bar } from "./bars.service.js";

/**
 * Twelve Data's free-tier WS only gives raw price ticks (backend/feeds/twelvedata.feed.ts),
 * unlike Binance which streams pre-built candles — so candles are built here by
 * bucketing ticks from the existing raw-tick pub/sub (feed-manager.ts already
 * publishes these for the trading engine; this reuses the same stream rather
 * than opening a second upstream connection).
 */
const symbolSubscribers = new Map<string, ReturnType<typeof redis.duplicate>>();
const currentBars = new Map<string, { bucketStart: number; bar: Bar }>(); // key: symbolCode:interval

export function ensureTwelveDataBarBuilder(symbolCode: string, interval: string) {
  const barKey = `${symbolCode}:${interval}`;
  if (currentBars.has(barKey)) return;
  currentBars.set(barKey, { bucketStart: -1, bar: { time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 } });

  if (symbolSubscribers.has(symbolCode)) return; // already consuming ticks for this symbol

  const subscriber = redis.duplicate();
  symbolSubscribers.set(symbolCode, subscriber);

  subscriber.subscribe(tickChannelName(symbolCode)).catch((err) => {
    console.error(`[twelvedata-bar-builder] failed to subscribe to ticks for ${symbolCode}`, err);
  });

  subscriber.on("message", async (_channel, message) => {
    try {
      const tick = JSON.parse(message);
      await onTick(symbolCode, tick.price, tick.ts ?? Date.now());
    } catch (err) {
      console.error(`[twelvedata-bar-builder] failed to process tick for ${symbolCode}`, err);
    }
  });
}

async function onTick(symbolCode: string, price: number, ts: number) {
  for (const [barKey, state] of currentBars) {
    const [sym, interval] = barKey.split(":");
    if (sym !== symbolCode) continue;

    const seconds = intervalToSeconds(interval);
    const bucketStart = Math.floor(ts / 1000 / seconds) * seconds;

    if (state.bucketStart !== bucketStart) {
      if (state.bucketStart !== -1) {
        await publish(symbolCode, interval, state.bar, true); // finalize the previous bar
      }
      state.bucketStart = bucketStart;
      state.bar = { time: bucketStart, open: price, high: price, low: price, close: price, volume: 0 };
    } else {
      state.bar.high = Math.max(state.bar.high, price);
      state.bar.low = Math.min(state.bar.low, price);
      state.bar.close = price;
    }

    await publish(symbolCode, interval, state.bar, false);
  }
}

async function publish(symbolCode: string, interval: string, bar: Bar, isClosed: boolean) {
  const payload = { type: "bar" as const, symbol: symbolCode, interval, bar, isClosed };
  await redis.publish(barChannelName(symbolCode, interval), JSON.stringify(payload));
}

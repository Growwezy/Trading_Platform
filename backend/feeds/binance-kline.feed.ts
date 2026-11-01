import WebSocket from "ws";
import { redis } from "../lib/redis.js";
import { barChannelName } from "./bar-channel.js";
import { normalizeBinanceInterval } from "./bars.service.js";

const RECONNECT_DELAY_MS = 3000;

// Binance streams candles natively — no server-side aggregation needed, unlike
// Twelve Data (see twelvedata-bar-builder.ts). One connection per (symbol,
// interval), started on demand and shared across every client watching it.
const activeStreams = new Set<string>();

export function ensureBinanceKlineStream(symbolCode: string, interval: string) {
  const key = `${symbolCode}:${interval}`;
  if (activeStreams.has(key)) return;
  activeStreams.add(key);

  connect(symbolCode, interval);
}

function connect(symbolCode: string, interval: string) {
  const stream = symbolCode.toLowerCase();
  const binanceInterval = normalizeBinanceInterval(interval);
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}@kline_${binanceInterval}`);

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.e !== "kline" || !msg.k) return;

      const k = msg.k;
      const payload = {
        type: "bar" as const,
        symbol: symbolCode,
        interval,
        bar: {
          time: Math.floor(k.t / 1000),
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close: Number(k.c),
          volume: Number(k.v),
        },
        isClosed: Boolean(k.x),
      };

      await redis.publish(barChannelName(symbolCode, interval), JSON.stringify(payload));
    } catch (err) {
      console.error(`[binance-kline-feed] failed to parse message for ${symbolCode}:${interval}`, err);
    }
  });

  ws.on("error", (err) => {
    console.error(`[binance-kline-feed] error on ${symbolCode}:${interval}`, err.message);
  });

  ws.on("close", () => {
    console.warn(`[binance-kline-feed] ${symbolCode}:${interval} closed, reconnecting in ${RECONNECT_DELAY_MS}ms`);
    setTimeout(() => connect(symbolCode, interval), RECONNECT_DELAY_MS);
  });
}

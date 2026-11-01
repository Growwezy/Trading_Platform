import WebSocket from "ws";
import type { FeedAdapter, TickHandler } from "./types.js";

const RECONNECT_DELAY_MS = 3000;

class BinanceFeed implements FeedAdapter {
  subscribe(symbolCode: string, onTick: TickHandler): void {
    this.connect(symbolCode, onTick);
  }

  private connect(symbolCode: string, onTick: TickHandler) {
    const stream = symbolCode.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}@trade`);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.e !== "trade") return;
        onTick({ provider: "binance", symbolCode, price: Number(msg.p), ts: msg.T ?? Date.now() });
      } catch (err) {
        console.error(`[binance-feed] failed to parse message for ${symbolCode}`, err);
      }
    });

    ws.on("error", (err) => {
      console.error(`[binance-feed] error on ${symbolCode}`, err.message);
    });

    ws.on("close", () => {
      console.warn(`[binance-feed] ${symbolCode} closed, reconnecting in ${RECONNECT_DELAY_MS}ms`);
      setTimeout(() => this.connect(symbolCode, onTick), RECONNECT_DELAY_MS);
    });
  }
}

export const binanceFeed = new BinanceFeed();

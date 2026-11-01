import WebSocket from "ws";
import type { FeedAdapter, TickHandler } from "./types.js";

const RECONNECT_DELAY_MS = 3000;

/** "EURUSD" -> "EUR/USD", "XAUUSD" -> "XAU/USD" — Twelve Data's symbol format. */
function toTwelveDataSymbol(code: string) {
  return `${code.slice(0, -3)}/${code.slice(-3)}`;
}

/**
 * Twelve Data's free/trial plans cap concurrent WebSocket connections (TECH_STACK.md),
 * so unlike Binance this pools every symbol onto ONE shared connection instead of one
 * connection per symbol.
 */
class TwelveDataFeed implements FeedAdapter {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, TickHandler[]>(); // keyed by our symbolCode
  private symbolByTdSymbol = new Map<string, string>(); // "EUR/USD" -> "EURUSD"

  subscribe(symbolCode: string, onTick: TickHandler): void {
    const existing = this.handlers.get(symbolCode) ?? [];
    existing.push(onTick);
    this.handlers.set(symbolCode, existing);
    this.symbolByTdSymbol.set(toTwelveDataSymbol(symbolCode), symbolCode);

    if (!this.ws) {
      this.connect();
    } else if (this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe([symbolCode]);
    }
  }

  private connect() {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
      console.error("[twelvedata-feed] TWELVE_DATA_API_KEY is not set — feed disabled");
      return;
    }

    const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);
    this.ws = ws;

    ws.on("open", () => {
      const symbols = [...this.handlers.keys()];
      if (symbols.length > 0) this.sendSubscribe(symbols);
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.event !== "price" || !msg.symbol || msg.price === undefined) return;
        const symbolCode = this.symbolByTdSymbol.get(msg.symbol);
        if (!symbolCode) return;

        const tick = { provider: "twelvedata" as const, symbolCode, price: Number(msg.price), ts: Date.now() };
        for (const handler of this.handlers.get(symbolCode) ?? []) handler(tick);
      } catch (err) {
        console.error("[twelvedata-feed] failed to parse message", err);
      }
    });

    ws.on("error", (err) => console.error("[twelvedata-feed] error", err.message));

    ws.on("close", () => {
      console.warn(`[twelvedata-feed] closed, reconnecting in ${RECONNECT_DELAY_MS}ms`);
      this.ws = null;
      setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
    });
  }

  private sendSubscribe(symbolCodes: string[]) {
    const symbols = symbolCodes.map(toTwelveDataSymbol).join(",");
    this.ws?.send(JSON.stringify({ action: "subscribe", params: { symbols } }));
  }
}

export const twelveDataFeed = new TwelveDataFeed();

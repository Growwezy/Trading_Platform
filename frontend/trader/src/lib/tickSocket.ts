// Single shared WebSocket connection for live bid/ask ticks, used by any
// component that needs a live price (Order Panel, Holdings' floating PnL).
// Separate from chart-feed's own connection, which is scoped to bars only.
import { useMarketStore } from "../store/useMarketStore.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEV_TENANT_SUBDOMAIN = import.meta.env.VITE_DEV_TENANT_SUBDOMAIN as string | undefined;

let ws: WebSocket | null = null;
let wsReady: Promise<WebSocket> | null = null;
const subscribedSymbols = new Set<string>();

function getWebSocket(): Promise<WebSocket> {
  if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(ws);
  if (wsReady) return wsReady;

  wsReady = new Promise((resolve, reject) => {
    const wsBase = API_BASE_URL.replace(/^http/, "ws");
    const url = new URL(`${wsBase}/ws`);
    if (DEV_TENANT_SUBDOMAIN) url.searchParams.set("tenant", DEV_TENANT_SUBDOMAIN);

    const socket = new WebSocket(url.toString());
    ws = socket;

    socket.onopen = () => {
      wsReady = null;
      if (subscribedSymbols.size > 0) {
        socket.send(JSON.stringify({ type: "subscribe", symbols: [...subscribedSymbols] }));
      }
      resolve(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "tick") return;
        useMarketStore.getState().setPrice(data.symbol, { bid: data.bid, ask: data.ask, ts: data.ts });
      } catch (err) {
        console.error("[tickSocket] failed to parse message", err);
      }
    };

    socket.onerror = () => reject(new Error("WebSocket connection error"));

    socket.onclose = () => {
      ws = null;
      wsReady = null;
      if (subscribedSymbols.size > 0) {
        setTimeout(() => getWebSocket().catch(() => {}), 2000);
      }
    };
  });

  return wsReady;
}

export function subscribeTicks(symbols: string[]) {
  const newSymbols = symbols.filter((s) => !subscribedSymbols.has(s));
  newSymbols.forEach((s) => subscribedSymbols.add(s));

  if (newSymbols.length > 0) {
    getWebSocket()
      .then((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "subscribe", symbols: newSymbols }));
        }
      })
      .catch((err) => console.error("[tickSocket] subscribe failed", err));
  }
}

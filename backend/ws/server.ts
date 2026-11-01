import type { Server as HttpServer, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import cookie from "cookie";
import cookieSignature from "cookie-signature";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { tickChannelName } from "../feeds/feed-manager.js";
import { barChannelName } from "../feeds/bar-channel.js";
import { ensureBinanceKlineStream } from "../feeds/binance-kline.feed.js";
import { ensureTwelveDataBarBuilder } from "../feeds/twelvedata-bar-builder.js";
import { resolveTenantByHost } from "../modules/tenants/tenants.service.js";
import { computeAdjustedPrice } from "../modules/trading/pricing.service.js";

interface ConnectionContext {
  ws: WebSocket;
  tenantId: string;
  groupId: string | null;
}

async function authenticateTrader(req: IncomingMessage, tenantId: string) {
  const header = req.headers.cookie;
  if (!header) return null;

  const cookies = cookie.parse(header);
  const raw = cookies["sid_trader"];
  if (!raw || !raw.startsWith("s:")) return null;

  const sid = cookieSignature.unsign(raw.slice(2), process.env.SESSION_SECRET!);
  if (!sid) return null;

  const sessionJson = await redis.get(`sess:trader:${sid}`);
  if (!sessionJson) return null;

  const session = JSON.parse(sessionJson);
  if (session.tenantId !== tenantId || !session.userId) return null;

  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function startWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // symbolCode -> {id, provider}, loaded once; symbols don't change often enough to warrant a live refresh here.
  const symbolByCode = new Map<string, { id: string; provider: "binance" | "twelvedata" }>();
  for (const symbol of await prisma.symbol.findMany()) {
    symbolByCode.set(symbol.code, { id: symbol.id, provider: symbol.provider });
  }

  // symbolCode -> connections currently subscribed to its ticks.
  const subscribers = new Map<string, Set<ConnectionContext>>();
  // "symbolCode:interval" -> raw WebSocket connections currently subscribed to its bars.
  const barSubscribers = new Map<string, Set<WebSocket>>();
  // Per-connection record of what to clean up on close.
  const connectionSubscriptions = new WeakMap<
    WebSocket,
    { ticks: Array<{ symbolCode: string; ctx: ConnectionContext }>; bars: string[] }
  >();

  const tickSubscriber = redis.duplicate();
  for (const code of symbolByCode.keys()) {
    await tickSubscriber.subscribe(tickChannelName(code));
  }

  tickSubscriber.on("message", async (channel, message) => {
    const symbolCode = channel.replace("rawticks:", "");
    const contexts = subscribers.get(symbolCode);
    if (!contexts || contexts.size === 0) return;

    const tick = JSON.parse(message);
    const symbol = symbolByCode.get(symbolCode);
    if (!symbol) return;

    for (const ctx of contexts) {
      if (ctx.ws.readyState !== WebSocket.OPEN) continue;
      const adjusted = await computeAdjustedPrice(symbol.id, ctx.tenantId, ctx.groupId, tick.price);
      ctx.ws.send(JSON.stringify({ type: "tick", symbol: symbolCode, bid: adjusted.bid.toString(), ask: adjusted.ask.toString(), ts: tick.ts }));
    }
  });

  // Bars use a separate Redis subscriber, subscribed to channels on demand
  // (only once some client actually asks for that symbol+interval), unlike
  // the tick subscriber above which covers every symbol upfront.
  const barSubscriber = redis.duplicate();
  const subscribedBarChannels = new Set<string>();

  barSubscriber.on("message", (channel, message) => {
    // channel is "bars:<symbol>:<interval>"; barSubscribers is keyed "<symbol>:<interval>".
    const barKey = channel.slice("bars:".length);
    const targets = barSubscribers.get(barKey);
    if (!targets || targets.size === 0) return;
    for (const ws of targets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    }
  });

  // Tenant/auth resolution happens here, BEFORE the socket is accepted — not
  // inside the "connection" handler. Doing async work there left a race: the
  // client's first message (sent right on "open") could arrive before the
  // "message" listener was attached, and `ws` doesn't buffer events for
  // listeners added after the fact, so the subscribe request was silently lost.
  httpServer.on("upgrade", async (req, socket, head) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const hostname = (req.headers.host ?? "").split(":")[0];
    const devOverride = url.searchParams.get("tenant") ?? undefined;
    const tenant = await resolveTenantByHost(hostname, devOverride);
    if (!tenant) {
      socket.destroy();
      return;
    }

    const user = await authenticateTrader(req, tenant.id);

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, tenant, user);
    });
  });

  wss.on("connection", (ws: WebSocket, tenant: { id: string }, user: { groupId: string | null } | null) => {
    const groupId = user?.groupId ?? null;
    const subscribedSymbols = new Set<string>();
    const subscribedBarKeys = new Set<string>();
    connectionSubscriptions.set(ws, { ticks: [], bars: [] });

    async function handleSubscribeTicks(symbolCodes: string[]) {
      for (const symbolCode of symbolCodes) {
        if (!symbolByCode.has(symbolCode) || subscribedSymbols.has(symbolCode)) continue;

        const enabled = await prisma.tenantSymbol.findFirst({
          where: { tenantId: tenant.id, enabled: true, symbol: { code: symbolCode } },
        });
        if (!enabled) continue;

        subscribedSymbols.add(symbolCode);
        const ctx: ConnectionContext = { ws, tenantId: tenant.id, groupId };
        const set = subscribers.get(symbolCode) ?? new Set();
        set.add(ctx);
        subscribers.set(symbolCode, set);
        connectionSubscriptions.get(ws)!.ticks.push({ symbolCode, ctx });
      }
    }

    async function handleSubscribeBars(symbolCode: string, interval: string) {
      const symbol = symbolByCode.get(symbolCode);
      if (!symbol) return;

      const enabled = await prisma.tenantSymbol.findFirst({
        where: { tenantId: tenant.id, enabled: true, symbol: { code: symbolCode } },
      });
      if (!enabled) return;

      const barKey = `${symbolCode}:${interval}`;
      if (subscribedBarKeys.has(barKey)) return;
      subscribedBarKeys.add(barKey);

      if (symbol.provider === "binance") {
        ensureBinanceKlineStream(symbolCode, interval);
      } else {
        ensureTwelveDataBarBuilder(symbolCode, interval);
      }

      const channel = barChannelName(symbolCode, interval);
      if (!subscribedBarChannels.has(channel)) {
        subscribedBarChannels.add(channel);
        await barSubscriber.subscribe(channel);
      }

      const set = barSubscribers.get(barKey) ?? new Set();
      set.add(ws);
      barSubscribers.set(barKey, set);
      connectionSubscriptions.get(ws)!.bars.push(barKey);
    }

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "subscribe" && Array.isArray(msg.symbols)) {
          await handleSubscribeTicks(msg.symbols as string[]);
        } else if (msg.type === "subscribeBars" && typeof msg.symbol === "string" && typeof msg.interval === "string") {
          await handleSubscribeBars(msg.symbol, msg.interval);
        }
      } catch (err) {
        console.error("[ws] failed to handle message", err);
      }
    });

    ws.on("close", () => {
      const record = connectionSubscriptions.get(ws);
      for (const { symbolCode, ctx } of record?.ticks ?? []) {
        subscribers.get(symbolCode)?.delete(ctx);
      }
      for (const barKey of record?.bars ?? []) {
        barSubscribers.get(barKey)?.delete(ws);
      }
    });
  });

  console.log("[ws] WebSocket server attached at /ws");
}

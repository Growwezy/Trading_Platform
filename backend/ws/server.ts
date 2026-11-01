import type { Server as HttpServer, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import cookie from "cookie";
import cookieSignature from "cookie-signature";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { tickChannelName } from "../feeds/feed-manager.js";
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

  // symbolCode -> id, loaded once; symbols don't change often enough to warrant a live refresh here.
  const symbolIdByCode = new Map<string, string>();
  for (const symbol of await prisma.symbol.findMany()) {
    symbolIdByCode.set(symbol.code, symbol.id);
  }

  // symbolCode -> connections currently subscribed to it.
  const subscribers = new Map<string, Set<ConnectionContext>>();
  // Per-connection record of what to clean up on close.
  const connectionSubscriptions = new WeakMap<WebSocket, Array<{ symbolCode: string; ctx: ConnectionContext }>>();

  const tickSubscriber = redis.duplicate();
  for (const code of symbolIdByCode.keys()) {
    await tickSubscriber.subscribe(tickChannelName(code));
  }

  tickSubscriber.on("message", async (channel, message) => {
    const symbolCode = channel.replace("rawticks:", "");
    const contexts = subscribers.get(symbolCode);
    if (!contexts || contexts.size === 0) return;

    const tick = JSON.parse(message);
    const symbolId = symbolIdByCode.get(symbolCode);
    if (!symbolId) return;

    for (const ctx of contexts) {
      if (ctx.ws.readyState !== WebSocket.OPEN) continue;
      const adjusted = await computeAdjustedPrice(symbolId, ctx.tenantId, ctx.groupId, tick.price);
      ctx.ws.send(JSON.stringify({ type: "tick", symbol: symbolCode, bid: adjusted.bid.toString(), ask: adjusted.ask.toString(), ts: tick.ts }));
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

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type !== "subscribe" || !Array.isArray(msg.symbols)) return;

        for (const symbolCode of msg.symbols as string[]) {
          if (!symbolIdByCode.has(symbolCode) || subscribedSymbols.has(symbolCode)) continue;

          const enabled = await prisma.tenantSymbol.findFirst({
            where: { tenantId: tenant.id, enabled: true, symbol: { code: symbolCode } },
          });
          if (!enabled) continue;

          subscribedSymbols.add(symbolCode);
          const ctx: ConnectionContext = { ws, tenantId: tenant.id, groupId };
          const set = subscribers.get(symbolCode) ?? new Set();
          set.add(ctx);
          subscribers.set(symbolCode, set);
          connectionSubscriptions.set(ws, [...(connectionSubscriptions.get(ws) ?? []), { symbolCode, ctx }]);
        }
      } catch (err) {
        console.error("[ws] failed to handle message", err);
      }
    });

    ws.on("close", () => {
      for (const { symbolCode, ctx } of connectionSubscriptions.get(ws) ?? []) {
        subscribers.get(symbolCode)?.delete(ctx);
      }
    });
  });

  console.log("[ws] WebSocket server attached at /ws");
}

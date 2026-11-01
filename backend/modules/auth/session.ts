import session from "express-session";
import RedisStore from "connect-redis";
import { redis } from "../../lib/redis.js";

/**
 * One session cookie per surface (ARCHITECTURE.md §3) — trader/admin/superadmin
 * never share a cookie, so being logged in on one implies nothing about another.
 */
export function createSessionMiddleware(surface: "trader" | "admin" | "superadmin") {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  return session({
    store: new RedisStore({ client: redis, prefix: `sess:${surface}:` }),
    name: `sid_${surface}`,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });
}

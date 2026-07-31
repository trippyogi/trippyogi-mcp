import type { Context, Next } from "hono";
import type { AppConfig } from "../config.js";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function normalizeIp(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value.startsWith("::ffff:")) return value.slice("::ffff:".length);
  return value;
}

function clientKey(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0];
      if (first?.trim()) return normalizeIp(first);
    }
    const realIp = c.req.header("x-real-ip");
    if (realIp?.trim()) return normalizeIp(realIp);
  }
  return normalizeIp(c.req.header("x-real-ip") ?? "local");
}

export function rateLimitMiddleware(config: AppConfig) {
  return async (c: Context, next: Next) => {
    const key = clientKey(c, config.trustProxy);
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + config.rateLimitWindowMs });
      await next();
      return;
    }

    if (existing.count >= config.rateLimitMax) {
      const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      c.header("Retry-After", String(retryAfter));
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    existing.count += 1;
    await next();
  };
}

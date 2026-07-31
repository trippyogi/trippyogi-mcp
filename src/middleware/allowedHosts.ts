import type { Context, Next } from "hono";
import type { AppConfig } from "../config.js";

export function allowedHostsMiddleware(config: AppConfig) {
  const allow = new Set(config.allowedHosts.map((host) => host.toLowerCase()));

  return async (c: Context, next: Next) => {
    const raw = c.req.header("host") ?? "";
    const hostname = raw.replace(/:\d+$/, "").toLowerCase();
    if (!allow.has(hostname)) {
      return c.json({ error: "Invalid Host" }, 421);
    }
    await next();
  };
}

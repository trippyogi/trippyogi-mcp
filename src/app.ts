import { Hono } from "hono";
import type { AppConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { loadClaims, loadProfile } from "./content/load.js";
import { allowedHostsMiddleware } from "./middleware/allowedHosts.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import type { ClaimRecord, Profile } from "./types.js";

export interface AppDependencies {
  config?: AppConfig;
  profile?: Profile;
  claims?: ClaimRecord[];
}

export function createApp(dependencies: AppDependencies = {}) {
  const config = dependencies.config ?? loadConfig();
  const profile = dependencies.profile ?? loadProfile();
  const claims = dependencies.claims ?? loadClaims();
  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
  });

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "trippyogi-mcp",
      version: config.serviceVersion
    })
  );

  app.use("/mcp", allowedHostsMiddleware(config));
  app.use("/mcp", rateLimitMiddleware(config));

  app.all("/mcp", async (c) => {
    const [{ createMcpServer }, { WebStandardStreamableHTTPServerTransport }] = await Promise.all([
      import("./mcp/server.js"),
      import("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js")
    ]);

    const accept = c.req.header("accept") ?? "";
    let request = c.req.raw;
    if (accept && !accept.includes("text/event-stream") && accept.includes("application/json")) {
      const headers = new Headers(request.headers);
      headers.set("accept", `${accept}, text/event-stream`);
      request = new Request(request, { headers });
    }

    const mcp = createMcpServer(profile, claims);
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true
    });
    await mcp.connect(transport);
    return transport.handleRequest(request);
  });

  return app;
}

export const app = createApp();

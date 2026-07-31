import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadClaims, loadProfile } from "../src/content/load.js";

const app = createApp({
  config: {
    port: 3000,
    allowedHosts: ["localhost", "127.0.0.1"],
    trustProxy: false,
    rateLimitWindowMs: 60_000,
    rateLimitMax: 1000,
    publicBaseUrl: "http://localhost:3000",
    serviceVersion: "0.1.0"
  },
  profile: loadProfile(),
  claims: loadClaims()
});

describe("HTTP app", () => {
  it("serves health", async () => {
    const res = await app.request("http://localhost/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, service: "trippyogi-mcp" });
  });

  it("rejects disallowed hosts on /mcp", async () => {
    const res = await app.request("http://evil.test/mcp", {
      method: "POST",
      headers: {
        host: "evil.test",
        accept: "application/json, text/event-stream",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.0" }
        }
      })
    });
    expect(res.status).toBe(421);
  });

  it("initializes MCP over streamable HTTP", async () => {
    const res = await app.request("http://localhost/mcp", {
      method: "POST",
      headers: {
        host: "localhost",
        accept: "application/json, text/event-stream",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.0" }
        }
      })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result?: { serverInfo?: { name?: string } } };
    expect(body.result?.serverInfo?.name).toBe("trippyogi-mcp");
  });
});

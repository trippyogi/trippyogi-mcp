import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp({ config });

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`trippyogi-mcp listening on http://localhost:${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`Health: http://localhost:${port}/health`);
});

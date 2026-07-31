import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { matchClaim } from "../claims/match.js";
import { logToolCall } from "../middleware/logging.js";
import type { ClaimRecord, Profile } from "../types.js";

function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }]
  };
}

export function createMcpServer(profile: Profile, claims: ClaimRecord[]): McpServer {
  const server = new McpServer({
    name: "trippyogi-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "get_projects",
    {
      description:
        "Shipped or publicly inspectable work with source, package, live, and receipt URLs where available.",
      inputSchema: {}
    },
    async () => {
      logToolCall("get_projects");
      return textResult(profile.projects);
    }
  );

  server.registerTool(
    "get_experience",
    {
      description: "Roles, dates, and what was built, aligned to the public resume.",
      inputSchema: {}
    },
    async () => {
      logToolCall("get_experience");
      return textResult(profile.experience);
    }
  );

  server.registerTool(
    "get_availability",
    {
      description: "Current role targets, work modes, and public contact paths.",
      inputSchema: {}
    },
    async () => {
      logToolCall("get_availability");
      return textResult(profile.availability);
    }
  );

  server.registerTool(
    "verify_claim",
    {
      description:
        "Deterministic resume claim verification against public receipts. Returns verified, partially_verified, or not_verifiable.",
      inputSchema: {
        claim: z.string().max(500)
      }
    },
    async ({ claim }) => {
      logToolCall("verify_claim");
      return textResult(matchClaim(claim, claims));
    }
  );

  return server;
}

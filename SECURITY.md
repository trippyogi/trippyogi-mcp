# Security

## Design constraints

- Public, unauthenticated, read-only MCP tools only.
- No write tools, user accounts, contact discovery, or analytics payloads.
- Tool handlers log the tool name and timestamp only. Tool inputs are never logged.
- Claim verification is deterministic against checked-in receipts. The server does not browse the web or call an LLM at request time.

## Reporting

Report security issues privately to peace@trippyogi.com. Do not open a public issue for vulnerabilities that could enable abuse of the public endpoint (for example rate-limit bypasses).

## Operational notes

- Set `ALLOWED_HOSTS` to the deployment hostname and any reverse-proxy hostnames that forward to this service.
- Apply an edge rate limit in front of `/mcp` in production in addition to the in-process limiter.

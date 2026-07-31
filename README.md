# trippyogi-mcp

An MCP server that lets you fact-check my resume.

Most portfolios ask a reviewer to trust a set of claims. This one exposes the underlying work as structured data and gives every claim one of three answers: `verified`, `partially_verified`, or `not_verifiable`.

`not_verifiable` is intentional. A private production metric or old employer project does not become publicly proven because it appears on a resume.

## Tools

| Tool | Returns |
| --- | --- |
| `get_projects` | Shipped or publicly inspectable work with source, package, live, and receipt URLs where available. |
| `get_experience` | Roles, dates, and what was built, aligned to the public resume. |
| `get_availability` | Current role targets, work modes, and public contact paths. |
| `verify_claim` | A verdict, supported and unsupported portions, estimate marker, and receipt URLs for a natural-language claim. |

The server is public, stateless, unauthenticated, rate-limited, and read-only. It records the tool name and timestamp for each call. It never logs tool inputs.

## Run it

Requires Node 22 or newer.

```bash
npm install
npm run check
npm run dev
```

The endpoint is `http://localhost:3000/mcp`; health is at `/health`.

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Select **Streamable HTTP** and connect to `http://localhost:3000/mcp`.

## Example

Input:

```json
{
  "claim": "Legendari had 673 Kickstarter backers"
}
```

Output:

```json
{
  "verdict": "verified",
  "claim": "Legendari had 673 Kickstarter backers",
  "matchedClaim": "Legendari was backed by 673 Kickstarter backers who pledged $190,292 against a $125,000 goal.",
  "supported": "Kickstarter publicly reports the backer count, pledged amount, and campaign goal.",
  "unsupported": null,
  "estimate": false,
  "evidence": [
    {
      "label": "Legendari Kickstarter",
      "url": "https://www.kickstarter.com/projects/metatravelers/legendari-action-figures",
      "kind": "independent"
    }
  ]
}
```

## Content model

- [`content/profile.json`](content/profile.json) is the shared source for projects, experience, availability, the Markdown surfaces, and JSON-LD.
- [`content/claims.json`](content/claims.json) maps resume claims to receipts and caveats.
- `npm run generate:site` produces `site/llms.txt`, `site/resume.md`, `site/projects.md`, and `site/person.jsonld` from the same source.

The natural-language matcher is deterministic. It does not use an LLM, browse at request time, or invent evidence. Numeric conflicts fail closed: asking it to verify 9,000 units will not match a receipt for 7,777.

## Deploy

### Vercel

1. Import this repository as a new Vercel project.
2. Set `ALLOWED_HOSTS` to the deployment hostname plus `trippyogi.com`, comma-separated.
3. Deploy. `vercel.json` exposes the function at `/mcp`.
4. In the existing `trippyogi.com` Vercel project, add an external rewrite from `/mcp` to the new project's `/mcp` URL. This keeps the public connector URL on the portfolio domain.

Example rewrite in the portfolio project's `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/mcp",
      "destination": "https://YOUR-MCP-PROJECT.vercel.app/mcp"
    }
  ]
}
```

Copy the generated files into the portfolio site's public directory so they resolve as `/llms.txt`, `/resume.md`, and `/projects.md`. Add the contents of `site/person.jsonld` to the homepage in a `<script type="application/ld+json">` element.

### Container

```bash
docker build -t trippyogi-mcp .
docker run --rm -p 3000:3000 \
  -e TRUST_PROXY=1 \
  -e ALLOWED_HOSTS=trippyogi.com,localhost \
  trippyogi-mcp
```

Put the service behind the same reverse proxy as the portfolio and route `/mcp` to port 3000. Apply a second edge rate limit there.

## Fork it for your own resume

1. Replace the person, project, experience, and availability records in `content/profile.json`.
2. Replace every record in `content/claims.json`; do not carry over another person's evidence.
3. Update allowed hosts, package metadata, and JSON-LD.
4. Run `npm run check` and inspect all generated files before deploying.

If a claim has no public receipt, keep it and mark it `not_verifiable`, or remove it. Do not turn a self-authored resume into its own verification source.

## Security and privacy

There are no write tools, user records, analytics payloads, or contact-discovery features. See [SECURITY.md](SECURITY.md) for the reporting path and design constraints.

MIT licensed. The personal data and claims are examples, not an invitation to impersonate their subject.

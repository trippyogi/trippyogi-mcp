import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractNumbers, matchClaim } from "../src/claims/match.js";
import type { ClaimRecord } from "../src/types.js";

const claims = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "content", "claims.json"), "utf8")
) as ClaimRecord[];

describe("extractNumbers", () => {
  it("parses comma and currency forms", () => {
    expect(extractNumbers("7,777 minted and $190,292 pledged")).toEqual([7777, 190292]);
  });
});

describe("matchClaim", () => {
  it("verifies the Kickstarter backer claim", () => {
    const result = matchClaim("Legendari had 673 Kickstarter backers", claims);
    expect(result.verdict).toBe("verified");
    expect(result.matchedClaim).toContain("673");
    expect(result.evidence[0]?.url).toContain("kickstarter.com");
  });

  it("fails closed on numeric conflicts", () => {
    const result = matchClaim("Legendari had 9000 Kickstarter backers", claims);
    expect(result.verdict).toBe("not_verifiable");
    expect(result.matchedClaim).toBeNull();
  });

  it("marks internal estimates as not_verifiable", () => {
    const result = matchClaim("saving 180 hours per month", claims);
    expect(result.verdict).toBe("not_verifiable");
    expect(result.estimate).toBe(true);
  });

  it("returns partially_verified for sellout timing", () => {
    const result = matchClaim("sold out in 15 minutes", claims);
    expect(result.verdict).toBe("partially_verified");
  });
});

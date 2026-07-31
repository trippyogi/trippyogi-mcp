import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractNumbers, matchClaim, normalizeClaimText } from "../src/claims/match.js";
import type { ClaimRecord } from "../src/types.js";

const claims = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "content", "claims.json"), "utf8")
) as ClaimRecord[];

describe("extractNumbers", () => {
  it("parses comma, currency, and k-shorthand forms", () => {
    expect(extractNumbers("7,777 minted and $190,292 pledged")).toEqual([7777, 190292]);
    expect(extractNumbers("10k+ units shipped")).toEqual([10000]);
  });
});

describe("normalizeClaimText", () => {
  it("expands 10k+ into 10000", () => {
    expect(normalizeClaimText("10k+ units shipped")).toBe("10000 units shipped");
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

  it("rejects fabricated claims with weak stopword overlap", () => {
    const result = matchClaim("Baton was acquired by OpenAI", claims);
    expect(result.verdict).toBe("not_verifiable");
    expect(result.matchedClaim).toBeNull();
    expect(result.evidence).toEqual([]);
  });

  it("rejects compound claims with unsupported extra clauses", () => {
    const result = matchClaim(
      "Legendari was founded by Elon Musk and had 673 Kickstarter backers",
      claims
    );
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

  it("accepts 10k+ units shipped after shorthand normalization", () => {
    const result = matchClaim("10k+ units shipped", claims);
    expect(result.verdict).toBe("partially_verified");
    expect(result.matchedClaim).toContain("10,000");
  });

  it("returns not_verifiable for empty claims", () => {
    const result = matchClaim("", claims);
    expect(result.verdict).toBe("not_verifiable");
    expect(result.matchedClaim).toBeNull();
  });

  it("returns not_verifiable for nonsense without attaching receipts", () => {
    const result = matchClaim("purple elephant quantum flute", claims);
    expect(result.verdict).toBe("not_verifiable");
    expect(result.matchedClaim).toBeNull();
    expect(result.evidence).toEqual([]);
  });
});

import type { ClaimRecord, VerifyClaimResult } from "../types.js";

const NUMBER_RE = /\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$?\d+(?:\.\d+)?/g;

export function extractNumbers(input: string): number[] {
  const matches = input.match(NUMBER_RE) ?? [];
  const values: number[] = [];
  for (const match of matches) {
    const value = Number(match.replace(/[$,]/g, ""));
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

export function tokenize(input: string): Set<string> {
  return new Set(
    input
      .toLowerCase()
      .replace(/[^a-z0-9\s+]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function claimNumbers(claim: ClaimRecord): number[] {
  return claim.numbers ?? extractNumbers([claim.text, ...(claim.aliases ?? [])].join(" "));
}

function numbersConflict(queryNums: number[], claimNums: number[]): boolean {
  if (queryNums.length === 0 || claimNums.length === 0) return false;
  return queryNums.some((query) => !claimNums.includes(query));
}

function scoreClaim(query: string, claim: ClaimRecord): number {
  const queryNums = extractNumbers(query);
  const claimNums = claimNumbers(claim);
  if (numbersConflict(queryNums, claimNums)) return Number.NEGATIVE_INFINITY;

  const corpus = tokenize([claim.text, ...(claim.aliases ?? [])].join(" "));
  const queryTokens = tokenize(query);
  let overlap = 0;
  for (const token of queryTokens) {
    if (corpus.has(token)) overlap += 1;
  }

  const numBoost =
    queryNums.length > 0 && queryNums.every((value) => claimNums.includes(value)) ? 5 : 0;

  return overlap + numBoost;
}

export function matchClaim(query: string, claims: ClaimRecord[]): VerifyClaimResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      verdict: "not_verifiable",
      claim: query,
      matchedClaim: null,
      supported: null,
      unsupported: "Empty claim.",
      estimate: false,
      evidence: []
    };
  }

  const scored = claims
    .map((claim) => ({ claim, score: scoreClaim(trimmed, claim) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) {
    return {
      verdict: "not_verifiable",
      claim: trimmed,
      matchedClaim: null,
      supported: null,
      unsupported: "No matching public claim/receipt in the corpus (or numeric conflict).",
      estimate: false,
      evidence: []
    };
  }

  return {
    verdict: best.claim.verdict,
    claim: trimmed,
    matchedClaim: best.claim.text,
    supported: best.claim.supported,
    unsupported: best.claim.unsupported,
    estimate: best.claim.estimate,
    evidence: best.claim.evidence
  };
}

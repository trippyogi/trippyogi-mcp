import type { ClaimRecord, PublicClaimStatus, VerifyClaimResult } from "../types.js";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "out",
  "over",
  "per",
  "the",
  "to",
  "under",
  "was",
  "were",
  "who",
  "with"
]);

/**
 * Parse numbers once, preferring longer/more-specific forms so "7,777"
 * does not also emit 7 and 777.
 */
export function extractNumbers(input: string): number[] {
  const values: number[] = [];
  const pattern = /\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?[kKmMbB]\+?(?![a-zA-Z])|\$?\d+(?:\.\d+)?\+?/g;
  const matches = input.match(pattern) ?? [];

  for (const match of matches) {
    const cleaned = match.replace(/[$,\s]/g, "");
    const plus = cleaned.endsWith("+");
    const raw = plus ? cleaned.slice(0, -1) : cleaned;
    const suffix = raw.slice(-1).toLowerCase();
    let value: number;
    if (suffix === "k") value = Number(raw.slice(0, -1)) * 1_000;
    else if (suffix === "m") value = Number(raw.slice(0, -1)) * 1_000_000;
    else if (suffix === "b") value = Number(raw.slice(0, -1)) * 1_000_000_000;
    else value = Number(raw);
    if (Number.isFinite(value)) values.push(value);
  }

  return [...new Set(values)];
}

export function normalizeClaimText(input: string): string {
  return input
    .toLowerCase()
    .replace(/(\d+(?:\.\d+)?)[kK]\+?(?![a-z])/g, (_, n: string) => String(Number(n) * 1_000))
    .replace(/(\d+(?:\.\d+)?)[mM]\+?(?![a-z])/g, (_, n: string) => String(Number(n) * 1_000_000))
    .replace(/(\d+)\+/g, "$1")
    .replace(/\$(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g, (_, n: string) => n.replace(/,/g, ""))
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): Set<string> {
  return new Set(
    normalizeClaimText(input)
      .split(/\s+/)
      .filter((token) => token.length > 0)
      .filter((token) => !STOPWORDS.has(token))
      .filter((token) => token.length > 2 || /^\d+$/.test(token))
  );
}

function claimNumbers(claim: ClaimRecord): number[] {
  return extractNumbers([claim.claim, ...(claim.aliases ?? [])].join(" "));
}

function numbersConflict(queryNums: number[], claimNums: number[]): boolean {
  if (queryNums.length === 0 || claimNums.length === 0) return false;
  return queryNums.some((query) => !claimNums.includes(query));
}

function candidates(claim: ClaimRecord): string[] {
  return [claim.claim, ...(claim.aliases ?? [])];
}

function exactNormalizedMatch(query: string, claim: ClaimRecord): boolean {
  const normalizedQuery = normalizeClaimText(query);
  return candidates(claim).some((candidate) => normalizeClaimText(candidate) === normalizedQuery);
}

/**
 * Match when every significant query token appears in a candidate string.
 * Extra query terms (e.g. "acquired by OpenAI") fail closed.
 */
function subsetCoverageMatch(query: string, claim: ClaimRecord): boolean {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return false;
  if (numbersConflict(extractNumbers(query), claimNumbers(claim))) return false;

  for (const candidate of candidates(claim)) {
    const candidateTokens = tokenize(candidate);
    if (candidateTokens.size === 0) continue;
    if (![...queryTokens].every((token) => candidateTokens.has(token))) continue;

    const hasNumber = [...queryTokens].some((token) => /^\d+$/.test(token));
    if (queryTokens.size >= 2 || hasNumber) return true;
  }

  return false;
}

function notVerifiable(claim: string, scope: string): VerifyClaimResult {
  return {
    status: "not_verifiable",
    claim,
    matchedClaim: null,
    receipts: [],
    receipt_type: "none",
    scope,
    notes: null
  };
}

export function matchClaim(query: string, claims: ClaimRecord[]): VerifyClaimResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return notVerifiable(query, "Empty claim.");
  }

  const publicClaims = claims.filter(
    (claim): claim is ClaimRecord & { status: PublicClaimStatus } => claim.status !== "retired"
  );

  for (const claim of publicClaims) {
    if (!exactNormalizedMatch(trimmed, claim)) continue;
    if (numbersConflict(extractNumbers(trimmed), claimNumbers(claim))) continue;
    return {
      status: claim.status,
      claim: trimmed,
      matchedClaim: claim.claim,
      receipts: claim.receipts,
      receipt_type: claim.receipt_type,
      scope: claim.scope ?? null,
      notes: claim.notes ?? null
    };
  }

  for (const claim of publicClaims) {
    if (!subsetCoverageMatch(trimmed, claim)) continue;
    return {
      status: claim.status,
      claim: trimmed,
      matchedClaim: claim.claim,
      receipts: claim.receipts,
      receipt_type: claim.receipt_type,
      scope: claim.scope ?? null,
      notes: claim.notes ?? null
    };
  }

  return notVerifiable(
    trimmed,
    "No matching public claim/receipt in the corpus (or unsupported extra terms / numeric conflict)."
  );
}

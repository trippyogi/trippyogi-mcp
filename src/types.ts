export type EvidenceKind = "independent" | "primary" | "self";

export interface Evidence {
  label: string;
  url: string;
  kind: EvidenceKind;
}

export type Verdict = "verified" | "partially_verified" | "not_verifiable";

export interface ClaimRecord {
  id: string;
  text: string;
  aliases?: string[];
  verdict: Verdict;
  supported: string | null;
  unsupported: string | null;
  estimate: boolean;
  numbers?: number[];
  evidence: Evidence[];
}

export interface Project {
  id: string;
  name: string;
  status: string;
  years: string;
  summary: string;
  outcome: string;
  problem?: string;
  sourceUrl: string | null;
  packageUrl: string | null;
  liveUrl: string | null;
  programmingLanguage?: string[];
  receiptUrls: string[];
}

export interface Experience {
  id: string;
  org: string;
  role: string;
  start: string;
  end: string | null;
  summary: string;
  highlights: string[];
}

export interface Profile {
  person: {
    name: string;
    brand: string;
    jobTitle: string;
    headline: string;
    summary: string;
    location: string;
    url: string;
    email: string;
    alumniOf?: {
      name: string;
      url: string;
      degree: string;
    };
    sameAs: string[];
    knowsAbout: string[];
  };
  projects: Project[];
  experience: Experience[];
  availability: {
    seeking: string;
    bestFit: string[];
    workModes: string[];
    contact: {
      email: string;
      linkedin: string;
      github: string;
      site: string;
      resume: string;
      mcp?: string;
    };
  };
  pages?: Record<string, { path: string; title: string; summary: string }>;
}

export interface VerifyClaimResult {
  verdict: Verdict;
  claim: string;
  matchedClaim: string | null;
  supported: string | null;
  unsupported: string | null;
  estimate: boolean;
  evidence: Evidence[];
}

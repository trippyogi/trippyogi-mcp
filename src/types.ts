export type ClaimStatus = "verified" | "partially_verified" | "not_verifiable" | "retired";
export type PublicClaimStatus = Exclude<ClaimStatus, "retired">;
export type ReceiptType = "external" | "self_hosted" | "none";

export interface ClaimRecord {
  id: string;
  claim: string;
  aliases?: string[];
  status: ClaimStatus;
  receipts: string[];
  receipt_type: ReceiptType;
  scope?: string;
  notes?: string;
  superseded_by?: string;
  verified_at?: string;
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
  status: PublicClaimStatus;
  claim: string;
  matchedClaim: string | null;
  receipts: string[];
  receipt_type: ReceiptType;
  scope: string | null;
  notes: string | null;
}

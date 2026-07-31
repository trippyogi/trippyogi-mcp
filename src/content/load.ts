import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ClaimRecord, Profile } from "../types.js";

const here = dirname(fileURLToPath(import.meta.url));

function contentPath(name: string): string {
  return join(here, "..", "..", "content", name);
}

export function loadProfile(): Profile {
  return JSON.parse(readFileSync(contentPath("profile.json"), "utf8")) as Profile;
}

export function loadClaims(): ClaimRecord[] {
  return JSON.parse(readFileSync(contentPath("claims.json"), "utf8")) as ClaimRecord[];
}

import profileJson from "../../content/profile.json" with { type: "json" };
import claimsJson from "../../content/claims.json" with { type: "json" };
import type { ClaimRecord, Profile } from "../types.js";

export function loadProfile(): Profile {
  return profileJson as Profile;
}

export function loadClaims(): ClaimRecord[] {
  return claimsJson as ClaimRecord[];
}

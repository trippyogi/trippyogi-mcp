export interface AppConfig {
  port: number;
  allowedHosts: string[];
  trustProxy: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  publicBaseUrl: string;
  serviceVersion: string;
}

function csv(value: string | undefined, fallback: string[]): string[] {
  return (value ? value.split(",") : fallback)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function asPositiveInt(value: string | undefined, fallback: number, name: string): number {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0 || !Number.isInteger(number)) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: asPositiveInt(env.PORT, 3000, "PORT"),
    allowedHosts: csv(env.ALLOWED_HOSTS, ["localhost", "127.0.0.1"]),
    trustProxy: (env.TRUST_PROXY ?? "0") === "1" || (env.TRUST_PROXY ?? "").toLowerCase() === "true",
    rateLimitWindowMs: asPositiveInt(env.RATE_LIMIT_WINDOW_MS, 60_000, "RATE_LIMIT_WINDOW_MS"),
    rateLimitMax: asPositiveInt(env.RATE_LIMIT_MAX, 60, "RATE_LIMIT_MAX"),
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    serviceVersion: "0.1.0"
  };
}

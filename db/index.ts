import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type RuntimeEnv = { DB?: D1Database; ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string; SESSION_SECRET?: string };

export function getRuntimeEnv(): RuntimeEnv {
  return (globalThis as typeof globalThis & { __ENOTEL_ENV__?: RuntimeEnv }).__ENOTEL_ENV__ ?? {};
}

export function getDb() {
  const { DB } = getRuntimeEnv();
  if (!DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(DB, { schema });
}

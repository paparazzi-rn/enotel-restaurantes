import { getRuntimeEnv } from "../../db";

const COOKIE = "enotel_admin_session";
const encoder = new TextEncoder();

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string) {
  const secret = getRuntimeEnv().SESSION_SECRET || "enotel-session-fallback";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function createSessionCookie(email: string) {
  const payload = `${email}|${Date.now() + 8 * 60 * 60 * 1000}`;
  return `${COOKIE}=${encodeURIComponent(`${payload}|${await hmac(payload)}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function isAdmin(request: Request) {
  const raw = request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))?.[1];
  if (!raw) return false;
  const parts = decodeURIComponent(raw).split("|");
  if (parts.length !== 3) return false;
  const [email, expires, signature] = parts;
  if (Number(expires) <= Date.now()) return false;
  const env = getRuntimeEnv();
  return email === env.ADMIN_EMAIL && signature === (await hmac(`${email}|${expires}`));
}

export function credentialsMatch(email: string, password: string) {
  const env = getRuntimeEnv();
  return Boolean(env.ADMIN_EMAIL && env.ADMIN_PASSWORD && email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD);
}

import { credentialsMatch, createSessionCookie } from "../../../lib/admin-auth";
import { json, readJson } from "../../../lib/api-utils";

export async function POST(request: Request) {
  const body = await readJson<{ email?: string; password?: string }>(request);
  if (!body || !credentialsMatch(body.email?.trim() || "", body.password || "")) {
    return json({ error: "E-mail ou senha inválidos." }, 401);
  }
  return json({ ok: true }, 200, { "set-cookie": await createSessionCookie(body.email!.trim()) });
}

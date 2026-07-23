import { clearSessionCookie } from "../../../lib/admin-auth";
import { json } from "../../../lib/api-utils";

export async function POST() {
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}

import { isAdmin } from "../../../lib/admin-auth";
import { json } from "../../../lib/api-utils";

export async function GET(request: Request) {
  return json({ authenticated: await isAdmin(request) });
}

import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { reservations } from "../../../../../db/schema";
import { isAdmin } from "../../../../lib/admin-auth";
import { json, readJson } from "../../../../lib/api-utils";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(request))) return json({ error: "Não autorizado." }, 401);
  const body = await readJson<{ status?: string }>(request);
  if (!body?.status || !["confirmed", "seated", "completed", "cancelled"].includes(body.status)) {
    return json({ error: "Status inválido." }, 400);
  }
  const { id } = await context.params;
  await getDb().update(reservations).set({ status: body.status, updatedAt: new Date().toISOString() }).where(eq(reservations.id, Number(id)));
  return json({ ok: true });
}

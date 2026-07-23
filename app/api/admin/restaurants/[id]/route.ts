import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { restaurants } from "../../../../../db/schema";
import { isAdmin } from "../../../../lib/admin-auth";
import { json, readJson } from "../../../../lib/api-utils";
import type { RestaurantPayload } from "../route";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(request))) return json({ error: "Não autorizado." }, 401);
  const { id } = await context.params;
  const body = await readJson<RestaurantPayload>(request);
  if (!body?.namePt?.trim() || !body.imageUrl?.trim()) return json({ error: "Informe nome e imagem." }, 400);
  const [updated] = await getDb().update(restaurants).set({
    namePt: body.namePt.trim(), nameEn: body.nameEn?.trim() || body.namePt.trim(), nameEs: body.nameEs?.trim() || body.namePt.trim(),
    descriptionPt: body.descriptionPt?.trim() || "", descriptionEn: body.descriptionEn?.trim() || body.descriptionPt?.trim() || "",
    descriptionEs: body.descriptionEs?.trim() || body.descriptionPt?.trim() || "", imageUrl: body.imageUrl.trim(),
    bookingRequired: body.bookingRequired !== false, openingHours: body.openingHours?.trim() || "19:00 — 22:00",
    capacity: Math.max(1, Math.min(999, Number(body.capacity) || 60)), active: body.active !== false,
    menu1Label: body.menu1Label?.trim() || null, menu1Url: body.menu1Url?.trim() || null,
    menu2Label: body.menu2Label?.trim() || null, menu2Url: body.menu2Url?.trim() || null,
    updatedAt: new Date().toISOString(),
  }).where(eq(restaurants.id, Number(id))).returning();
  return updated ? json(updated) : json({ error: "Restaurante não encontrado." }, 404);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(request))) return json({ error: "Não autorizado." }, 401);
  const { id } = await context.params;
  await getDb().update(restaurants).set({ active: false, updatedAt: new Date().toISOString() }).where(eq(restaurants.id, Number(id)));
  return json({ ok: true });
}

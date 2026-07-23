import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { reservations, restaurants } from "../../../db/schema";
import { json, readJson } from "../../lib/api-utils";

type Payload = {
  restaurantId?: number; guestName?: string; roomNumber?: string; whatsapp?: string;
  reservationDate?: string; reservationTime?: string; guestCount?: number; language?: string; notes?: string;
};

export async function POST(request: Request) {
  const body = await readJson<Payload>(request);
  const count = Number(body?.guestCount);
  if (!body?.restaurantId || !body.guestName?.trim() || !body.roomNumber?.trim() || !body.whatsapp?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.reservationDate || "") || !/^\d{2}:\d{2}$/.test(body.reservationTime || "") ||
      !Number.isInteger(count) || count < 1 || count > 12) {
    return json({ error: "Preencha todos os campos obrigatórios." }, 400);
  }
  const db = getDb();
  const restaurant = await db.select().from(restaurants).where(and(eq(restaurants.id, body.restaurantId), eq(restaurants.active, true))).get();
  if (!restaurant) return json({ error: "Restaurante indisponível." }, 404);
  const used = await db.select({ total: sql<number>`coalesce(sum(${reservations.guestCount}), 0)` }).from(reservations)
    .where(and(eq(reservations.restaurantId, body.restaurantId), eq(reservations.reservationDate, body.reservationDate!), eq(reservations.reservationTime, body.reservationTime!), sql`${reservations.status} != 'cancelled'`)).get();
  if ((Number(used?.total) || 0) + count > restaurant.capacity) return json({ error: "Este horário não possui disponibilidade para o número de pessoas informado." }, 409);
  const now = new Date().toISOString();
  const code = `ENO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db.insert(reservations).values({
    code, restaurantId: body.restaurantId, guestName: body.guestName.trim(), roomNumber: body.roomNumber.trim(),
    whatsapp: body.whatsapp.trim(), reservationDate: body.reservationDate!, reservationTime: body.reservationTime!,
    guestCount: count, language: ["pt", "en", "es"].includes(body.language || "") ? body.language! : "pt",
    notes: body.notes?.trim() || null, status: "confirmed", createdAt: now, updatedAt: now,
  });
  return json({ ok: true, code }, 201);
}

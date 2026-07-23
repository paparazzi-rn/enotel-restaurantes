import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "../../../../db";
import { reservations, restaurants } from "../../../../db/schema";
import { isAdmin } from "../../../lib/admin-auth";
import { json } from "../../../lib/api-utils";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return json({ error: "Não autorizado." }, 401);
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const restaurantId = Number(url.searchParams.get("restaurantId"));
  const status = url.searchParams.get("status");
  const filters = [];
  if (from) filters.push(gte(reservations.reservationDate, from));
  if (to) filters.push(lte(reservations.reservationDate, to));
  if (restaurantId) filters.push(eq(reservations.restaurantId, restaurantId));
  if (status && status !== "all") filters.push(eq(reservations.status, status));
  const where = filters.length ? and(...filters) : undefined;
  const rows = await getDb().select({
    id: reservations.id, code: reservations.code, guestName: reservations.guestName, roomNumber: reservations.roomNumber,
    whatsapp: reservations.whatsapp, reservationDate: reservations.reservationDate, reservationTime: reservations.reservationTime,
    guestCount: reservations.guestCount, language: reservations.language, notes: reservations.notes, status: reservations.status,
    restaurantId: reservations.restaurantId, restaurantName: restaurants.namePt, createdAt: reservations.createdAt,
  }).from(reservations).innerJoin(restaurants, eq(reservations.restaurantId, restaurants.id)).where(where)
    .orderBy(asc(reservations.reservationDate), asc(reservations.reservationTime));
  const confirmed = rows.filter((item) => item.status !== "cancelled");
  return json({
    reservations: rows,
    summary: {
      total: rows.length,
      guests: confirmed.reduce((sum, item) => sum + item.guestCount, 0),
      cancelled: rows.filter((item) => item.status === "cancelled").length,
    },
  });
}

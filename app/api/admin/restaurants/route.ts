import { asc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { restaurants } from "../../../../db/schema";
import { isAdmin } from "../../../lib/admin-auth";
import { json, readJson, slugify } from "../../../lib/api-utils";

export type RestaurantPayload = {
  namePt?: string; nameEn?: string; nameEs?: string;
  descriptionPt?: string; descriptionEn?: string; descriptionEs?: string;
  imageUrl?: string; bookingRequired?: boolean; openingHours?: string; capacity?: number; active?: boolean;
  menu1Label?: string; menu1Url?: string; menu2Label?: string; menu2Url?: string;
};

export function normalizeRestaurant(body: RestaurantPayload) {
  const namePt = body.namePt?.trim() || "";
  if (!namePt || !body.imageUrl?.trim()) return null;
  const now = new Date().toISOString();
  return {
    slug: `${slugify(namePt)}-${Date.now().toString(36)}`,
    namePt,
    nameEn: body.nameEn?.trim() || namePt,
    nameEs: body.nameEs?.trim() || namePt,
    descriptionPt: body.descriptionPt?.trim() || "",
    descriptionEn: body.descriptionEn?.trim() || body.descriptionPt?.trim() || "",
    descriptionEs: body.descriptionEs?.trim() || body.descriptionPt?.trim() || "",
    imageUrl: body.imageUrl.trim(),
    bookingRequired: body.bookingRequired !== false,
    openingHours: body.openingHours?.trim() || "19:00 — 22:00",
    capacity: Math.max(1, Math.min(999, Number(body.capacity) || 60)),
    active: body.active !== false,
    menu1Label: body.menu1Label?.trim() || null,
    menu1Url: body.menu1Url?.trim() || null,
    menu2Label: body.menu2Label?.trim() || null,
    menu2Url: body.menu2Url?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return json({ error: "Não autorizado." }, 401);
  return json(await getDb().select().from(restaurants).orderBy(asc(restaurants.namePt)));
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return json({ error: "Não autorizado." }, 401);
  const body = await readJson<RestaurantPayload>(request);
  const values = body && normalizeRestaurant(body);
  if (!values) return json({ error: "Informe nome e imagem." }, 400);
  const [created] = await getDb().insert(restaurants).values(values).returning();
  return json(created, 201);
}

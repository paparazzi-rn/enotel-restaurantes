import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { restaurants } from "../../../db/schema";
import { json } from "../../lib/api-utils";

export async function GET() {
  const rows = await getDb().select().from(restaurants).where(eq(restaurants.active, true)).orderBy(asc(restaurants.namePt));
  return json(rows);
}

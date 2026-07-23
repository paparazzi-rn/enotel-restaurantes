import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const restaurants = sqliteTable("restaurants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  descriptionPt: text("description_pt").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionEs: text("description_es").notNull(),
  imageUrl: text("image_url").notNull(),
  bookingRequired: integer("booking_required", { mode: "boolean" }).notNull().default(true),
  openingHours: text("opening_hours").notNull().default("19:00 — 22:00"),
  capacity: integer("capacity").notNull().default(60),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  menu1Label: text("menu_1_label"),
  menu1Url: text("menu_1_url"),
  menu2Label: text("menu_2_label"),
  menu2Url: text("menu_2_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reservations = sqliteTable(
  "reservations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    guestName: text("guest_name").notNull(),
    roomNumber: text("room_number").notNull(),
    whatsapp: text("whatsapp").notNull(),
    reservationDate: text("reservation_date").notNull(),
    reservationTime: text("reservation_time").notNull(),
    guestCount: integer("guest_count").notNull(),
    language: text("language").notNull().default("pt"),
    notes: text("notes"),
    status: text("status").notNull().default("confirmed"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("reservations_date_idx").on(table.reservationDate),
    index("reservations_restaurant_date_idx").on(table.restaurantId, table.reservationDate),
    index("reservations_status_idx").on(table.status),
  ],
);

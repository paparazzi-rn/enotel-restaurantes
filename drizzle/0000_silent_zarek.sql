CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`restaurant_id` integer NOT NULL,
	`guest_name` text NOT NULL,
	`room_number` text NOT NULL,
	`whatsapp` text NOT NULL,
	`reservation_date` text NOT NULL,
	`reservation_time` text NOT NULL,
	`guest_count` integer NOT NULL,
	`language` text DEFAULT 'pt' NOT NULL,
	`notes` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_code_unique` ON `reservations` (`code`);--> statement-breakpoint
CREATE INDEX `reservations_date_idx` ON `reservations` (`reservation_date`);--> statement-breakpoint
CREATE INDEX `reservations_restaurant_date_idx` ON `reservations` (`restaurant_id`,`reservation_date`);--> statement-breakpoint
CREATE INDEX `reservations_status_idx` ON `reservations` (`status`);--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_pt` text NOT NULL,
	`name_en` text NOT NULL,
	`name_es` text NOT NULL,
	`description_pt` text NOT NULL,
	`description_en` text NOT NULL,
	`description_es` text NOT NULL,
	`image_url` text NOT NULL,
	`booking_required` integer DEFAULT true NOT NULL,
	`opening_hours` text DEFAULT '19:00 — 22:00' NOT NULL,
	`capacity` integer DEFAULT 60 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`menu_1_label` text,
	`menu_1_url` text,
	`menu_2_label` text,
	`menu_2_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_slug_unique` ON `restaurants` (`slug`);--> statement-breakpoint
INSERT INTO `restaurants` (`slug`,`name_pt`,`name_en`,`name_es`,`description_pt`,`description_en`,`description_es`,`image_url`,`booking_required`,`opening_hours`,`capacity`,`active`,`created_at`,`updated_at`) VALUES
('jantar-frances','Jantar Francês','French Dinner','Cena Francesa','Clássicos franceses em uma noite especial','French classics for a special evening','Clásicos franceses para una noche especial','/restaurant-frances.jpg',1,'19:00 — 22:00',60,1,datetime('now'),datetime('now')),
('sabores-mediterraneos','Sabores Mediterrâneos','Mediterranean Flavors','Sabores Mediterráneos','Ingredientes frescos e cozinha solar','Fresh ingredients and sun-kissed cuisine','Ingredientes frescos y cocina luminosa','/restaurant-mediterraneo.jpg',1,'19:00 — 22:00',60,1,datetime('now'),datetime('now')),
('grill-petiscos','Grill & Petiscos','Grill & Bites','Parrilla y Aperitivos','Sabores descontraídos à beira da piscina','Relaxed flavors by the pool','Sabores relajados junto a la piscina','/restaurant-grill.jpg',0,'12:00 — 18:00',120,1,datetime('now'),datetime('now'));

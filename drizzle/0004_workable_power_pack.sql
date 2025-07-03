CREATE TABLE "cart_products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cart_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_name" varchar(30) NOT NULL,
	"card_id" integer,
	"pack_id" integer,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "cart_products_cardId_unique" UNIQUE("card_id"),
	CONSTRAINT "cart_products_packId_unique" UNIQUE("pack_id"),
	CONSTRAINT "cart_product_check" CHECK ((
				("cart_products"."card_id" is not null and "cart_products"."pack_id" is null)
				or
				("cart_products"."pack_id" is not null and "cart_products"."card_id" is null)
			))
);
--> statement-breakpoint
ALTER TABLE "inventories" ADD COLUMN "amount" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_products" ADD CONSTRAINT "cart_products_user_name_users_name_fk" FOREIGN KEY ("user_name") REFERENCES "public"."users"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_products" ADD CONSTRAINT "cart_products_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_products" ADD CONSTRAINT "cart_products_pack_id_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id") ON DELETE no action ON UPDATE no action;
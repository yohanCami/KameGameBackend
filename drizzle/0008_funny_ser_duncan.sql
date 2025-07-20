ALTER TABLE "pack_cards" DROP CONSTRAINT "pack_cards_pack_id_cards_id_fk";
--> statement-breakpoint
ALTER TABLE "pack_cards" ADD CONSTRAINT "pack_cards_pack_id_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id") ON DELETE no action ON UPDATE no action;
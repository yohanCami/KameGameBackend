ALTER TABLE "cart_products" DROP CONSTRAINT "cart_products_cardId_unique";--> statement-breakpoint
ALTER TABLE "cart_products" DROP CONSTRAINT "cart_products_packId_unique";--> statement-breakpoint
ALTER TABLE "cart_products" ADD CONSTRAINT "unique_cart_product" UNIQUE NULLS NOT DISTINCT("user_name","card_id","pack_id");
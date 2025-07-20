ALTER TABLE "packs" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "packs" ADD COLUMN "description" varchar(100);
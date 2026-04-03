ALTER TABLE "users" ADD COLUMN "refresh_token" varchar(500);--> statement-breakpoint
DROP TYPE "public"."notification_status";
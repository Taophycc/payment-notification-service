CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_payment_id_transactions_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
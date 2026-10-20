CREATE TYPE "public"."channel_type" AS ENUM('telegram', 'discord');--> statement-breakpoint
CREATE TYPE "public"."check_error_type" AS ENUM('timeout', 'server_error', 'client_error', 'connection', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."monitor_status" AS ENUM('unknown', 'up', 'down');--> statement-breakpoint
CREATE TABLE "checks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"is_up" boolean NOT NULL,
	"error_type" "check_error_type",
	"error_message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_channels" (
	"monitor_id" integer NOT NULL,
	"channel_id" integer NOT NULL,
	"message" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "monitor_channels_monitor_id_channel_id_pk" PRIMARY KEY("monitor_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE "monitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"interval_seconds" integer DEFAULT 60 NOT NULL,
	"timeout_ms" integer DEFAULT 5000 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failure_threshold" integer DEFAULT 1 NOT NULL,
	"status" "monitor_status" DEFAULT 'unknown' NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_checked_at" timestamp with time zone,
	"last_response_time_ms" integer,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "channel_type" NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checks" ADD CONSTRAINT "checks_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_channels" ADD CONSTRAINT "monitor_channels_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_channels" ADD CONSTRAINT "monitor_channels_channel_id_notification_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."notification_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitors" ADD CONSTRAINT "monitors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checks_monitor_time" ON "checks" USING btree ("monitor_id","checked_at");--> statement-breakpoint
CREATE INDEX "idx_checks_monitor_cursor" ON "checks" USING btree ("monitor_id","id");--> statement-breakpoint
CREATE INDEX "idx_checks_checked_at" ON "checks" USING btree ("checked_at");
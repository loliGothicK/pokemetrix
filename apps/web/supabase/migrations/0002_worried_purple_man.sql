CREATE TABLE "shared_teams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_by" uuid,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_teams_snapshot_is_object" CHECK (jsonb_typeof("shared_teams"."snapshot") = 'object')
);
--> statement-breakpoint
ALTER TABLE "box_pokemon" ADD COLUMN "in_box" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_teams" ADD CONSTRAINT "shared_teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
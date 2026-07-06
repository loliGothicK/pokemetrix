ALTER TABLE "battle_records" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "battle_records" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "battle_records" ADD CONSTRAINT "battle_records_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
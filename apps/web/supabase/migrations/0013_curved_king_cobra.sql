CREATE INDEX "battle_records_user_season_played_idx" ON "battle_records" USING btree ("user_id","season_id","played_at");--> statement-breakpoint
CREATE INDEX "teams_user_id_idx" ON "teams" USING btree ("user_id");

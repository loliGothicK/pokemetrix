CREATE TABLE "box_pokemon" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "box_pokemon_data_is_object" CHECK (jsonb_typeof("box_pokemon"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" uuid NOT NULL,
	"slot_index" smallint NOT NULL,
	"box_pokemon_id" uuid NOT NULL,
	CONSTRAINT "team_members_slot_range" CHECK ("team_members"."slot_index" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_len" CHECK (char_length("teams"."name") between 1 and 100)
);
--> statement-breakpoint
ALTER TABLE "box_pokemon" ADD CONSTRAINT "box_pokemon_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_box_pokemon_id_box_pokemon_id_fk" FOREIGN KEY ("box_pokemon_id") REFERENCES "public"."box_pokemon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
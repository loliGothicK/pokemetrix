CREATE TABLE "battle_record_opponents" (
	"battle_record_id" uuid NOT NULL,
	"slot_index" smallint NOT NULL,
	"pokemon_slug" text NOT NULL,
	"item_slug" text,
	"ability_slug" text,
	"moves" text[],
	"selection_role" text,
	"notes" text,
	CONSTRAINT "battle_record_opponents_battle_record_id_slot_index_pk" PRIMARY KEY("battle_record_id","slot_index"),
	CONSTRAINT "battle_record_opponents_slot_range" CHECK ("battle_record_opponents"."slot_index" between 0 and 5),
	CONSTRAINT "battle_record_opponents_selection_role_valid" CHECK ("battle_record_opponents"."selection_role" in ('lead', 'back'))
);
--> statement-breakpoint
CREATE TABLE "battle_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"result" text NOT NULL,
	"my_team" jsonb NOT NULL,
	"my_selection" smallint[],
	"first_or_second" text,
	"notes" text,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "battle_records_result_valid" CHECK ("battle_records"."result" in ('win', 'loss', 'draw')),
	CONSTRAINT "battle_records_my_team_is_array" CHECK (jsonb_typeof("battle_records"."my_team") = 'array'),
	CONSTRAINT "battle_records_first_or_second_valid" CHECK ("battle_records"."first_or_second" in ('first', 'second'))
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"format" text NOT NULL,
	"rule_mark" text,
	"started_at" date,
	"ended_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_name_len" CHECK (char_length("seasons"."name") between 1 and 100),
	CONSTRAINT "seasons_format_valid" CHECK ("seasons"."format" in ('singles', 'doubles'))
);
--> statement-breakpoint
ALTER TABLE "battle_record_opponents" ADD CONSTRAINT "battle_record_opponents_battle_record_id_battle_records_id_fk" FOREIGN KEY ("battle_record_id") REFERENCES "public"."battle_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_records" ADD CONSTRAINT "battle_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_records" ADD CONSTRAINT "battle_records_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
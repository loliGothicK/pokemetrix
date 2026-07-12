CREATE TABLE "dashboards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"layout" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboards_name_len" CHECK (char_length("dashboards"."name") between 1 and 100),
	CONSTRAINT "dashboards_layout_is_array" CHECK (jsonb_typeof("dashboards"."layout") = 'array')
);
--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
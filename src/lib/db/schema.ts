import { pgTable, uuid, text, jsonb, smallint, boolean, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { ulidType } from "./ulid-type";
import type { TrainedPokemon } from "@/store/team/team";

/** チームシェアの公開スナップショット型 */
export interface SharedTeamSnapshot {
  teamName: string;
  members: (TrainedPokemon | null)[];
}

export const boxPokemon = pgTable(
  "box_pokemon",
  {
    id: ulidType("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    data: jsonb("data").notNull(),
    /** true = BOXに明示的に保存されたもの。false = チームスロット専用（BOXには表示しない） */
    inBox: boolean("in_box").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("box_pokemon_data_is_object", sql`jsonb_typeof(${t.data}) = 'object'`)],
);

export const teams = pgTable(
  "teams",
  {
    id: ulidType("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("teams_name_len", sql`char_length(${t.name}) between 1 and 100`)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: ulidType("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    slotIndex: smallint("slot_index").notNull(),
    boxPokemonId: ulidType("box_pokemon_id")
      .notNull()
      .references(() => boxPokemon.id, { onDelete: "cascade" }),
  },
  (t) => [check("team_members_slot_range", sql`${t.slotIndex} between 0 and 5`)],
);

export const sharedTeams = pgTable(
  "shared_teams",
  {
    id: ulidType("id").primaryKey(),
    /** 作成者 UUID（ゲストシェアは null 可）*/
    createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
    /** チーム名 + members (TrainedPokemon | null)[] のスナップショット */
    snapshot: jsonb("snapshot").notNull().$type<SharedTeamSnapshot>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("shared_teams_snapshot_is_object", sql`jsonb_typeof(${t.snapshot}) = 'object'`)],
);

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import type { TrainedPokemon } from "@/store/team/team";
import { WIDGET_TEMPLATES } from "@/components/client/dashboard/widgetTemplates";

const GIMMICK_TAGS = [
  "trick-room",
  "tailwind",
  "weather-rain",
  "weather-sun",
  "weather-snow",
  "weather-sand",
  "redirection",
  "perish-trap",
];
const ROLE_TAGS = [
  "speed-control",
  "follow-me",
  "fake-out",
  "intimidate",
  "cycle",
  "sleep-control",
  "mega-focused",
  "standard",
];

// Load .env.local manually
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      process.env[key] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
} catch {
  console.log("No .env.local found");
}

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  try {
    // 登録されているユーザーを動的に取得する（DBリセット等でIDが変わる可能性があるため）
    const users =
      await client`SELECT id FROM auth.users WHERE email = 'loligothick@gmail.com' LIMIT 1`;
    if (users.length === 0) {
      console.error(
        "エラー: 'loligothick@gmail.com' のユーザーが見つかりません。先にアプリ画面からサインアップしてください。",
      );
      process.exit(1);
    }
    const userId = users[0].id;
    console.log(`Using userId: ${userId}`);

    // Check if user already has data to avoid duplicating
    const existingSeasons = await db
      .select({ id: schema.seasons.id })
      .from(schema.seasons)
      .where(eq(schema.seasons.userId, userId))
      .limit(1);
    if (existingSeasons.length > 0 && !process.argv.includes("--dry-run")) {
      if (process.argv.includes("--force")) {
        console.log("Force flag detected. Deleting existing user data...");
        await db.delete(schema.seasons).where(eq(schema.seasons.userId, userId));
        await db.delete(schema.teams).where(eq(schema.teams.userId, userId));
        await db.delete(schema.boxPokemon).where(eq(schema.boxPokemon.userId, userId));
        await db.delete(schema.dashboards).where(eq(schema.dashboards.userId, userId));
        await db.delete(schema.battleRecords).where(eq(schema.battleRecords.userId, userId));
      } else {
        console.log("Data already exists for this user. Skipping seed. (Use --force to overwrite)");
        process.exit(0);
      }
    }

    const isDryRun = process.argv.includes("--dry-run");
    if (isDryRun) console.log("--- STARTING DRY RUN ---");

    try {
      await db.transaction(async (tx) => {
        // --- Season 1 (Singles) ---
        const singlesSeasonId = ulid();
        await tx.insert(schema.seasons).values({
          id: singlesSeasonId,
          userId,
          name: "Season 1 (Singles)",
          format: "singles",
          ruleMark: "regulation-h",
          startedAt: new Date("2026-07-01").toISOString(),
          endedAt: new Date("2026-07-31").toISOString(),
        });
        console.log(`Created season (singles): ${singlesSeasonId}`);

        // --- Season 2 (Doubles) ---
        const doublesSeasonId = ulid();
        await tx.insert(schema.seasons).values({
          id: doublesSeasonId,
          userId,
          name: "Season 2 (Doubles)",
          format: "doubles",
          ruleMark: "regulation-h",
          startedAt: new Date("2026-08-01").toISOString(),
          endedAt: new Date("2026-08-31").toISOString(),
        });
        console.log(`Created season (doubles): ${doublesSeasonId}`);

        // Create a team
        const teamId = ulid();
        await tx.insert(schema.teams).values({
          id: teamId,
          userId,
          name: "Test Team",
        });
        console.log(`Created team: ${teamId}`);

        const myTeamData = [
          {
            slug: "pikachu",
            item: 213,
            ability: 31,
            moves: [85, 87, 521, 182],
            evs: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 },
          },
          {
            slug: "charizard",
            item: 247,
            ability: 66,
            moves: [53, 403, 416, 182],
            evs: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 },
          },
          {
            slug: "venusaur",
            item: 247,
            ability: 34,
            moves: [188, 202, 414, 182],
            evs: { hp: 32, atk: 0, def: 0, spa: 32, spd: 0, spe: 0 },
          },
          {
            slug: "blastoise",
            item: 211,
            ability: 67,
            moves: [56, 406, 430, 182],
            evs: { hp: 32, atk: 0, def: 0, spa: 32, spd: 0, spe: 0 },
          },
          {
            slug: "gengar",
            item: 247,
            ability: 130,
            moves: [247, 188, 416, 182],
            evs: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 },
          },
          {
            slug: "snorlax",
            item: 211,
            ability: 82,
            moves: [34, 89, 442, 182],
            evs: { hp: 32, atk: 32, def: 0, spa: 0, spd: 0, spe: 0 },
          },
        ] as const;

        const myTeam: TrainedPokemon[] = myTeamData.map((data) => ({
          boxId: ulid(),
          identifier: data.slug,
          slug: data.slug,
          item: data.item,
          ability: data.ability,
          gender: { fixed: false },
          nature: {},
          moves: data.moves as [number, number, number, number],
          evs: data.evs as any,
        }));

        const commonOpponents = [
          "charizard",
          "blastoise",
          "venusaur",
          "pikachu",
          "arcanine",
          "absol",
          "glalie",
          "torterra",
          "infernape",
          "empoleon",
          "luxray",
          "roserade",
          "rampardos",
          "bastiodon",
          "gengar",
        ];

        let currentRating = 1500;

        // Generate 150 records for Singles and 150 for Doubles
        const numRecordsPerSeason = 150;

        for (const format of ["singles", "doubles"]) {
          const seasonId = format === "singles" ? singlesSeasonId : doublesSeasonId;
          for (let i = 0; i < numRecordsPerSeason; i++) {
            const result = Math.random() > 0.45 ? "win" : "loss"; // ~55% win rate
            const recordId = ulid();

            if (result === "win") currentRating += Math.floor(Math.random() * 15) + 10;
            else currentRating -= Math.floor(Math.random() * 15) + 10;

            const playedAt = new Date();
            playedAt.setDate(playedAt.getDate() - Math.floor(Math.random() * 30)); // random within last 30 days

            // Randomize my selection (Singles = 3, Doubles = 4)
            const mySelectionCount = format === "singles" ? 3 : 4;
            const mySel: number[] = [];
            while (mySel.length < mySelectionCount) {
              const r = Math.floor(Math.random() * 6);
              if (!mySel.includes(r)) mySel.push(r);
            }

            // Randomize tags
            const tags: string[] = [];
            if (Math.random() > 0.5)
              tags.push(GIMMICK_TAGS[Math.floor(Math.random() * GIMMICK_TAGS.length)]);
            if (Math.random() > 0.3)
              tags.push(ROLE_TAGS[Math.floor(Math.random() * ROLE_TAGS.length)]);
            if (Math.random() > 0.8) tags.push("カスタムタグ");

            await tx.insert(schema.battleRecords).values({
              id: recordId,
              userId,
              seasonId,
              teamId,
              result,
              myTeam,
              mySelection: mySel,
              rating: currentRating,
              notes: `Seed battle ${i + 1} (${format})`,
              playedAt,
              tags,
            });

            // Random opponent party of 6
            const oppTeam: string[] = [];
            while (oppTeam.length < 6) {
              const r = commonOpponents[Math.floor(Math.random() * commonOpponents.length)];
              if (!oppTeam.includes(r)) oppTeam.push(r);
            }

            // Insert opponents
            await tx.insert(schema.battleRecordOpponents).values(
              oppTeam.map((slug, index) => {
                let role: "lead" | "back" | null = null;
                if (format === "singles") {
                  if (index === 0) role = "lead";
                  else if (index < 3) role = "back";
                } else {
                  if (index < 2) role = "lead";
                  else if (index < 4) role = "back";
                }
                return {
                  battleRecordId: recordId,
                  slotIndex: index,
                  pokemonSlug: slug,
                  selectionRole: role,
                };
              }) as any,
            );
          }
        }

        console.log(`Created ${numRecordsPerSeason * 2} battle records across both formats.`);

        // Create 6 box pokemon and link to team
        const boxPokemonIds = [];
        for (let i = 0; i < 6; i++) {
          const pId = ulid();
          boxPokemonIds.push(pId);
          await tx.insert(schema.boxPokemon).values({
            id: pId,
            userId,
            slug: myTeamData[i].slug,
            inBox: true,
            data: {
              boxId: pId,
              identifier: myTeamData[i].slug,
              slug: myTeamData[i].slug,
              item: myTeamData[i].item,
              ability: myTeamData[i].ability,
              gender: { fixed: false },
              nature: {},
              moves: myTeamData[i].moves as unknown as [number, number, number, number],
              evs: myTeamData[i].evs as any,
            },
          });
        }

        // Create team members
        await tx.insert(schema.teamMembers).values(
          boxPokemonIds.map((boxId, index) => ({
            teamId,
            slotIndex: index,
            boxPokemonId: boxId,
          })),
        );
        console.log(`Created 6 box pokemon and linked to team.`);

        // Create layout with all templates
        const layout = WIDGET_TEMPLATES.map((tmpl, idx) => {
          // Layout in a 3-column grid (12 total width => 4 width per widget)
          const cols = 3;
          const col = idx % cols;
          const row = Math.floor(idx / cols);

          return {
            id: ulid(),
            templateId: tmpl.id,
            title: tmpl.id, // The UI will translate this based on template if left alone, but we set a fallback title
            dataSource: { type: "season" as const, seasonId: null },
            x: col * 4,
            y: row * 4,
            w: 4,
            h: 4,
            query: tmpl.query,
            transformer: tmpl.transformer,
            visualization: tmpl.visualization,
          };
        });

        const dashboardId = ulid();
        await tx.insert(schema.dashboards).values({
          id: dashboardId,
          userId,
          name: "Default Dashboard",
          isDefault: true,
          variables: [
            {
              id: ulid(),
              name: "season",
              label: "Season",
              type: "season",
              defaultSeasonId: singlesSeasonId,
            },
          ],
          layout,
        });
        console.log(`Created default dashboard with ${layout.length} widgets.`);

        if (isDryRun) {
          console.log("Rolling back transaction for dry run...");
          tx.rollback();
        }
      });
      console.log("Seeding complete!");
    } catch (err: any) {
      if (err instanceof Error && err.message.includes("Rollback")) {
        console.log("--- DRY RUN COMPLETE: Transaction rolled back successfully ---");
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    process.exit(0);
  }
}

seed();

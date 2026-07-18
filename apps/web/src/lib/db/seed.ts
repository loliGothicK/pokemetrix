import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import type { TrainedPokemon } from "../../store/team/team";

// Load .env.local manually
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
} catch (e) {
  console.log("No .env.local found");
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  try {
    // Get the first user from auth.users (Supabase)
    const users = await client`SELECT id FROM auth.users LIMIT 1`;
    
    if (users.length === 0) {
      console.log("No users found in auth.users. Please create an account in local Supabase first.");
      process.exit(1);
    }
    const userId = users[0].id;
    console.log(`Using userId: ${userId}`);

    // Check if user already has data to avoid duplicating
    const existingSeasons = await db.select().from(schema.seasons).where(eq(schema.seasons.userId, userId)).limit(1);
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

        // Create a season
        const seasonId = ulid();
        await tx.insert(schema.seasons).values({
          id: seasonId,
          userId,
          name: "Season 1",
          format: "singles",
          ruleMark: "regulation-h",
          startedAt: new Date("2026-07-01").toISOString(),
          endedAt: new Date("2026-07-31").toISOString(),
        });
        console.log(`Created season: ${seasonId}`);

        // Create a team (optional but good for myTeam snapshot)
        const teamId = ulid();
        await tx.insert(schema.teams).values({
          id: teamId,
          userId,
          name: "Test Team",
        });
        console.log(`Created team: ${teamId}`);

    // Create some battle records
    const results: ("win" | "loss" | "draw")[] = [
      "win", "loss", "win", "win", "loss", "loss", "win", "win", "win", "loss",
      "win", "win", "loss", "draw", "win", "loss", "win", "win", "win", "win"
    ];

    const myTeamData = [
      { slug: "pikachu", item: 213, ability: 31, moves: [85, 87, 521, 182], evs: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 } }, // Thunderbolt, Thunder, Volt Switch, Protect
      { slug: "charizard", item: 247, ability: 66, moves: [53, 403, 416, 182], evs: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 } }, // Flamethrower, Air Slash, Focus Blast, Protect
      { slug: "venusaur", item: 247, ability: 34, moves: [188, 202, 414, 182], evs: { hp: 32, atk: 0, def: 0, spa: 32, spd: 0, spe: 0 } }, // Sludge Bomb, Giga Drain, Earth Power, Protect
      { slug: "blastoise", item: 211, ability: 67, moves: [56, 406, 430, 182], evs: { hp: 32, atk: 0, def: 0, spa: 32, spd: 0, spe: 0 } }, // Hydro Pump, Dragon Pulse, Flash Cannon, Protect
      { slug: "gengar", item: 247, ability: 130, moves: [247, 188, 416, 182], evs: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 } }, // Shadow Ball, Sludge Bomb, Focus Blast, Protect
      { slug: "snorlax", item: 211, ability: 82, moves: [34, 89, 442, 182], evs: { hp: 32, atk: 32, def: 0, spa: 0, spd: 0, spe: 0 } } // Body Slam, Earthquake, Iron Head, Protect
    ] as const;
    const opponentTeamSlugs = ["mewtwo", "gengar", "snorlax", "dragonite", "lapras", "gyarados"];
    
    let currentRating = 1500;
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const recordId = ulid();
      
      // Update rating based on result
      if (result === "win") currentRating += Math.floor(Math.random() * 15) + 10;
      else if (result === "loss") currentRating -= Math.floor(Math.random() * 15) + 10;
      
      // Played at: distribute over the past 20 days
      const playedAt = new Date();
      playedAt.setDate(playedAt.getDate() - (results.length - i));

      const myTeam: TrainedPokemon[] = myTeamData.map((data) => ({ 
        boxId: ulid(),
        identifier: data.slug,
        slug: data.slug, 
        item: data.item, 
        ability: data.ability, 
        gender: { fixed: false },
        nature: {},
        moves: data.moves as [number, number, number, number],
        evs: data.evs as any
      }));

      await tx.insert(schema.battleRecords).values({
        id: recordId,
        userId,
        seasonId,
        teamId,
        result,
        myTeam,
        mySelection: [0, 1, 2], // Chose first three
        rating: currentRating,
        notes: `Seed battle ${i + 1}`,
        playedAt,
      });

      // Add opponent data (6 pokemon)
      await tx.insert(schema.battleRecordOpponents).values(
        opponentTeamSlugs.map((slug, index) => ({
          battleRecordId: recordId,
          slotIndex: index,
          pokemonSlug: slug,
          selectionRole: index === 0 ? "lead" : index < 3 ? "back" : null,
        })) as any
      );
    }

    console.log(`Created ${results.length} battle records with opponents.`);

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
          }))
        );
        console.log(`Created 6 box pokemon and linked to team.`);

        // Create default dashboard
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
          defaultSeasonId: seasonId,
        }
      ],
      layout: [
        {
          id: ulid(),
          templateId: "win-rate",
          title: "Win Rate",
          dataSource: { type: "season", seasonId: null },
          x: 0,
          y: 0,
          w: 4,
          h: 4,
        },
        {
          id: ulid(),
          templateId: "recent-matches",
          title: "Recent Matches",
          dataSource: { type: "season", seasonId: null },
          x: 4,
          y: 0,
          w: 8,
          h: 4,
        }
      ],
        });
        console.log(`Created default dashboard.`);

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

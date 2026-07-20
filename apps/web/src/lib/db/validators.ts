import { z } from "zod";
import { ValidateResult, anyhow } from "@/errors/anyhow/error";
import { either } from "fp-ts";
import type { ZodIssue } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const handleZodError = <T>(parsed: any, name: string): ValidateResult<T> => {
  if (!parsed.success) {
    return either.left(
      parsed.error.issues.map((e: ZodIssue) =>
        anyhow(`${name} validation error: ${e.path.join(".")} - ${e.message}`, undefined),
      ),
    );
  }
  return either.right(parsed.data);
};

// -----------------------------------------------------------------------------
// Season Validation
// -----------------------------------------------------------------------------
export const insertSeasonSchema = z.object({
  id: z.string().optional(),
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  format: z.enum(["singles", "doubles"]),
  ruleMark: z.string().trim().min(1).nullish(),
  startedAt: dateString.nullish(),
  endedAt: dateString.nullish(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const validateInsertSeason = (
  data: unknown,
): ValidateResult<z.infer<typeof insertSeasonSchema>> =>
  handleZodError(insertSeasonSchema.safeParse(data), "Season");

// -----------------------------------------------------------------------------
// Team Validation
// -----------------------------------------------------------------------------
export const insertTeamSchema = z.object({
  id: z.string().optional(),
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const validateInsertTeam = (
  data: unknown,
): ValidateResult<z.infer<typeof insertTeamSchema>> =>
  handleZodError(insertTeamSchema.safeParse(data), "Team");

// -----------------------------------------------------------------------------
// Box Pokemon Validation
// -----------------------------------------------------------------------------
export const insertBoxPokemonSchema = z.object({
  id: z.string().optional(),
  userId: z.string().uuid(),
  slug: z.string().trim().min(1),
  data: z.record(z.string(), z.unknown()), // Drizzle jsonb field
  inBox: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const validateInsertBoxPokemon = (
  data: unknown,
): ValidateResult<z.infer<typeof insertBoxPokemonSchema>> =>
  handleZodError(insertBoxPokemonSchema.safeParse(data), "BoxPokemon");

// -----------------------------------------------------------------------------
// Battle Record Validation
// -----------------------------------------------------------------------------
export const insertBattleRecordSchema = z.object({
  id: z.string().optional(),
  userId: z.string().uuid(),
  seasonId: z.string().min(1),
  teamId: z.string().min(1).nullish(),
  result: z.enum(["win", "loss", "draw"]),
  myTeam: z.array(z.record(z.string(), z.unknown())).max(6),
  mySelection: z.array(z.number().int().min(0).max(5)).nullish(),
  rating: z.number().int().min(0).max(100000).nullish(),
  notes: z.string().nullish(),
  playedAt: z.date().nullish(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const validateInsertBattleRecord = (
  data: unknown,
): ValidateResult<z.infer<typeof insertBattleRecordSchema>> =>
  handleZodError(insertBattleRecordSchema.safeParse(data), "BattleRecord");

// -----------------------------------------------------------------------------
// Dashboard Validation
// -----------------------------------------------------------------------------
export const insertDashboardSchema = z.object({
  id: z.string().optional(),
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
  layout: z.array(z.record(z.string(), z.unknown())),
  variables: z.array(z.record(z.string(), z.unknown())),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const validateInsertDashboard = (
  data: unknown,
): ValidateResult<z.infer<typeof insertDashboardSchema>> =>
  handleZodError(insertDashboardSchema.safeParse(data), "Dashboard");

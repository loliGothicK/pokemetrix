import { db } from "@/lib/db";
import { battleRecords, battleRecordOpponents, teams, seasons } from "@/lib/db/schema";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { MitamaError, anyhow } from "@/errors/anyhow/error";
import { eq, and } from "drizzle-orm";
import type { InsertBattleRecord } from "../factories/battleRecordFactory";
import { validateInsertBattleRecord } from "../validators";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

export type InsertBattleRecordWithOpponents = InsertBattleRecord & {
  opponents?: Omit<typeof battleRecordOpponents.$inferInsert, "battleRecordId">[];
};

export const getBattleRecord = (
  id: string,
  userId: string,
): TaskEither<MitamaError, typeof battleRecords.$inferSelect | undefined> =>
  tryCatch(
    async () => {
      const result = await db
        .select()
        .from(battleRecords)
        .where(and(eq(battleRecords.id, id), eq(battleRecords.userId, userId)))
        .limit(1);
      return result[0];
    },
    (reason) =>
      anyhow(
        "Failed to fetch battleRecord",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

export const createBattleRecord = (
  data: InsertBattleRecordWithOpponents,
): TaskEither<
  MitamaError,
  {
    record: typeof battleRecords.$inferSelect;
    opponents: (typeof battleRecordOpponents.$inferSelect)[];
  }
> =>
  pipe(
    TE.fromEither(validateInsertBattleRecord(data)),
    TE.mapLeft((errors) => errors[0]),
    TE.chain((validData) =>
      tryCatch(
        async () => {
          return await db.transaction(async (tx) => {
            // Validate seasonId exists
            const [existingSeason] = await tx
              .select({ id: seasons.id })
              .from(seasons)
              .where(and(eq(seasons.id, validData.seasonId), eq(seasons.userId, validData.userId)))
              .limit(1);
            if (!existingSeason) {
              throw new Error(`Season not found: ${validData.seasonId}`);
            }

            // Validate teamId exists for this user; if not found (e.g. local unsaved team), insert stub team so FK is satisfied
            let effectiveTeamId = validData.teamId ?? null;
            if (effectiveTeamId) {
              const [existingTeam] = await tx
                .select({ id: teams.id })
                .from(teams)
                .where(and(eq(teams.id, effectiveTeamId), eq(teams.userId, validData.userId)))
                .limit(1);
              if (!existingTeam) {
                await tx
                  .insert(teams)
                  .values({
                    id: effectiveTeamId,
                    userId: validData.userId,
                    name: "Local Team",
                  })
                  .onConflictDoNothing();
              }
            }

            const [record] = await tx
              .insert(battleRecords)
              .values({
                ...(validData as unknown as InsertBattleRecord),
                teamId: effectiveTeamId,
                tags: validData.tags ? [...validData.tags] : [],
              })
              .returning();

            const opponents = data.opponents || [];
            const opponentRows =
              opponents.length > 0
                ? await tx
                    .insert(battleRecordOpponents)
                    .values(
                      opponents.map((o) => ({
                        ...o,
                        battleRecordId: record.id,
                      })),
                    )
                    .returning()
                : [];

            return { record, opponents: opponentRows };
          });
        },
        (reason) =>
          anyhow(
            "Failed to create battleRecord in DB",
            reason instanceof Error ? reason : new Error(String(reason)),
          ),
      ),
    ),
  );

export const updateBattleRecord = (
  id: string,
  userId: string,
  data: Partial<InsertBattleRecord>,
): TaskEither<MitamaError, typeof battleRecords.$inferSelect> =>
  tryCatch(
    async () => {
      let effectiveTeamId = data.teamId;
      if (effectiveTeamId) {
        const [existingTeam] = await db
          .select({ id: teams.id })
          .from(teams)
          .where(and(eq(teams.id, effectiveTeamId), eq(teams.userId, userId)))
          .limit(1);
        if (!existingTeam) {
          await db
            .insert(teams)
            .values({
              id: effectiveTeamId,
              userId,
              name: "Local Team",
            })
            .onConflictDoNothing();
        }
      }

      const [result] = await db
        .update(battleRecords)
        .set({
          ...data,
          ...(data.teamId !== undefined && { teamId: effectiveTeamId }),
          updatedAt: new Date(),
        })
        .where(and(eq(battleRecords.id, id), eq(battleRecords.userId, userId)))
        .returning();
      return result;
    },
    (reason) =>
      anyhow(
        "Failed to update battleRecord in DB",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

export const deleteBattleRecord = (
  id: string,
  userId: string,
): TaskEither<MitamaError, typeof battleRecords.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db
        .delete(battleRecords)
        .where(and(eq(battleRecords.id, id), eq(battleRecords.userId, userId)))
        .returning();
      return result;
    },
    (reason) =>
      anyhow(
        "Failed to delete battleRecord",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

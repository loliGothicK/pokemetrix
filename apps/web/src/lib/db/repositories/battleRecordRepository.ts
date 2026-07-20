import { db } from "@/lib/db";
import { battleRecords } from "@/lib/db/schema";
import { TaskEither, tryCatch } from "fp-ts/TaskEither";
import { MitamaError, anyhow } from "@/errors/anyhow/error";
import { eq, and } from "drizzle-orm";
import type { InsertBattleRecord } from "../factories/battleRecordFactory";
import { validateInsertBattleRecord } from "../validators";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

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
  data: InsertBattleRecord,
): TaskEither<MitamaError, typeof battleRecords.$inferSelect> =>
  pipe(
    TE.fromEither(validateInsertBattleRecord(data)),
    TE.mapLeft((errors) => errors[0]),
    TE.chain((validData) =>
      tryCatch(
        async () => {
          const [result] = await db
            .insert(battleRecords)
            .values(validData as unknown as InsertBattleRecord)
            .returning();
          return result;
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
      const [result] = await db
        .update(battleRecords)
        .set({ ...data, updatedAt: new Date() })
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

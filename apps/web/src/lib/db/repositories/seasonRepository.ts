import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { TaskEither, tryCatch } from "fp-ts/TaskEither";
import { MitamaError, anyhow } from "@/errors/anyhow/error";
import { eq, and } from "drizzle-orm";
import type { InsertSeason } from "../factories/seasonFactory";
import { validateInsertSeason } from "../validators";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export const getSeason = (id: string, userId: string): TaskEither<MitamaError, typeof seasons.$inferSelect | undefined> =>
  tryCatch(
    async () => {
      const result = await db.select().from(seasons).where(and(eq(seasons.id, id), eq(seasons.userId, userId))).limit(1);
      return result[0];
    },
    (reason) => anyhow("Failed to fetch season", reason instanceof Error ? reason : new Error(String(reason)))
  );

export const listSeasons = (userId: string): TaskEither<MitamaError, typeof seasons.$inferSelect[]> =>
  tryCatch(
    async () => {
      return await db.select().from(seasons).where(eq(seasons.userId, userId)).orderBy(seasons.createdAt);
    },
    (reason) => anyhow("Failed to list seasons", reason instanceof Error ? reason : new Error(String(reason)))
  );

export const createSeason = (data: InsertSeason): TaskEither<MitamaError, typeof seasons.$inferSelect> =>
  pipe(
    TE.fromEither(validateInsertSeason(data)),
    TE.mapLeft(errors => errors[0]), // Take first error
    TE.chain(validData => tryCatch(
      async () => {
        const [result] = await db.insert(seasons).values(validData as unknown as InsertSeason).returning();
        return result;
      },
      (reason) => anyhow("Failed to create season in DB", reason instanceof Error ? reason : new Error(String(reason)))
    ))
  );

export const updateSeason = (id: string, userId: string, data: Partial<InsertSeason>): TaskEither<MitamaError, typeof seasons.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db.update(seasons).set({ ...data, updatedAt: new Date() }).where(and(eq(seasons.id, id), eq(seasons.userId, userId))).returning();
      return result;
    },
    (reason) => anyhow("Failed to update season in DB", reason instanceof Error ? reason : new Error(String(reason)))
  );

export const deleteSeason = (id: string, userId: string): TaskEither<MitamaError, typeof seasons.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db.delete(seasons).where(and(eq(seasons.id, id), eq(seasons.userId, userId))).returning();
      return result;
    },
    (reason) => anyhow("Failed to delete season", reason instanceof Error ? reason : new Error(String(reason)))
  );

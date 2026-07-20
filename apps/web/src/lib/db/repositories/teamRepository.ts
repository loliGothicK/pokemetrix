import { db } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { TaskEither, tryCatch } from "fp-ts/TaskEither";
import { MitamaError, anyhow } from "@/errors/anyhow/error";
import { eq, and } from "drizzle-orm";
import type { InsertTeam } from "../factories/teamFactory";
import { validateInsertTeam } from "../validators";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export const getTeam = (
  id: string,
  userId: string,
): TaskEither<MitamaError, typeof teams.$inferSelect | undefined> =>
  tryCatch(
    async () => {
      const result = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, id), eq(teams.userId, userId)))
        .limit(1);
      return result[0];
    },
    (reason) =>
      anyhow("Failed to fetch team", reason instanceof Error ? reason : new Error(String(reason))),
  );

export const createTeam = (data: InsertTeam): TaskEither<MitamaError, typeof teams.$inferSelect> =>
  pipe(
    TE.fromEither(validateInsertTeam(data)),
    TE.mapLeft((errors) => errors[0]),
    TE.chain((validData) =>
      tryCatch(
        async () => {
          const [result] = await db
            .insert(teams)
            .values(validData as unknown as InsertTeam)
            .returning();
          return result;
        },
        (reason) =>
          anyhow(
            "Failed to create team in DB",
            reason instanceof Error ? reason : new Error(String(reason)),
          ),
      ),
    ),
  );

export const updateTeam = (
  id: string,
  userId: string,
  data: Partial<InsertTeam>,
): TaskEither<MitamaError, typeof teams.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db
        .update(teams)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(teams.id, id), eq(teams.userId, userId)))
        .returning();
      return result;
    },
    (reason) =>
      anyhow(
        "Failed to update team in DB",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

export const deleteTeam = (
  id: string,
  userId: string,
): TaskEither<MitamaError, typeof teams.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db
        .delete(teams)
        .where(and(eq(teams.id, id), eq(teams.userId, userId)))
        .returning();
      return result;
    },
    (reason) =>
      anyhow("Failed to delete team", reason instanceof Error ? reason : new Error(String(reason))),
  );

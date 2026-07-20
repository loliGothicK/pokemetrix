import { db } from "@/lib/db";
import { dashboards } from "@/lib/db/schema";
import { TaskEither, tryCatch } from "fp-ts/TaskEither";
import { MitamaError, anyhow } from "@/errors/anyhow/error";
import { eq, and } from "drizzle-orm";
import type { InsertDashboard } from "../factories/dashboardFactory";
import { validateInsertDashboard } from "../validators";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export const getDashboard = (
  id: string,
  userId: string,
): TaskEither<MitamaError, typeof dashboards.$inferSelect | undefined> =>
  tryCatch(
    async () => {
      const result = await db
        .select()
        .from(dashboards)
        .where(and(eq(dashboards.id, id), eq(dashboards.userId, userId)))
        .limit(1);
      return result[0];
    },
    (reason) =>
      anyhow(
        "Failed to fetch dashboard",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

export const createDashboard = (
  data: InsertDashboard,
): TaskEither<MitamaError, typeof dashboards.$inferSelect> =>
  pipe(
    TE.fromEither(validateInsertDashboard(data)),
    TE.mapLeft((errors) => errors[0]),
    TE.chain((validData) =>
      tryCatch(
        async () => {
          const [result] = await db
            .insert(dashboards)
            .values(validData as unknown as InsertDashboard)
            .returning();
          return result;
        },
        (reason) =>
          anyhow(
            "Failed to create dashboard in DB",
            reason instanceof Error ? reason : new Error(String(reason)),
          ),
      ),
    ),
  );

export const updateDashboard = (
  id: string,
  userId: string,
  data: Partial<InsertDashboard>,
): TaskEither<MitamaError, typeof dashboards.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db
        .update(dashboards)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(dashboards.id, id), eq(dashboards.userId, userId)))
        .returning();
      return result;
    },
    (reason) =>
      anyhow(
        "Failed to update dashboard in DB",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

export const deleteDashboard = (
  id: string,
  userId: string,
): TaskEither<MitamaError, typeof dashboards.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db
        .delete(dashboards)
        .where(and(eq(dashboards.id, id), eq(dashboards.userId, userId)))
        .returning();
      return result;
    },
    (reason) =>
      anyhow(
        "Failed to delete dashboard",
        reason instanceof Error ? reason : new Error(String(reason)),
      ),
  );

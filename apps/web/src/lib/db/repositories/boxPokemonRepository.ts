import { db } from "@/lib/db";
import { boxPokemon } from "@/lib/db/schema";
import { TaskEither, tryCatch } from "fp-ts/TaskEither";
import { MitamaError, anyhow } from "@/errors/anyhow/error";
import { eq, and } from "drizzle-orm";
import type { InsertBoxPokemon } from "../factories/boxPokemonFactory";
import { validateInsertBoxPokemon } from "../validators";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export const getBoxPokemon = (id: string, userId: string): TaskEither<MitamaError, typeof boxPokemon.$inferSelect | undefined> =>
  tryCatch(
    async () => {
      const result = await db.select().from(boxPokemon).where(and(eq(boxPokemon.id, id), eq(boxPokemon.userId, userId))).limit(1);
      return result[0];
    },
    (reason) => anyhow("Failed to fetch boxPokemon", reason instanceof Error ? reason : new Error(String(reason)))
  );

export const createBoxPokemon = (data: InsertBoxPokemon): TaskEither<MitamaError, typeof boxPokemon.$inferSelect> =>
  pipe(
    TE.fromEither(validateInsertBoxPokemon(data)),
    TE.mapLeft(errors => errors[0]),
    TE.chain(validData => tryCatch(
      async () => {
        const [result] = await db.insert(boxPokemon).values(validData as unknown as InsertBoxPokemon).returning();
        return result;
      },
      (reason) => anyhow("Failed to create boxPokemon in DB", reason instanceof Error ? reason : new Error(String(reason)))
    ))
  );

export const updateBoxPokemon = (id: string, userId: string, data: Partial<InsertBoxPokemon>): TaskEither<MitamaError, typeof boxPokemon.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db.update(boxPokemon).set({ ...data, updatedAt: new Date() }).where(and(eq(boxPokemon.id, id), eq(boxPokemon.userId, userId))).returning();
      return result;
    },
    (reason) => anyhow("Failed to update boxPokemon in DB", reason instanceof Error ? reason : new Error(String(reason)))
  );

export const deleteBoxPokemon = (id: string, userId: string): TaskEither<MitamaError, typeof boxPokemon.$inferSelect> =>
  tryCatch(
    async () => {
      const [result] = await db.delete(boxPokemon).where(and(eq(boxPokemon.id, id), eq(boxPokemon.userId, userId))).returning();
      return result;
    },
    (reason) => anyhow("Failed to delete boxPokemon", reason instanceof Error ? reason : new Error(String(reason)))
  );

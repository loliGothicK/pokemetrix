import { boxPokemon } from "@/lib/db/schema";
import { ulid } from "ulid";

export type InsertBoxPokemon = typeof boxPokemon.$inferInsert;

export class BoxPokemonFactory<
  THasUserId extends boolean = false,
  THasSlug extends boolean = false,
  THasData extends boolean = false,
> {
  private data: Partial<InsertBoxPokemon> = {
    id: ulid(),
    inBox: false,
  };

  withUserId(userId: string): BoxPokemonFactory<true, THasSlug, THasData> {
    this.data.userId = userId;
    return this as unknown as BoxPokemonFactory<true, THasSlug, THasData>;
  }

  withSlug(slug: string): BoxPokemonFactory<THasUserId, true, THasData> {
    this.data.slug = slug;
    return this as unknown as BoxPokemonFactory<THasUserId, true, THasData>;
  }

  withData(data: unknown): BoxPokemonFactory<THasUserId, THasSlug, true> {
    this.data.data = data;
    return this as unknown as BoxPokemonFactory<THasUserId, THasSlug, true>;
  }

  withInBox(inBox: boolean): this {
    this.data.inBox = inBox;
    return this;
  }

  build(this: BoxPokemonFactory<true, true, true>): InsertBoxPokemon {
    return this.data as InsertBoxPokemon;
  }
}

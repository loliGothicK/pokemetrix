import { seasons } from "@/lib/db/schema";
import type { BattleFormat } from "@/lib/db/schema";
import { ulid } from "ulid";

export type InsertSeason = typeof seasons.$inferInsert;

export class SeasonFactory<
  THasUserId extends boolean = false,
  THasName extends boolean = false,
  THasFormat extends boolean = false,
> {
  private data: Partial<InsertSeason> = {
    id: ulid(),
  };

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withUserId(userId: string): SeasonFactory<true, THasName, THasFormat> {
    this.data.userId = userId;
    return this as any;
  }

  withName(name: string): SeasonFactory<THasUserId, true, THasFormat> {
    this.data.name = name;
    return this as any;
  }

  withFormat(format: BattleFormat): SeasonFactory<THasUserId, THasName, true> {
    this.data.format = format;
    return this as any;
  }

  withRuleMark(ruleMark: string | null): this {
    this.data.ruleMark = ruleMark;
    return this;
  }

  withStartedAt(startedAt: string | null): this {
    this.data.startedAt = startedAt;
    return this;
  }

  withEndedAt(endedAt: string | null): this {
    this.data.endedAt = endedAt;
    return this;
  }

  build(this: SeasonFactory<true, true, true>): InsertSeason {
    return this.data as InsertSeason;
  }
}

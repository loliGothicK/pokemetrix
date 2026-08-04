import { battleRecords } from "@/lib/db/schema";
import type { BattleResult } from "@/lib/db/schema";
import type { TrainedPokemon } from "@/store/team/team";
import { ulid } from "ulid";

export type InsertBattleRecord = typeof battleRecords.$inferInsert;

export class BattleRecordFactory<
  THasUserId extends boolean = false,
  THasSeasonId extends boolean = false,
  THasResult extends boolean = false,
  THasMyTeam extends boolean = false,
> {
  private data: Partial<InsertBattleRecord> = {
    id: ulid(),
  };

  withUserId(userId: string): BattleRecordFactory<true, THasSeasonId, THasResult, THasMyTeam> {
    this.data.userId = userId;
    return this as unknown as BattleRecordFactory<true, THasSeasonId, THasResult, THasMyTeam>;
  }

  withSeasonId(seasonId: string): BattleRecordFactory<THasUserId, true, THasResult, THasMyTeam> {
    this.data.seasonId = seasonId;
    return this as unknown as BattleRecordFactory<THasUserId, true, THasResult, THasMyTeam>;
  }

  withResult(
    result: BattleResult,
  ): BattleRecordFactory<THasUserId, THasSeasonId, true, THasMyTeam> {
    this.data.result = result;
    return this as unknown as BattleRecordFactory<THasUserId, THasSeasonId, true, THasMyTeam>;
  }

  withMyTeam(
    myTeam: readonly TrainedPokemon[],
  ): BattleRecordFactory<THasUserId, THasSeasonId, THasResult, true> {
    this.data.myTeam = myTeam;
    return this as unknown as BattleRecordFactory<THasUserId, THasSeasonId, THasResult, true>;
  }

  withTeamId(teamId: string | null): this {
    this.data.teamId = teamId;
    return this;
  }

  withMySelection(mySelection: number[] | null): this {
    this.data.mySelection = mySelection;
    return this;
  }

  withRating(rating: number | null): this {
    this.data.rating = rating;
    return this;
  }

  withNotes(notes: string | null): this {
    this.data.notes = notes;
    return this;
  }

  withPlayedAt(playedAt: Date | null): this {
    if (playedAt) this.data.playedAt = playedAt;
    return this;
  }

  build(this: BattleRecordFactory<true, true, true, true>): InsertBattleRecord {
    return this.data as InsertBattleRecord;
  }
}

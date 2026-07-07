import { z } from "zod";
import type { TrainedPokemon } from "@/store/team/team";
import type {
  BattleFormat,
  BattleResult,
  FirstOrSecond,
  OpponentSelectionRole,
} from "@/lib/db/schema";

export type { BattleFormat, BattleResult, FirstOrSecond, OpponentSelectionRole };

// =====================================================================
// DTO（クライアント⇔サーバ間でやり取りするシリアライズ済みの形）
// 設計: .design/battle-records.md
// =====================================================================

/** シーズン / レギュレーション */
export interface Season {
  readonly id: string;
  readonly name: string;
  readonly format: BattleFormat;
  readonly ruleMark: string | null;
  /** "YYYY-MM-DD" */
  readonly startedAt: string | null;
  /** "YYYY-MM-DD" */
  readonly endedAt: string | null;
  /** ISO 8601 */
  readonly createdAt: string;
  /** ISO 8601 */
  readonly updatedAt: string;
}

/** 相手個体（正規化された子レコード） */
export interface BattleRecordOpponent {
  readonly slotIndex: number;
  readonly pokemonSlug: string;
  readonly itemSlug: string | null;
  readonly abilitySlug: string | null;
  readonly moves: readonly string[] | null;
  readonly selectionRole: OpponentSelectionRole | null;
  readonly notes: string | null;
}

/** 対戦記録1試合 */
export interface BattleRecord {
  readonly id: string;
  readonly seasonId: string;
  /** 記録に使用したチーム（任意） */
  readonly teamId: string | null;
  readonly result: BattleResult;
  readonly myTeam: readonly TrainedPokemon[];
  readonly mySelection: readonly number[] | null;
  readonly firstOrSecond: FirstOrSecond | null;
  /** その試合終了時点のレート */
  readonly rating: number | null;
  readonly notes: string | null;
  /** ISO 8601 */
  readonly playedAt: string;
  readonly opponents: readonly BattleRecordOpponent[];
  /** ISO 8601 */
  readonly createdAt: string;
  /** ISO 8601 */
  readonly updatedAt: string;
}

// =====================================================================
// 入力バリデーション（Zod）
// =====================================================================

/** "YYYY-MM-DD" 形式の日付文字列 */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const seasonInputObject = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(100),
  format: z.enum(["singles", "doubles"]),
  ruleMark: z.string().trim().min(1).nullish(),
  startedAt: dateString.nullish(),
  endedAt: dateString.nullish(),
});

export const seasonInputSchema = seasonInputObject.readonly();

export type SeasonInput = z.infer<typeof seasonInputSchema>;

/** PATCH 用: id 以外を部分更新 */
export const seasonUpdateSchema = seasonInputObject.omit({ id: true }).partial().readonly();

export type SeasonUpdate = z.infer<typeof seasonUpdateSchema>;

export const opponentInputSchema = z
  .object({
    slotIndex: z.number().int().min(0).max(5),
    pokemonSlug: z.string().trim().min(1),
    itemSlug: z.string().trim().min(1).nullish(),
    abilitySlug: z.string().trim().min(1).nullish(),
    moves: z.array(z.string().trim().min(1)).nullish(),
    selectionRole: z.enum(["lead", "back"]).nullish(),
    notes: z.string().nullish(),
  })
  .readonly();

const battleRecordInputObject = z.object({
  id: z.string().min(1).optional(),
  seasonId: z.string().min(1),
  teamId: z.string().min(1).nullish(),
  result: z.enum(["win", "loss", "draw"]),
  // 中身は TrainedPokemon をクライアントが保証。ここでは構造のみ検証。
  myTeam: z.array(z.object({}).passthrough()).max(6),
  mySelection: z.array(z.number().int().min(0).max(5)).nullish(),
  firstOrSecond: z.enum(["first", "second"]).nullish(),
  rating: z.number().int().min(0).max(100000).nullish(),
  notes: z.string().nullish(),
  /** ISO 8601。省略時はサーバ側で now() */
  playedAt: z.iso.datetime({ offset: true }).nullish(),
  opponents: z
    .array(opponentInputSchema)
    .max(6)
    .refine(
      (arr) => new Set(arr.map((o) => o.slotIndex)).size === arr.length,
      "slotIndex must be unique",
    ),
});

export const battleRecordInputSchema = battleRecordInputObject.readonly();

export type BattleRecordInput = z.infer<typeof battleRecordInputSchema>;

/** PATCH 用: id/seasonId 以外を部分更新 */
export const battleRecordUpdateSchema = battleRecordInputObject
  .omit({ id: true, seasonId: true })
  .partial()
  .readonly();

export type BattleRecordUpdate = z.infer<typeof battleRecordUpdateSchema>;

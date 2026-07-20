import { match } from "ts-pattern";
import type { BattleRecord } from "./battleRecord";

/** 勝敗の集計結果 */
export interface RecordTally {
  readonly total: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  /** wins / total（0..1）。total===0 のとき 0 */
  readonly winRate: number;
}

const withWinRate = (wins: number, losses: number, draws: number): RecordTally => {
  const total = wins + losses + draws;
  return { total, wins, losses, draws, winRate: total === 0 ? 0 : wins / total };
};

/** 記録全体の勝敗を集計する */
export const tally = (records: readonly BattleRecord[]): RecordTally => {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const record of records) {
    match(record.result)
      .with("win", () => {
        wins += 1;
      })
      .with("loss", () => {
        losses += 1;
      })
      .with("draw", () => {
        draws += 1;
      })
      .exhaustive();
  }
  return withWinRate(wins, losses, draws);
};

/** 対面したポケモン1種ごとの成績 */
export interface OpponentStat extends RecordTally {
  readonly pokemonSlug: string;
}

/**
 * 対戦相手のポケモンごとに、そのポケモンが相手パーティに含まれていた試合の
 * 勝敗を集計する。登場試合数の多い順、同数なら勝率の高い順に並べる。
 */
export const opponentStats = (records: readonly BattleRecord[]): readonly OpponentStat[] => {
  const acc = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const record of records) {
    // 同一試合内で同じ種が重複しても1回として数える
    const slugs = new Set(record.opponents.map((o) => o.pokemonSlug));
    for (const slug of slugs) {
      const current = acc.get(slug) ?? { wins: 0, losses: 0, draws: 0 };
      match(record.result)
        .with("win", () => {
          current.wins += 1;
        })
        .with("loss", () => {
          current.losses += 1;
        })
        .with("draw", () => {
          current.draws += 1;
        })
        .exhaustive();
      acc.set(slug, current);
    }
  }

  return Array.from(acc.entries())
    .map(([pokemonSlug, { wins, losses, draws }]) => ({
      pokemonSlug,
      ...withWinRate(wins, losses, draws),
    }))
    .sort((a, b) => b.total - a.total || b.winRate - a.winRate);
};

/** パーセント表記（整数）。total===0 のときは null（"—"表示用） */
export const winRatePercent = (t: RecordTally): number | null =>
  t.total === 0 ? null : Math.round(t.winRate * 100);

/** 時系列上の1試合分の累積勝率ポイント */
export interface WinRateTrendPoint {
  readonly recordId: string;
  readonly playedAt: string;
  readonly result: BattleRecord["result"];
  /** その試合までの累積勝率（%、整数）。0試合目は null */
  readonly cumulativeWinRate: number | null;
  readonly gameNumber: number;
}

/**
 * 対戦記録を playedAt 昇順に並べ、試合ごとの累積勝率を計算する。
 * ダッシュボードの推移ウィジェット（winRateTrend）向け。
 */
export const winRateTrend = (records: readonly BattleRecord[]): readonly WinRateTrendPoint[] => {
  const sorted = records
    .slice()
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

  let wins = 0;
  let total = 0;

  return sorted.map((record, index) => {
    match(record.result)
      .with("win", () => {
        wins += 1;
      })
      .with("loss", () => {})
      .with("draw", () => {})
      .exhaustive();
    total += 1;

    return {
      recordId: record.id,
      playedAt: record.playedAt,
      result: record.result,
      cumulativeWinRate: total === 0 ? null : Math.round((wins / total) * 100),
      gameNumber: index + 1,
    };
  });
};

/** レート推移の1点 */
export interface RatingTrendPoint {
  readonly recordId: string;
  readonly playedAt: string;
  readonly rating: number;
  readonly gameNumber: number;
}

/**
 * rating が記録されている試合だけを playedAt 昇順で抽出する。
 * ダッシュボードのレート推移ウィジェット（ratingTrend）向け。
 */
export const ratingTrend = (records: readonly BattleRecord[]): readonly RatingTrendPoint[] =>
  records
    .filter((r) => r.rating !== null)
    .slice()
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())
    .map((record, index) => ({
      recordId: record.id,
      playedAt: record.playedAt,
      rating: record.rating as number,
      gameNumber: index + 1,
    }));

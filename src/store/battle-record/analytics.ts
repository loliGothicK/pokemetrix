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

/** 先攻/後攻/不明で分けた集計 */
export interface OrderSplit {
  readonly first: RecordTally;
  readonly second: RecordTally;
  readonly unknown: RecordTally;
}

export const tallyByOrder = (records: readonly BattleRecord[]): OrderSplit => ({
  first: tally(records.filter((r) => r.firstOrSecond === "first")),
  second: tally(records.filter((r) => r.firstOrSecond === "second")),
  unknown: tally(records.filter((r) => r.firstOrSecond === null)),
});

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

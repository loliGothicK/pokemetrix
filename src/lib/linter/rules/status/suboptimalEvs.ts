import { TrainedPokemon } from "@/store/team/team";

import { match } from "ts-pattern";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { Option } from "fp-ts/lib/Option";
import { suboptimalEvs, SuboptimalEvs } from "@/lib/linter/errors/LintError";
import { option } from "fp-ts";
import { outdent } from "outdent";
import { natureObjectToString } from "@/data/nature";

// ---------------------------------------------------------
// 1. 型定義
// ---------------------------------------------------------
export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type Stats = Record<StatKey, number>;

export type OptimizedResult = {
  hasUpgrade: boolean;
  bestCost: number;
  currentCost: number;
  // ツール側でそのまま状態更新に使える形式で返す
  alternatives: {
    nature: TrainedPokemon["nature"];
    evs: Record<StatKey, number>;
    savedPoints: number; // どれだけ努力値が浮いたか
  }[];
};

const STAT_KEYS: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"];

// ---------------------------------------------------------
// 2. 基礎計算ロジック
// ---------------------------------------------------------
const calcHp = (base: number, ev: number) => base + ev + 75;
const calcStatus = (base: number, ev: number, multiplier: number) =>
  Math.floor((base + ev + 20) * multiplier);

function getRequiredRawStat(target: number, multiplier: 1.1 | 1.0 | 0.9): number {
  if (multiplier === 1.1) return Math.floor((target * 10 + 10) / 11);
  if (multiplier === 0.9) return Math.floor((target * 10 + 8) / 9);
  return target;
}

function* generateNatures(): IterableIterator<{
  plus: Exclude<StatKey, "hp">;
  minus: Exclude<StatKey, "hp">;
}> {
  const keys = ["atk", "def", "spa", "spd", "spe"] as const;
  for (const plus of keys) {
    for (const minus of keys) {
      if (plus !== minus) yield { plus, minus };
    }
  }
}

// ---------------------------------------------------------
// 3. アダプター兼オプティマイザー
// ---------------------------------------------------------
/**
 * ポケモンのデータと種族値を受け取り、より効率的な割り振りがないか検証する
 */
function analyseEvSpreadsOptimization(pokemon: TrainedPokemon): OptimizedResult {
  const getBaseStatsFromMaster = (identifier: string): Stats => {
    const masterData = championsPokemonByIdentifier.get(identifier)!;
    const [hp, atk, def, spa, spd, spe] = masterData.status;
    return { hp, atk, def, spa, spd, spe };
  };

  const baseStats = getBaseStatsFromMaster(pokemon.identifier);

  // A. 現在の総消費努力値を計算
  const currentTotalCost = Object.values(pokemon.evs).reduce((sum, val) => sum + val, 0 as number);

  // B. 現在の実数値を算出 (Target Stats)
  const targetStats = {} as Stats;
  for (const key of STAT_KEYS) {
    if (key === "hp") {
      targetStats.hp = calcHp(baseStats.hp, pokemon.evs.hp);
    } else {
      let multiplier = 1.0;
      if (pokemon.nature.plus === key) multiplier = 1.1;
      if (pokemon.nature.minus === key) multiplier = 0.9;
      targetStats[key] = calcStatus(baseStats[key], pokemon.evs[key], multiplier);
    }
  }

  // C. 最適化エンジンの実行
  const alternatives: OptimizedResult["alternatives"] = [];
  let minCost = Infinity;

  const hpRequiredEV = targetStats.hp - (baseStats.hp + 75);
  if (hpRequiredEV > 32 || hpRequiredEV < 0) {
    return {
      hasUpgrade: false,
      bestCost: Infinity,
      currentCost: currentTotalCost,
      alternatives: [],
    };
  }
  const hpCost = Math.max(0, hpRequiredEV);

  for (const nature of generateNatures()) {
    let totalCost = hpCost;
    let isValid = true;

    // この性格パターンの際の努力値振りを記録するオブジェクト
    const optimizedEvs: Record<StatKey, number> = {
      hp: hpCost,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    for (const key of STAT_KEYS.filter((key) => key !== "hp")) {
      let multiplier = match(key)
        .when(
          (key) => key === nature.plus,
          () => 1.1 as const,
        )
        .when(
          (key) => key === nature.minus,
          () => 0.9 as const,
        )
        .otherwise(() => 1.0 as const);

      const requiredRaw = getRequiredRawStat(targetStats[key], multiplier);
      const evCost = requiredRaw - baseStats[key] - 20;

      if (evCost > 32) {
        isValid = false;
        break;
      }

      const finalEvForStat = Math.max(0, evCost);
      optimizedEvs[key] = finalEvForStat;
      totalCost += finalEvForStat;
    }

    if (isValid && totalCost <= 66) {
      // 元のコストより少ない努力値で同じ実数値に到達できる場合のみ登録
      if (totalCost < currentTotalCost) {
        alternatives.push({
          nature: { plus: nature.plus || undefined, minus: nature.minus || undefined }, // スキーマのundefined許容に合わせる
          evs: optimizedEvs,
          savedPoints: currentTotalCost - totalCost,
        });
      }
      if (totalCost < minCost) {
        minCost = totalCost;
      }
    }
  }

  // 浮いた努力値が多い順（= コストが低い順）にソート
  const sortedAlternatives = alternatives.sort((a, b) => b.savedPoints - a.savedPoints);

  return {
    hasUpgrade: sortedAlternatives.length > 0,
    bestCost: minCost,
    currentCost: currentTotalCost,
    alternatives: sortedAlternatives,
  };
}

export const checkSuboptimalEVs = (member: TrainedPokemon): Option<SuboptimalEvs> => {
  const optimization = analyseEvSpreadsOptimization(member);

  if (!optimization.hasUpgrade) {
    return option.none;
  }

  const best = optimization.alternatives[0];
  const plus = best.nature.plus;
  const minus = best.nature.minus;

  return option.some(
    suboptimalEvs(
      outdent`
        There is a superior alternative for Effort Value allocation. 
        If you change the nature to ${natureObjectToString({ plus, minus })}, you will gain ${best.savedPoints} Effort EVs.
      `,
    ),
  );
};

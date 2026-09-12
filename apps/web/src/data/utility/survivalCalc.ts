import { MAX_EV_PER_STAT, MAX_EV_TOTAL } from "@/store/team/lint";
import { calcHp, calcStatus } from "@/data/utility/training";
import {
  resolveDamageInput,
  type ResolveContext,
  type PokemonPanelState,
} from "@/lib/damage/resolve";
import { calculate } from "@/lib/damage/engine";

export type SurvivalTargetType =
  | "guaranteed" // 16/16 耐え (100%)
  | "highest_roll_excluded" // 15/16 耐え (93.75%)
  | "custom";

export interface SurvivalOptions {
  /**
   * 必要な生存乱数数 (1〜16)
   * 16 = 確定耐え (100%)
   * 15 = 最高乱数以外耐え (93.75%)
   */
  minSurvivingRolls?: number;
  /**
   * すでに振られている努力値の下限リスペクト (これ未満に削らない)
   */
  minEvs?: {
    hp?: number;
    def?: number;
    spd?: number;
  };
}

export interface SurvivalCandidate {
  evs: {
    hp: number;
    def: number;
    spd: number;
  };
  totalUsed: number;
  survivingRolls: number;
  survivalRate: number; // 0.0 ~ 1.0
  maxDamage: number;
  hpStat: number;
  defStat: number;
  spdStat: number;
}

export interface SurvivalOptimizationResult {
  /** 達成できたか */
  achieved: boolean;
  /** 最適配分 */
  best: SurvivalCandidate | null;
  /** 達成できなかった場合の最高生存確率の配分 */
  fallback: SurvivalCandidate | null;
}

export interface SurvivalTuningContext {
  attacker: PokemonPanelState;
  defenderBase: {
    identifier: string;
    nature: { plus?: string | null; minus?: string | null };
    baseStats: { hp: number; def: number; spd: number };
    item?: string | null;
    ability?: string | null;
  };
  environment: {
    weather?: ResolveContext["weather"];
    terrain?: ResolveContext["terrain"];
    isDoubles?: boolean;
    screens?: ResolveContext["screens"];
    isCrit?: boolean;
  };
  availablePool: number;
  options?: SurvivalOptions;
}

/**
 * 仮想敵の攻撃に対して指定の生存基準を満たす最小努力値配分を算出する
 */
export async function optimizeSurvival(
  ctx: SurvivalTuningContext,
): Promise<SurvivalOptimizationResult> {
  const { attacker, defenderBase, environment, availablePool, options } = ctx;
  const minRollsRequired = options?.minSurvivingRolls ?? 16;
  const pool = Math.max(0, Math.min(MAX_EV_TOTAL, availablePool));

  const minH = Math.max(0, Math.min(MAX_EV_PER_STAT, options?.minEvs?.hp ?? 0));
  const minB = Math.max(0, Math.min(MAX_EV_PER_STAT, options?.minEvs?.def ?? 0));
  const minD = Math.max(0, Math.min(MAX_EV_PER_STAT, options?.minEvs?.spd ?? 0));

  const defMultiplier =
    defenderBase.nature.plus === "def" ? 1.1 : defenderBase.nature.minus === "def" ? 0.9 : 1.0;
  const spdMultiplier =
    defenderBase.nature.plus === "spd" ? 1.1 : defenderBase.nature.minus === "spd" ? 0.9 : 1.0;

  let bestCandidate: SurvivalCandidate | null = null;
  let bestFallback: SurvivalCandidate | null = null;

  // 相手の技が Def か SpD のどちらを参照するかを判定
  const probeCtx: ResolveContext = {
    attacker,
    defender: {
      identifier: defenderBase.identifier,
      move: null,
      ability: defenderBase.ability ?? null,
      item: defenderBase.item ?? null,
      boosts: {},
      evHp: 0,
      evAtk: 0,
      evDef: 0,
      evSpa: 0,
      evSpd: 0,
      evSpe: 0,
      hpPercent: 100,
      conditions: {},
      moveConditions: {},
      itemConditions: {},
      natures: {
        def: 1.0,
        spd: 1.0,
      },
    },
    weather: environment.weather ?? "none",
    terrain: environment.terrain ?? "none",
    fairyAura: false,
    wonderRoom: false,
    gravity: false,
    screens: environment.screens ?? { reflect: false, lightScreen: false, auroraVeil: false },
    isDoubles: environment.isDoubles ?? true,
    isCrit: environment.isCrit ?? false,
  };

  const probe0 = resolveDamageInput(probeCtx);
  if (!probe0) {
    return { achieved: false, best: null, fallback: null };
  }
  const probeDefCtx: ResolveContext = {
    ...probeCtx,
    defender: {
      ...probeCtx.defender,
      evDef: 32,
    },
  };
  const probeDef = resolveDamageInput(probeDefCtx);
  const targetsDef = probeDef?.defense !== probe0.defense;

  const maxH = Math.min(pool - minB - minD, MAX_EV_PER_STAT);

  for (let evH = minH; evH <= maxH; evH++) {
    const H = calcHp(defenderBase.baseStats.hp, evH);

    const maxDefStat = targetsDef
      ? Math.min(pool - evH - minD, MAX_EV_PER_STAT)
      : Math.min(pool - evH - minB, MAX_EV_PER_STAT);

    const minDefStat = targetsDef ? minB : minD;

    for (let evTarget = minDefStat; evTarget <= maxDefStat; evTarget++) {
      const evB = targetsDef ? evTarget : minB;
      const evD = targetsDef ? minD : evTarget;

      const B = calcStatus(defenderBase.baseStats.def, evB, defMultiplier);
      const D = calcStatus(defenderBase.baseStats.spd, evD, spdMultiplier);

      const resolveCtx: ResolveContext = {
        attacker,
        defender: {
          identifier: defenderBase.identifier,
          move: null,
          ability: defenderBase.ability ?? null,
          item: defenderBase.item ?? null,
          boosts: {},
          evHp: evH,
          evAtk: 0,
          evDef: evB,
          evSpa: 0,
          evSpd: evD,
          evSpe: 0,
          hpPercent: 100,
          conditions: {},
          moveConditions: {},
          itemConditions: {},
          natures: {
            def: defMultiplier,
            spd: spdMultiplier,
          },
        },
        weather: environment.weather ?? "none",
        terrain: environment.terrain ?? "none",
        fairyAura: false,
        wonderRoom: false,
        gravity: false,
        screens: environment.screens ?? { reflect: false, lightScreen: false, auroraVeil: false },
        isDoubles: environment.isDoubles ?? true,
        isCrit: environment.isCrit ?? false,
      };

      const damageInput = resolveDamageInput(resolveCtx);
      if (!damageInput) continue;

      const damageOutput = await calculate(damageInput);
      // rolls は16個の昇順ダメージ
      // 耐える条件: damage < H
      const survivingRolls = damageOutput.rolls.filter((dmg) => dmg < H).length;
      const totalUsed = evH + evB + evD;

      const candidate: SurvivalCandidate = {
        evs: { hp: evH, def: evB, spd: evD },
        totalUsed,
        survivingRolls,
        survivalRate: survivingRolls / 16,
        maxDamage: damageOutput.max,
        hpStat: H,
        defStat: B,
        spdStat: D,
      };

      if (survivingRolls >= minRollsRequired) {
        if (!bestCandidate) {
          bestCandidate = candidate;
        } else if (candidate.totalUsed < bestCandidate.totalUsed) {
          bestCandidate = candidate;
        } else if (candidate.totalUsed === bestCandidate.totalUsed) {
          const currentBulk =
            (2 * candidate.hpStat * candidate.defStat * candidate.spdStat) /
            (candidate.defStat + candidate.spdStat);
          const bestBulk =
            (2 * bestCandidate.hpStat * bestCandidate.defStat * bestCandidate.spdStat) /
            (bestCandidate.defStat + bestCandidate.spdStat);
          if (currentBulk > bestBulk) {
            bestCandidate = candidate;
          }
        }
        // この evH においてこれ以上防御努力値を増やしても totalUsed が増えるだけなので break
        break;
      } else {
        if (!bestFallback) {
          bestFallback = candidate;
        } else if (candidate.survivingRolls > bestFallback.survivingRolls) {
          bestFallback = candidate;
        } else if (
          candidate.survivingRolls === bestFallback.survivingRolls &&
          candidate.totalUsed < bestFallback.totalUsed
        ) {
          bestFallback = candidate;
        }
      }
    }
  }

  return {
    achieved: bestCandidate !== null,
    best: bestCandidate,
    fallback: bestFallback,
  };
}

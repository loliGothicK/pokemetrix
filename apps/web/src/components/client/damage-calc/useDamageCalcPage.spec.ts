/**
 * useDamageCalcPage.spec.ts
 *
 * テスト対象:
 *   1. DamageInput 組み立てに使うモディファイア解決ロジック
 *   2. ステータス計算の正しさ
 *   3. EN/JA 翻訳キーの完全性
 */

import { describe, it, expect } from "vitest";
import {
  weatherModifier,
  stabModifier,
  screenModifier,
  spreadModifier,
  isPhysicalCategory,
  M,
} from "@/lib/damage";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { moveByIdentifier } from "@/data/moves";
import { calcHp, calcStatus } from "@/data/utility/training";
import enTranslation from "@locales/en/translation.json";
import jaTranslation from "@locales/ja/translation.json";

describe("DamageCalcPage — modifier resolution", () => {
  it("resolves STAB for Incineroar using Flare Blitz", () => {
    const pokemon = championsPokemonByIdentifier.get("incineroar")!;
    const move = moveByIdentifier.get("flare-blitz")!;
    expect(stabModifier(pokemon.types, move.type)).toBe(M.STAB);
  });

  it("resolves no STAB for Incineroar using U-turn", () => {
    const pokemon = championsPokemonByIdentifier.get("incineroar")!;
    const move = moveByIdentifier.get("u-turn")!;
    expect(stabModifier(pokemon.types, move.type)).toBe(M.NEUTRAL);
  });

  it("resolves weather boost for rain + Water move", () => {
    expect(weatherModifier("rain", "water")).toBe(M.WEATHER_BOOST);
  });

  it("resolves weather penalty for rain + Fire move", () => {
    expect(weatherModifier("rain", "fire")).toBe(M.WEATHER_PENALTY);
  });

  it("resolves screen in doubles (Reflect, physical)", () => {
    expect(screenModifier({ reflect: true }, true, true)).toBe(M.SCREEN_DOUBLES);
  });

  it("screen is neutral when crit", () => {
    expect(screenModifier({ reflect: true }, true, true, { isCrit: true })).toBe(M.NEUTRAL);
  });

  it("resolves spread modifier for doubles", () => {
    expect(spreadModifier(true)).toBe(M.SPREAD);
    expect(spreadModifier(false)).toBe(M.NEUTRAL);
  });

  it("correctly identifies physical category", () => {
    expect(isPhysicalCategory("physical")).toBe(true);
    expect(isPhysicalCategory("special")).toBe(false);
    expect(isPhysicalCategory("status")).toBe(false);
  });
});

describe("DamageCalcPage — stat resolution", () => {
  it("correctly resolves Incineroar physical attack (no EV, no nature)", () => {
    const pokemon = championsPokemonByIdentifier.get("incineroar")!;
    // status = [hp, atk, def, spa, spd, spe]
    // calcStatus(base, ev) = floor((base + ev + 20) * 1.0) for neutral nature
    const atkStat = calcStatus(pokemon.status[1], 0);
    expect(atkStat).toBe(Math.floor((pokemon.status[1] + 0 + 20) * 1.0));
  });

  it("correctly resolves Incineroar physical attack with max EV", () => {
    const pokemon = championsPokemonByIdentifier.get("incineroar")!;
    const atkStat = calcStatus(pokemon.status[1], 32);
    expect(atkStat).toBe(Math.floor((pokemon.status[1] + 32 + 20) * 1.0));
    // Should be higher than no-EV
    expect(atkStat).toBeGreaterThan(calcStatus(pokemon.status[1], 0));
  });

  it("correctly resolves defender HP", () => {
    const pokemon = championsPokemonByIdentifier.get("venusaur")!;
    // calcHp(base, ev) = base + ev + 75
    const hp = calcHp(pokemon.status[0], 0);
    expect(hp).toBe(pokemon.status[0] + 0 + 75);
  });

  it("correctly resolves defender HP with max EV", () => {
    const pokemon = championsPokemonByIdentifier.get("venusaur")!;
    const hp = calcHp(pokemon.status[0], 32);
    expect(hp).toBe(pokemon.status[0] + 32 + 75);
    expect(hp).toBeGreaterThan(calcHp(pokemon.status[0], 0));
  });
});

describe("DamageCalcPage — move data correctness", () => {
  it("Flare Blitz is physical Fire with power > 0", () => {
    const move = moveByIdentifier.get("flare-blitz")!;
    expect(move.type).toBe("fire");
    expect(move.category).toBe("physical");
    expect(move.power).toBeGreaterThan(0);
  });

  it("Moonblast is special Fairy with power > 0", () => {
    const move = moveByIdentifier.get("moonblast")!;
    expect(move.type).toBe("fairy");
    expect(move.category).toBe("special");
    expect(move.power).toBeGreaterThan(0);
  });

  it("Protect is status (should be excluded from calc)", () => {
    const move = moveByIdentifier.get("protect")!;
    expect(move.category).toBe("status");
  });
});

describe("damageCalc translation keys — EN/JA completeness", () => {
  const enKeys = Object.keys(
    (enTranslation as Record<string, unknown>)["damageCalc"] as Record<string, unknown>,
  );
  const jaKeys = Object.keys(
    (jaTranslation as Record<string, unknown>)["damageCalc"] as Record<string, unknown>,
  );

  it("EN and JA have the same keys", () => {
    expect(enKeys.sort()).toEqual(jaKeys.sort());
  });

  it("all keys have non-empty values in EN", () => {
    const section = (enTranslation as Record<string, unknown>)["damageCalc"] as Record<
      string,
      string
    >;
    for (const key of enKeys) {
      expect(section[key], `EN key "${key}" should be non-empty`).not.toBe("");
    }
  });

  it("all keys have non-empty values in JA", () => {
    const section = (jaTranslation as Record<string, unknown>)["damageCalc"] as Record<
      string,
      string
    >;
    for (const key of jaKeys) {
      expect(section[key], `JA key "${key}" should be non-empty`).not.toBe("");
    }
  });
});

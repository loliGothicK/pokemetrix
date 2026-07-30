import { championsPokemonList } from "@/data/champions-pokemon";
import { moveById } from "@/data/moves";
import { abilityById } from "@/data/abilities";
import { describe, expect, it } from "vitest";
import { moves as enMoves } from "../../public/locales/en/translation.json";
import { moves as jaMoves } from "../../public/locales/ja/translation.json";
import { abilities as enAbilities } from "../../public/locales/en/translation.json";
import { abilities as jaAbilities } from "../../public/locales/ja/translation.json";

// 1. 安全なデータ抽出: 存在しないIDがあれば、ここで除外するか明示的にエラーにする
const moves = [...new Set(championsPokemonList.flatMap((poke) => poke.moves))].map((id) => {
  const move = moveById.get(id);
  if (!move) throw new Error(`Move ID ${id} is missing in moveById data.`);
  return move.identifier;
});

describe("en: move.name for all available moves", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(moves)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(enMoves as Record<string, { name?: string }>).toHaveProperty([identifier, "name"]);
  });
});

describe("en: move.effect for all available moves", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(moves)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(enMoves as Record<string, { effect?: string }>).toHaveProperty([identifier, "effect"]);
  });
});

describe("ja: move.name for all available moves", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(moves)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(jaMoves as Record<string, { name?: string }>).toHaveProperty([identifier, "name"]);
  });
});

describe("ja: move.effect for all available moves", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(moves)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(jaMoves as Record<string, { effect?: string }>).toHaveProperty([identifier, "effect"]);
  });
});

const abilities = [...new Set(championsPokemonList.flatMap((poke) => poke.abilities))].map((id) => {
  const ability = abilityById.get(id);
  if (!ability) throw new Error(`Move ID ${ability} is missing in moveById data.`);
  return ability.identifier;
});

describe("en: move.name for all available abilities", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(abilities)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(enAbilities as Record<string, { name?: string }>).toHaveProperty([identifier, "name"]);
  });
});

describe("en: move.effect for all available abilities", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(abilities)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(enAbilities as Record<string, { effect?: string }>).toHaveProperty([identifier, "effect"]);
  });
});

describe("ja: move.name for all available abilities", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(abilities)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(jaAbilities as Record<string, { name?: string }>).toHaveProperty([identifier, "name"]);
  });
});

describe("ja: move.effect for all available abilities", () => {
  // 2. プリミティブ配列のためのプレースホルダー (%s) を使用
  it.concurrent.for(abilities)("%s", (identifier) => {
    // 3. 型アサーションと toHaveProperty で一度に検証
    expect(jaAbilities as Record<string, { effect?: string }>).toHaveProperty([identifier, "effect"]);
  });
});

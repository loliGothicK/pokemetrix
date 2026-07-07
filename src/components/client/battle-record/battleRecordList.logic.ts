import type { BattleRecord } from "@/store/battle-record/battleRecord";

/**
 * 自軍の全スラグ一覧と、選出インデックスのセットを返す。
 * mySelection が空の場合は全員選出扱いとして null を返す。
 */
export function resolveMyTeamDisplay(record: Pick<BattleRecord, "myTeam" | "mySelection">): {
  slugs: readonly string[];
  selectedIndices: ReadonlySet<number> | null;
} {
  const slugs = record.myTeam.map((m) => m.identifier);
  const selectedIndices =
    record.mySelection && record.mySelection.length > 0
      ? (new Set(record.mySelection) as ReadonlySet<number>)
      : null;
  return { slugs, selectedIndices };
}

/**
 * 相手の全スラグ一覧（slotIndex 順）と、選出インデックスのセットを返す。
 * selectionRole が1つも付いていない場合は全員選出扱いとして null を返す。
 */
export function resolveOpponentDisplay(record: Pick<BattleRecord, "opponents">): {
  slugs: readonly string[];
  selectedIndices: ReadonlySet<number> | null;
} {
  const sorted = [...record.opponents].sort((a, b) => a.slotIndex - b.slotIndex);
  const slugs = sorted.map((o) => o.pokemonSlug);
  const hasSelection = sorted.some((o) => o.selectionRole !== null);
  const selectedIndices = hasSelection
    ? (new Set(
        sorted.reduce<number[]>((acc, o, i) => {
          if (o.selectionRole !== null) acc.push(i);
          return acc;
        }, []),
      ) as ReadonlySet<number>)
    : null;
  return { slugs, selectedIndices };
}

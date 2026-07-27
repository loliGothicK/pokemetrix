import { teamSchema } from "@/lib/validator/team";
import { itemById } from "@/data/items";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunction = (key: string, defaultValue?: any) => string;

/**
 * teamSchema.safeParse の結果から、人間が読みやすいエラー文字列の配列を生成する。
 * - スロット番号ではなくポケモン名を使用する
 * - アイテム ID ではなくアイテム名を使用する
 */
export function formatTeamValidationIssues(
  result: ReturnType<typeof teamSchema.safeParse>,
  t: TFunction,
  members: readonly ({ identifier: string; item: number | null } | null)[],
): string[] {
  if (result.success) return [];

  return result.error.issues.map((issue) => {
    const path = issue.path;

    if (path.length >= 2 && path[0] === "members" && typeof path[1] === "number") {
      const slotIndex = path[1] as number;
      const member = members[slotIndex];

      // ポケモン名（翻訳キー: pokemon.{identifier}.name）
      const pokemonName = member
        ? t(`pokemon.${member.identifier}.name`, member.identifier)
        : `Slot ${slotIndex + 1}`;

      const field = path.slice(2).join("/");

      // "item" フィールドのエラーはアイテム ID をアイテム名に変換する
      if (field === "item" && member?.item !== null && member?.item !== undefined) {
        const itemIdentifier = itemById.get(member.item)?.identifier;
        const itemName = itemIdentifier
          ? t(`items.${itemIdentifier}.name`, itemIdentifier)
          : String(member.item);
        return `${pokemonName}: ${itemName} — ${issue.message.replace(/Duplicate item found: \d+\.?\s*/, "")}`;
      }

      return field
        ? `${pokemonName}: ${field} — ${issue.message}`
        : `${pokemonName}: ${issue.message}`;
    }

    return issue.message;
  });
}

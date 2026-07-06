import { match } from "ts-pattern";
import type { BattleFormat, OpponentSelectionRole } from "@/store/battle-record/battleRecord";

/** チームメンバー1体の選出状態 */
export type MemberSelectionState = "unused" | "back" | "lead";

/** フォーマット別の選出上限 */
export interface SelectionLimits {
  /** 後発として選出できる最大数（ダブル=4, シングル=3） */
  readonly maxBack: number;
  /** 先発（active）数（ダブル=2, シングル=1） */
  readonly leadCount: number;
}

export const selectionLimits = (format: BattleFormat): SelectionLimits =>
  match(format)
    .with("doubles", () => ({ maxBack: 4, leadCount: 2 }))
    .with("singles", () => ({ maxBack: 3, leadCount: 1 }))
    .exhaustive();

/**
 * 選出状態。leads=先発、backs=後発（いずれも myTeam の index）。
 * 保存時は [...leads, ...backs] の順で my_selection に格納する。
 */
export interface Selection {
  readonly leads: readonly number[];
  readonly backs: readonly number[];
}

export const emptySelection: Selection = { leads: [], backs: [] };

export const memberState = (selection: Selection, index: number): MemberSelectionState => {
  if (selection.leads.includes(index)) return "lead";
  if (selection.backs.includes(index)) return "back";
  return "unused";
};

/** 選出済みの総数（先発+後発） */
export const backCount = (selection: Selection): number =>
  selection.leads.length + selection.backs.length;

const without = (arr: readonly number[], index: number): number[] => arr.filter((i) => i !== index);

/**
 * unused → back → lead → unused の順で状態を進める。
 * - unused: 選出上限に達していなければ後発として追加
 * - back: 先発に空きがあれば先発へ昇格、満杯なら選出解除
 * - lead: 選出解除
 */
export const cycleMember = (
  selection: Selection,
  index: number,
  format: BattleFormat,
): Selection => {
  const limits = selectionLimits(format);
  return match(memberState(selection, index))
    .with("unused", () =>
      backCount(selection) >= limits.maxBack
        ? selection
        : { ...selection, backs: [...selection.backs, index] },
    )
    .with("back", () =>
      selection.leads.length < limits.leadCount
        ? { leads: [...selection.leads, index], backs: without(selection.backs, index) }
        : { ...selection, backs: without(selection.backs, index) },
    )
    .with("lead", () => ({ ...selection, leads: without(selection.leads, index) }))
    .exhaustive();
};

/** API 保存用: leads を先頭にした index 配列（空なら null） */
export const selectionToIndices = (selection: Selection): number[] | null => {
  const combined = [...selection.leads, ...selection.backs];
  return combined.length > 0 ? combined : null;
};

/** API 読み込み用: 先頭 leadCount 件を先発として復元 */
export const selectionFromIndices = (
  indices: readonly number[] | null,
  format: BattleFormat,
): Selection => {
  if (!indices || indices.length === 0) return emptySelection;
  const { leadCount } = selectionLimits(format);
  return { leads: indices.slice(0, leadCount), backs: indices.slice(leadCount) };
};

/** 相手個体の選出状態（他個体の現在数を除いた集計） */
export interface OpponentRoleCounts {
  /** 選出済み（先発+後発）の数 */
  readonly back: number;
  /** 先発の数 */
  readonly leads: number;
}

/**
 * 相手個体の選出役割を null(選出外) → back(後発) → lead(先発) → null の順で進める。
 * counts は「この個体を除いた」現在の選出数。上限を超える遷移はスキップする。
 */
export const cycleOpponentRole = (
  role: OpponentSelectionRole | null,
  counts: OpponentRoleCounts,
  format: BattleFormat,
): OpponentSelectionRole | null => {
  const limits = selectionLimits(format);
  return match(role)
    .with(null, () => (counts.back < limits.maxBack ? ("back" as const) : null))
    .with("back", () => (counts.leads < limits.leadCount ? ("lead" as const) : null))
    .with("lead", () => null)
    .exhaustive();
};

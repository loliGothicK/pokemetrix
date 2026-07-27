import { atom } from "jotai";
import { activeSlotIndexAtom } from "./team";
import { linter, LintResult } from "@/lib/linter/linter";
import type { Team } from "./team";

export const MAX_EV_PER_STAT = 32;
export const MAX_EV_TOTAL = 66;

// チームを受け取ってlint結果を返すatom factory
export const makeTeamLintIssuesAtom = (team: Team | undefined) =>
  atom<readonly LintResult[]>(() => {
    if (!team) return [];
    return team.members.map(linter);
  });

export const activeSlotLintIssueAtom = (lintIssues: readonly LintResult[]) =>
  atom<LintResult | undefined>((get) => {
    const slotIdx = get(activeSlotIndexAtom);
    if (lintIssues.length === 0) return undefined;
    return lintIssues[slotIdx];
  });

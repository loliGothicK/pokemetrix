import { atom } from "jotai";
import { activeSlotIndexAtom } from "./team";
import { linter, LintResult } from "@/lib/linter/linter";
import type { Team } from "./team";

export const MAX_EV_TOTAL = 32 * 2 + 2;

// チームを受け取ってlint結果を返すatom factory
export const makeTeamLintIssuesAtom = (team: Team | undefined) =>
  atom<LintResult[]>(() => {
    if (!team) return [];
    return team.members.map(linter);
  });

export const activeSlotLintIssueAtom = (lintIssues: LintResult[]) =>
  atom<LintResult | undefined>((get) => {
    const slotIdx = get(activeSlotIndexAtom);
    if (lintIssues.length === 0) return undefined;
    return lintIssues[slotIdx];
  });

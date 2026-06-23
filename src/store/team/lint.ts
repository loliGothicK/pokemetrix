import { atom } from "jotai";
import { activeSlotIndexAtom, activeTeamIdAtom, localTeamsAtom } from "./team";
import { linter, LintResult } from "@/lib/linter/linter";

export const MAX_EV_TOTAL = 32 * 2 + 2;

export const activeTeamLintIssuesAtom = atom<LintResult[]>((get) => {
  const teams = get(localTeamsAtom);
  const teamId = get(activeTeamIdAtom);
  if (!teamId) return [];

  const targetTeam = teams.find((team) => team.id === teamId);
  if (!targetTeam) return [];

  // 無駄な無名関数やインデックス渡しが消滅し、純粋なマッピングになる
  return targetTeam.members.map(linter);
});

export const activeSlotLintIssueAtom = atom<LintResult | undefined>((get) => {
  const slotIdx = get(activeSlotIndexAtom);
  const issues = get(activeTeamLintIssuesAtom);

  if (issues.length === 0) {
    return undefined;
  }

  return issues[slotIdx];
});

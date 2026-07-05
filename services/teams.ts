// services/teams.ts (フロントエンドで実行される)
import { Team } from "@/store/team/team";

const LOCAL_STORAGE_KEY = "pokemon_teams";

// ─── ログイン時：APIルート経由でサーバー（Supabase）へ ───────────────────

export const fetchTeamsFromServer = async (): Promise<Team[]> => {
  const res = await fetch("/api/teams");
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
};

export const saveTeamsToServer = async (teams: Team[]): Promise<void> => {
  await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(teams),
  });
};

export const deleteTeamFromServer = async (teamId: string): Promise<void> => {
  const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete team");
};

// ─── 未ログイン時：localStorage ──────────────────────────────────────────

export const fetchTeamsFromLocal = (): Team[] => {
  if (typeof window === "undefined") return [];
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  return localData ? (JSON.parse(localData) as Team[]) : [];
};

export const saveTeamsToLocal = (teams: Team[]): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teams));
};

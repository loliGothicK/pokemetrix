// services/teams.ts (フロントエンドで実行される)
import { Team } from "@/store/team/team";

export const fetchTeamsFromServer = async (): Promise<Team[]> => {
  const res = await fetch("/api/teams");
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json() as Promise<Team[]>;
};

export const saveTeamsToServer = async (teams: Team[]): Promise<void> => {
  const res = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(teams),
  });
  if (!res.ok) throw new Error("Failed to save teams");
};

export const deleteTeamFromServer = async (teamId: string): Promise<void> => {
  const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete team");
};

// services/teams.ts (フロントエンドで実行される)
import { Team } from "@/store/team/team";

const LOCAL_STORAGE_KEY = "pokemon_teams";

export const fetchTeams = async (isAuthenticated: boolean): Promise<Team[]> => {
  if (isAuthenticated) {
    // ログイン済み：ここで初めて、"本当の" Next.js API Route を叩く
    const res = await fetch("/api/teams");
    if (!res.ok) throw new Error("Failed to fetch teams");
    return res.json();
  } else {
    // 未ログイン：ローカルストレージから取得（非同期APIのふりをする）
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return localData ? JSON.parse(localData) : [];
  }
};

export const saveTeam = async (isAuthenticated: boolean, teams: Team[]): Promise<void> => {
  if (isAuthenticated) {
    // ログイン済み："本当の" Next.js API Route にPOSTする
    await fetch("/api/teams", {
      method: "POST",
      body: JSON.stringify(teams),
    });
  } else {
    // 未ログイン：ローカルストレージに保存
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teams));
  }
};

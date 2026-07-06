// services/seasons.ts (フロントエンドで実行される)
import type { Season, SeasonInput, SeasonUpdate } from "@/store/battle-record/battleRecord";

export const fetchSeasonsFromServer = async (): Promise<readonly Season[]> => {
  const res = await fetch("/api/seasons");
  if (!res.ok) throw new Error("Failed to fetch seasons");
  return res.json() as Promise<readonly Season[]>;
};

export const createSeasonOnServer = async (input: SeasonInput): Promise<Season> => {
  const res = await fetch("/api/seasons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create season");
  return res.json() as Promise<Season>;
};

export const updateSeasonOnServer = async (id: string, input: SeasonUpdate): Promise<Season> => {
  const res = await fetch(`/api/seasons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update season");
  return res.json() as Promise<Season>;
};

export const deleteSeasonFromServer = async (id: string): Promise<void> => {
  const res = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete season");
};

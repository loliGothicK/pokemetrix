// services/battleRecords.ts (フロントエンドで実行される)
import type {
  BattleRecord,
  BattleRecordInput,
  BattleRecordUpdate,
} from "@/store/battle-record/battleRecord";

export const fetchBattleRecordsFromServer = async (filter?: {
  readonly seasonId?: string;
  readonly teamId?: string;
}): Promise<readonly BattleRecord[]> => {
  const params = new URLSearchParams();
  if (filter?.seasonId) params.set("seasonId", filter.seasonId);
  if (filter?.teamId) params.set("teamId", filter.teamId);
  const query = params.toString();
  const res = await fetch(`/api/battle-records${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch battle records");
  return res.json() as Promise<readonly BattleRecord[]>;
};

export const fetchBattleRecordFromServer = async (id: string): Promise<BattleRecord> => {
  const res = await fetch(`/api/battle-records/${id}`);
  if (!res.ok) throw new Error("Failed to fetch battle record");
  return res.json() as Promise<BattleRecord>;
};

export const createBattleRecordOnServer = async (
  input: BattleRecordInput,
): Promise<BattleRecord> => {
  const res = await fetch("/api/battle-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create battle record");
  return res.json() as Promise<BattleRecord>;
};

export const updateBattleRecordOnServer = async (
  id: string,
  input: BattleRecordUpdate,
): Promise<BattleRecord> => {
  const res = await fetch(`/api/battle-records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update battle record");
  return res.json() as Promise<BattleRecord>;
};

export const deleteBattleRecordFromServer = async (id: string): Promise<void> => {
  const res = await fetch(`/api/battle-records/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete battle record");
};

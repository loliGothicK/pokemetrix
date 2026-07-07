// services/box.ts (フロントエンドで実行される)
import type { TrainedPokemon } from "@/store/team/team";

export const fetchBoxFromServer = async (): Promise<readonly TrainedPokemon[]> => {
  const res = await fetch("/api/box");
  if (!res.ok) throw new Error("Failed to fetch box");
  return res.json() as Promise<readonly TrainedPokemon[]>;
};

export const saveToBox = async (pokemon: TrainedPokemon): Promise<void> => {
  const res = await fetch("/api/box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pokemon),
  });
  if (!res.ok) throw new Error("Failed to save to box");
};

export const updateBoxPokemon = async (pokemon: TrainedPokemon): Promise<void> => {
  const res = await fetch(`/api/box/${pokemon.boxId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pokemon),
  });
  if (!res.ok) throw new Error("Failed to update box pokemon");
};

export const deleteFromBox = async (boxId: string): Promise<void> => {
  const res = await fetch(`/api/box/${boxId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete from box");
};

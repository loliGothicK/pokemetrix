"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { isAuthenticatedAtom } from "@/store/auth";
import { localTeamsAtom, type Team } from "@/store/team/team";
import { fetchTeamsFromServer, saveTeamsToServer } from "@services/teams";

export type MergeAction = "pick" | "drop";

export type MergeEntry = {
  id: string; // team.id
  team: Team;
  source: "local" | "server";
  action: MergeAction;
};

type AuthSyncResult = {
  isMergeOpen: boolean;
  mergeEntries: MergeEntry[];
  setMergeEntries: React.Dispatch<React.SetStateAction<MergeEntry[]>>;
  onMergeCommit: () => Promise<void>;
  onMergeCancel: () => void;
};

export const useAuthSync = (): AuthSyncResult => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const queryClient = useQueryClient();

  const prevIsAuthenticated = useRef(isAuthenticated);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [mergeEntries, setMergeEntries] = useState<MergeEntry[]>([]);

  useEffect(() => {
    const wasLoggedOut = !prevIsAuthenticated.current;
    const isNowLoggedIn = isAuthenticated;

    if (wasLoggedOut && isNowLoggedIn && localTeams.length > 0) {
      // ログイン直後：ローカルにチームがある場合のみ同期処理を開始
      void (async () => {
        const serverTeams = await queryClient.fetchQuery<Team[]>({
          queryKey: ["teams"],
          queryFn: fetchTeamsFromServer,
        });

        if (serverTeams.length === 0) {
          // サーバーにチームなし → そのままアップロードしてクリア
          await saveTeamsToServer(localTeams);
          await queryClient.invalidateQueries({ queryKey: ["teams"] });
          setLocalTeams([]);
        } else {
          // 双方にチームあり → マージダイアログを開く
          const entries: MergeEntry[] = [
            ...serverTeams.map((team) => ({
              id: team.id,
              team,
              source: "server" as const,
              action: "pick" as const,
            })),
            ...localTeams.map((team) => ({
              id: team.id,
              team,
              source: "local" as const,
              action: "pick" as const,
            })),
          ];
          setMergeEntries(entries);
          setIsMergeOpen(true);
        }
      })();
    }

    prevIsAuthenticated.current = isAuthenticated;
    // localTeams は依存に含めない（ログイン時の snapshot のみ使いたいため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const onMergeCommit = async () => {
    const picked = mergeEntries.filter((e) => e.action === "pick").map((e) => e.team);
    await saveTeamsToServer(picked);
    await queryClient.invalidateQueries({ queryKey: ["teams"] });
    setLocalTeams([]);
    setIsMergeOpen(false);
    setMergeEntries([]);
  };

  const onMergeCancel = () => {
    // ローカルデータはそのまま保持。ダイアログだけ閉じる。
    setIsMergeOpen(false);
    setMergeEntries([]);
  };

  return { isMergeOpen, mergeEntries, setMergeEntries, onMergeCommit, onMergeCancel };
};

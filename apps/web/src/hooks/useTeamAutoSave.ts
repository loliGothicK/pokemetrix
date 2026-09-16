import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { isAuthenticatedAtom } from "@/store/auth";
import { localTeamsAtom, Team } from "@/store/team/team";
import { teamSaveSchema } from "@/lib/validator/team";
import { saveTeamsToServer } from "@services/teams";

export const useTeamAutoSave = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || localTeams.length === 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const serverTeams = queryClient.getQueryData<readonly Team[]>(["teams"]) ?? [];
        const mergedTeams = [
          ...serverTeams.map((st) => localTeams.find((lt) => lt.id === st.id) ?? st),
          ...localTeams.filter((lt) => !serverTeams.some((st) => st.id === lt.id)),
        ];

        const validTeams = mergedTeams.filter((t) => teamSaveSchema.safeParse(t).success);
        if (validTeams.length === 0) return;

        await saveTeamsToServer(validTeams);
        queryClient.setQueryData(["teams"], validTeams);
        setLocalTeams((prev) => prev.filter((t) => !validTeams.some((vt) => vt.id === t.id)));
        void queryClient.invalidateQueries({ queryKey: ["teams"] });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isAuthenticated, localTeams, queryClient, setLocalTeams]);
};

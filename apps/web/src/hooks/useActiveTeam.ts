import { useAtom, useAtomValue } from "jotai";
import { atom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { isAuthenticatedAtom } from "@/store/auth";
import { localTeamsAtom, activeTeamIdAtom, Team, TrainedPokemon } from "@/store/team/team";

const HISTORY_LIMIT = 50;
const DEBOUNCE_MS = 500;

interface HistoryEntry {
  readonly past: readonly Team[];
  readonly future: readonly Team[];
}

export const teamHistoryAtom = atom<Map<string, HistoryEntry>>(new Map());

export const useActiveTeam = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const activeId = useAtomValue(activeTeamIdAtom);
  const queryClient = useQueryClient();
  const [historyMap, setHistoryMap] = useAtom(teamHistoryAtom);

  const lastEditTimeRef = useRef<number>(0);

  const serverTeams = queryClient.getQueryData<readonly Team[]>(["teams"]) ?? [];
  // serverTeams は毎レンダーで新しい参照を持つため ref でラップして deps を安定させる
  const serverTeamsRef = useRef(serverTeams);
  serverTeamsRef.current = serverTeams;

  const teams = isAuthenticated
    ? [
        ...serverTeams.map((st) => localTeams.find((lt) => lt.id === st.id) ?? st),
        ...localTeams.filter((lt) => !serverTeams.some((st) => st.id === lt.id)),
      ]
    : localTeams;

  const team = teams.find(({ id }) => id === activeId);

  const teamsRef = useRef(teams);
  teamsRef.current = teams;

  const getHistoryEntry = useCallback(
    (id: string): HistoryEntry => historyMap.get(id) ?? { past: [], future: [] },
    [historyMap],
  );

  const setHistoryEntry = useCallback(
    (id: string, entry: HistoryEntry) => {
      setHistoryMap((prev) => {
        const next = new Map(prev);
        next.set(id, entry);
        return next;
      });
    },
    [setHistoryMap],
  );

  const applyLocalUpdate = useCallback(
    (updater: (team: Team) => Team, skipHistory = false) => {
      if (!activeId) return;

      // teamsRef.current を使って updater の外で baseTeam を計算する。
      // setLocalTeams の updater 関数内で他の state setter (setHistoryEntry) を呼ぶのは
      // React の規則違反であり、historyMap の変更が canUndo/canRedo に伝播しない原因になる。
      const baseTeam = teamsRef.current.find((t) => t.id === activeId);
      if (!baseTeam) return;

      const updated = updater(baseTeam);

      // history 更新は setLocalTeams の外で行う
      if (!skipHistory) {
        const now = Date.now();
        const entry = getHistoryEntry(activeId);
        // デバウンス：前回編集からDEBOUNCE_MS以上経過していれば、現在の状態(baseTeam)をpastに保存
        if (now - lastEditTimeRef.current > DEBOUNCE_MS) {
          // structuredClone で深いコピーを取ることで、コンポーネント側でのミューテーション
          // (moves 配列の直接書き換え等) が過去のスナップショットを汚染するのを防ぐ。
          // moves / evs / nature 等すべてのネストされた参照型に対して統一的に有効。
          const newPast = [...entry.past, structuredClone(baseTeam)].slice(-HISTORY_LIMIT);
          setHistoryEntry(activeId, { past: newPast, future: [] });
        }
        lastEditTimeRef.current = now;
      }

      // サーバーデータと完全一致する場合はlocalTeamsから除去（差分なし扱い）
      const serverTeam = serverTeamsRef.current.find((s) => s.id === activeId);
      const isClean = serverTeam && JSON.stringify(updated) === JSON.stringify(serverTeam);

      // setLocalTeams の updater は prev の読み取りのみ行う純粋な関数にする
      setLocalTeams((prev) => {
        if (isClean) return prev.filter((t) => t.id !== activeId);
        const hasLocal = prev.some((t) => t.id === activeId);
        if (hasLocal) return prev.map((t) => (t.id === activeId ? updated : t));
        return [...prev, updated];
      });
    },
    [activeId, setLocalTeams, getHistoryEntry, setHistoryEntry],
  );

  const updateSlot = useCallback(
    (slotIndex: number, trained: TrainedPokemon | null) => {
      applyLocalUpdate((t) => ({
        ...t,
        members: t.members.map((m, i) => (i === slotIndex ? trained : m)),
      }));
    },
    [applyLocalUpdate],
  );

  const updateTeamName = useCallback(
    (name: string) => {
      applyLocalUpdate((t) => ({ ...t, name }));
    },
    [applyLocalUpdate],
  );

  const reorderMembers = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      applyLocalUpdate((t) => {
        const next = [...t.members];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return { ...t, members: next };
      });
    },
    [applyLocalUpdate],
  );

  const undo = useCallback(() => {
    if (!activeId) return;
    const entry = getHistoryEntry(activeId);
    if (entry.past.length === 0) return;

    const current = teamsRef.current.find((t) => t.id === activeId);
    if (!current) return;

    const newPast = [...entry.past];
    const target = newPast.pop()!;
    // current をそのまま保存すると、以降のミューテーションで future が汚染されるため deep copy する
    const newFuture = [structuredClone(current), ...entry.future].slice(0, HISTORY_LIMIT);

    // undoした直後の編集は別バーストとして扱うためにリセット
    lastEditTimeRef.current = 0;
    setHistoryEntry(activeId, { past: newPast, future: newFuture });
    applyLocalUpdate(() => target, true);
  }, [activeId, getHistoryEntry, setHistoryEntry, applyLocalUpdate]);

  const redo = useCallback(() => {
    if (!activeId) return;
    const entry = getHistoryEntry(activeId);
    if (entry.future.length === 0) return;

    const current = teamsRef.current.find((t) => t.id === activeId);
    if (!current) return;

    const newFuture = [...entry.future];
    const target = newFuture.shift()!;
    // current をそのまま保存すると、以降のミューテーションで past が汚染されるため deep copy する
    const newPast = [...entry.past, structuredClone(current)].slice(-HISTORY_LIMIT);

    // redoした直後の編集は別バーストとして扱うためにリセット
    lastEditTimeRef.current = 0;
    setHistoryEntry(activeId, { past: newPast, future: newFuture });
    applyLocalUpdate(() => target, true);
  }, [activeId, getHistoryEntry, setHistoryEntry, applyLocalUpdate]);

  const canUndo = activeId ? getHistoryEntry(activeId).past.length > 0 : false;
  const canRedo = activeId ? getHistoryEntry(activeId).future.length > 0 : false;

  return [team, updateSlot, updateTeamName, reorderMembers, undo, redo, canUndo, canRedo] as const;
};

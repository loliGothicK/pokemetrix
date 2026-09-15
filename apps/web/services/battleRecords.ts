import type {
  BattleRecord,
  BattleRecordInput,
  BattleRecordUpdate,
} from "@/store/battle-record/battleRecord";
import { withSpan } from "@/lib/otel";
import * as Sentry from "@sentry/nextjs";

export const fetchBattleRecordsFromServer = async (filter?: {
  readonly seasonId?: string;
  readonly teamId?: string;
}): Promise<readonly BattleRecord[]> => {
  return withSpan("ui.battleRecords.fetchList", async (span) => {
    const params = new URLSearchParams();
    if (filter?.seasonId) params.set("seasonId", filter.seasonId);
    if (filter?.teamId) params.set("teamId", filter.teamId);
    const query = params.toString();
    const res = await fetch(`/api/battle-records${query ? `?${query}` : ""}`);
    if (!res.ok) {
      const errorText = await res.text();
      span.setAttribute("error", true);
      Sentry.captureException(new Error("Failed to fetch battle records"), {
        extra: { status: res.status, errorText, filter },
      });
      throw new Error(`Failed to fetch battle records: ${errorText}`);
    }
    return res.json() as Promise<readonly BattleRecord[]>;
  });
};

export const fetchBattleRecordFromServer = async (id: string): Promise<BattleRecord> => {
  return withSpan("ui.battleRecords.fetchOne", async (span) => {
    const res = await fetch(`/api/battle-records/${id}`);
    if (!res.ok) {
      const errorText = await res.text();
      span.setAttribute("error", true);
      Sentry.captureException(new Error("Failed to fetch battle record"), {
        extra: { status: res.status, errorText, id },
      });
      throw new Error(`Failed to fetch battle record: ${errorText}`);
    }
    return (await res.json()) as Promise<BattleRecord>;
  });
};

export const createBattleRecordOnServer = async (
  input: BattleRecordInput,
): Promise<BattleRecord> => {
  return withSpan("ui.battleRecords.create", async (span) => {
    const res = await fetch("/api/battle-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errorText = await res.text();
      span.setAttribute("error", true);
      let errorMsg = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error) {
          errorMsg = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
        }
      } catch {
        // ignore
      }
      Sentry.captureException(new Error("Failed to create battle record"), {
        extra: { status: res.status, errorText, input },
      });
      throw new Error(`Failed to create battle record: ${errorMsg}`);
    }
    return (await res.json()) as Promise<BattleRecord>;
  });
};

export const updateBattleRecordOnServer = async (
  id: string,
  input: BattleRecordUpdate,
): Promise<BattleRecord> => {
  return withSpan("ui.battleRecords.update", async (span) => {
    const res = await fetch(`/api/battle-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errorText = await res.text();
      span.setAttribute("error", true);
      let errorMsg = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error) {
          errorMsg = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
        }
      } catch {
        // ignore
      }
      Sentry.captureException(new Error("Failed to update battle record"), {
        extra: { status: res.status, errorText, id, input },
      });
      throw new Error(`Failed to update battle record: ${errorMsg}`);
    }
    return (await res.json()) as Promise<BattleRecord>;
  });
};

export const deleteBattleRecordFromServer = async (id: string): Promise<void> => {
  return withSpan("ui.battleRecords.delete", async (span) => {
    const res = await fetch(`/api/battle-records/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const errorText = await res.text();
      span.setAttribute("error", true);
      Sentry.captureException(new Error("Failed to delete battle record"), {
        extra: { status: res.status, errorText, id },
      });
      throw new Error(`Failed to delete battle record: ${errorText}`);
    }
  });
};

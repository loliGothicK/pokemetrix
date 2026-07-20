// services/dashboards.ts (フロントエンドで実行される)
import type { Dashboard, DashboardInput, DashboardUpdate } from "@/store/dashboard/dashboard";
import { withSpan } from "@/lib/otel";
import * as Sentry from "@sentry/nextjs";

export const fetchDashboardsFromServer = async (): Promise<readonly Dashboard[]> => {
  return withSpan("ui.dashboards.fetch-all", async (span) => {
    const res = await fetch("/api/dashboards");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Failed to fetch dashboards: ${text}`);
      Sentry.captureException(err, { extra: { status: res.status } });
      span.setAttribute("error", true);
      throw err;
    }
    return res.json() as Promise<readonly Dashboard[]>;
  }, { op: "http.client" });
};

export const fetchDashboardFromServer = async (id: string): Promise<Dashboard> => {
  return withSpan("ui.dashboards.fetch-one", async (span) => {
    span.setAttribute("dashboard.id", id);
    const res = await fetch(`/api/dashboards/${id}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Failed to fetch dashboard: ${text}`);
      Sentry.captureException(err, { extra: { dashboardId: id, status: res.status } });
      span.setAttribute("error", true);
      throw err;
    }
    return res.json() as Promise<Dashboard>;
  }, { op: "http.client" });
};

export const createDashboardOnServer = async (input: DashboardInput): Promise<Dashboard> => {
  return withSpan("ui.dashboards.create", async (span) => {
    const res = await fetch("/api/dashboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Failed to create dashboard: ${text}`);
      Sentry.captureException(err, { extra: { input, status: res.status } });
      span.setAttribute("error", true);
      throw err;
    }
    return res.json() as Promise<Dashboard>;
  }, { op: "http.client" });
};

export const updateDashboardOnServer = async (
  id: string,
  input: DashboardUpdate,
): Promise<Dashboard> => {
  return withSpan("ui.dashboards.update", async (span) => {
    span.setAttribute("dashboard.id", id);
    const res = await fetch(`/api/dashboards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Failed to update dashboard: ${text}`);
      Sentry.captureException(err, { extra: { dashboardId: id, input, status: res.status } });
      span.setAttribute("error", true);
      throw err;
    }
    return res.json() as Promise<Dashboard>;
  }, { op: "http.client" });
};

export const deleteDashboardFromServer = async (id: string): Promise<void> => {
  return withSpan("ui.dashboards.delete", async (span) => {
    span.setAttribute("dashboard.id", id);
    const res = await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Failed to delete dashboard: ${text}`);
      Sentry.captureException(err, { extra: { dashboardId: id, status: res.status } });
      span.setAttribute("error", true);
      throw err;
    }
  }, { op: "http.client" });
};


// services/dashboards.ts (フロントエンドで実行される)
import type { Dashboard, DashboardInput, DashboardUpdate } from "@/store/dashboard/dashboard";

export const fetchDashboardsFromServer = async (): Promise<readonly Dashboard[]> => {
  const res = await fetch("/api/dashboards");
  if (!res.ok) throw new Error("Failed to fetch dashboards");
  return res.json() as Promise<readonly Dashboard[]>;
};

export const fetchDashboardFromServer = async (id: string): Promise<Dashboard> => {
  const res = await fetch(`/api/dashboards/${id}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json() as Promise<Dashboard>;
};

export const createDashboardOnServer = async (input: DashboardInput): Promise<Dashboard> => {
  const res = await fetch("/api/dashboards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create dashboard");

  return res.json() as Promise<Dashboard>;
};

export const updateDashboardOnServer = async (
  id: string,
  input: DashboardUpdate,
): Promise<Dashboard> => {
  const res = await fetch(`/api/dashboards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update dashboard");
  return res.json() as Promise<Dashboard>;
};

export const deleteDashboardFromServer = async (id: string): Promise<void> => {
  const res = await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete dashboard");
};

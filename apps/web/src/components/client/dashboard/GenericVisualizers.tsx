"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export { HeatmapVisualizer } from "./HeatmapVisualizer";

import { DataGrid, GridColDef } from "@mui/x-data-grid";
export function TableVisualizer({ data }: { readonly data: readonly Record<string, unknown>[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
        {t("dashboard.visualize.noData", "No data")}
      </Typography>
    );
  }

  const firstRow = data[0] ?? {};
  const columns: GridColDef[] = Object.keys(firstRow).map((col) => ({
    field: col,
    headerName: t(`dashboard.dataKeys.${col}`, { defaultValue: col }) as string,
    flex: 1,
    minWidth: 100,
  }));

  // DataGrid requires a unique 'id' for each row
  const rows = useMemo(() => {
    return data.map((row, index) => {
      if (!row || typeof row !== "object") {
        return { id: index };
      }
      const hasValidId = "id" in row && (typeof row.id === "string" || typeof row.id === "number");
      return hasValidId ? row : { ...row, id: index };
    });
  }, [data]);

  return (
    <Box sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        density="compact"
        disableRowSelectionOnClick
        hideFooter
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": {
            borderColor: "divider",
          },
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "background.paper",
            borderColor: "divider",
          },
        }}
      />
    </Box>
  );
}

export function StatVisualizer({ data }: { readonly data: readonly Record<string, unknown>[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
        {t("dashboard.visualize.noData", "No data")}
      </Typography>
    );
  }

  const firstRow = data[0];
  const keys = Object.keys(firstRow ?? {});
  const mainKey = keys[0];
  const mainValue = mainKey ? firstRow[mainKey] : "—";

  const subKeys = keys.slice(1);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100%",
        p: 2,
        containerType: "inline-size",
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: "clamp(2rem, 15cqw, 3rem)",
          }}
        >
          {String(mainValue)}
        </Typography>
      </Box>

      {subKeys.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 1.5,
            rowGap: 0.5,
            mt: 1.5,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {subKeys.map((k) => (
            <Box key={k} sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t(`dashboard.dataKeys.${k}`, { defaultValue: k })}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {String((firstRow[k] as string | number | boolean) ?? "—")}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export function GaugeVisualizer({ data }: { readonly data: readonly Record<string, unknown>[] }) {
  // Simple textual gauge for now
  return <StatVisualizer data={data} />;
}

export function HistogramVisualizer({
  data,
}: {
  readonly data: readonly Record<string, unknown>[];
}) {
  // Simple fallback for histogram (uses Table for now)
  return <TableVisualizer data={data} />;
}

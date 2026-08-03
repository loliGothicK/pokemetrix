"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export { HeatmapVisualizer } from "./HeatmapVisualizer";

import { format, parseISO, isValid } from "date-fns";
import { ja, enUS } from "date-fns/locale";

function getLocaleObj(language: string) {
  return language.startsWith("ja") ? ja : enUS;
}

const isIsoDateString = (val: unknown): val is string => {
  return (
    typeof val === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/.test(val)
  );
};

import { DataGrid, GridColDef } from "@mui/x-data-grid";

export function TableVisualizer({ data }: { readonly data: readonly Record<string, unknown>[] }) {
  const { t, i18n } = useTranslation();

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
        {t("dashboard.visualize.noData")}
      </Typography>
    );
  }

  const firstRow = data[0] ?? {};

  const columns: GridColDef[] = Object.keys(firstRow).map((col) => {
    const isDate = firstRow[col] instanceof Date || isIsoDateString(firstRow[col]);
    return {
      field: col,
      headerName: t(`dashboard.dataKeys.${col}`, { defaultValue: col }) as string,
      flex: 1,
      minWidth: 100,
      valueFormatter: isDate
        ? (value: any) => {
            const dateObj =
              value instanceof Date ? value : isIsoDateString(value) ? parseISO(value) : null;
            if (dateObj && isValid(dateObj)) {
              return format(dateObj, "yyyy/MM/dd HH:mm", { locale: getLocaleObj(i18n.language) });
            }
            return value;
          }
        : undefined,
    };
  });

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

function formatStatValue(val: unknown, language: string): string {
  const dateObj = val instanceof Date ? val : isIsoDateString(val) ? parseISO(val) : null;
  if (dateObj && isValid(dateObj)) {
    return format(dateObj, "yyyy/MM/dd HH:mm", { locale: getLocaleObj(language) });
  }
  return String((val as string | number | boolean) ?? "—");
}

export function StatVisualizer({ data }: { readonly data: readonly Record<string, unknown>[] }) {
  const { t, i18n } = useTranslation();

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
        {t("dashboard.visualize.noData")}
      </Typography>
    );
  }

  const firstRow = data[0];
  const keys = Object.keys(firstRow ?? {});
  const mainKey = keys[0];
  const mainValue = mainKey ? formatStatValue(firstRow[mainKey], i18n.language) : "—";

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
          {mainValue}
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
                {formatStatValue(firstRow[k], i18n.language)}
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

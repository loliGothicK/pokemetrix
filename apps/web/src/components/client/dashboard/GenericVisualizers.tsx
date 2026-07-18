"use client";

import { useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { rounded } from "@/utils/styles";

export function TableVisualizer({ data }: { readonly data: readonly Record<string, unknown>[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
        {t("dashboard.visualize.noData", "No data")}
      </Typography>
    );
  }

  const columns = Object.keys(data[0] ?? {});

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      variant="outlined"
      sx={{ height: "100%", overflow: "auto", ...rounded(2) }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 600 }}>
                {t(`dashboard.dataKeys.${col}`, { defaultValue: col })}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col}>{String(row[col] ?? "")}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
        height: "100%",
        p: 2,
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {mainKey && (
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t(`dashboard.dataKeys.${mainKey}`, { defaultValue: mainKey })}
          </Typography>
        )}
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          {String(mainValue)}
        </Typography>
      </Box>

      {subKeys.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          {subKeys.map((k) => (
            <Box key={k} sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t(`dashboard.dataKeys.${k}`, { defaultValue: k })}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {String(firstRow[k] ?? "—")}
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

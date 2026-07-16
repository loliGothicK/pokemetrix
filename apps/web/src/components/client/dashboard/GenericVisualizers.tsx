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
      sx={{ height: "100%", overflow: "auto" }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 600 }}>
                {col}
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
  const firstKey = Object.keys(firstRow ?? {})[0];
  const value = firstKey ? firstRow[firstKey] : "—";

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
      {firstKey && (
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          {firstKey}
        </Typography>
      )}
      <Typography variant="h3" sx={{ fontWeight: 800 }}>
        {String(value)}
      </Typography>
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

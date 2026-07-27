"use client";

import { Box, Typography } from "@mui/material";
import type { BoxProps } from "@mui/material";
import type { ReactNode } from "react";
import { emptyStateCenter } from "@/theme/sx";

export interface EmptyStateProps extends Omit<BoxProps, "children"> {
  readonly message: ReactNode;
}

/**
 * 一覧が空のときに中央揃えで表示するメッセージ。
 * `sx` を渡すと差分として上書き・追記できる。
 */
export function EmptyState({ message, sx, ...rest }: EmptyStateProps) {
  return (
    <Box sx={[emptyStateCenter, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

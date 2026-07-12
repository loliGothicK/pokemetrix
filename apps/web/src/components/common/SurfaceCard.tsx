"use client";

import { Paper } from "@mui/material";
import type { PaperProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { surfaceCard } from "@/theme/sx";

export interface SurfaceCardProps extends PaperProps {
  /** `background.paperRaised` を使う（浮き上がったパネル用）。既定は `background.paper`。 */
  readonly raised?: boolean;
  readonly borderRadius?: number;
}

/**
 * 枠線 + 角丸 + 背景色の「カード表面」を持つ Paper。
 * 複数のページ・ダイアログで繰り返し使われる見た目を共通化したもの。
 * `sx` を渡すと差分として上書き・追記できる。
 */
export function SurfaceCard({
  raised,
  borderRadius,
  elevation = 0,
  sx,
  ...rest
}: SurfaceCardProps) {
  const theme = useTheme();
  return (
    <Paper
      elevation={elevation}
      sx={[surfaceCard(theme, { raised, borderRadius }), ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
}

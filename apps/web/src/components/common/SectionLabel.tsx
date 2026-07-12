"use client";

import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import { sectionLabel } from "@/theme/sx";

export interface SectionLabelProps extends TypographyProps {}

/**
 * overline的な見出しラベル(太字 + letterSpacing + secondaryカラー)。
 * サイドメニューの見出しやフォームのセクション見出しで繰り返し使われる見た目を共通化したもの。
 */
export function SectionLabel({ variant = "overline", sx, ...rest }: SectionLabelProps) {
  return (
    <Typography
      variant={variant}
      sx={[sectionLabel, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
}

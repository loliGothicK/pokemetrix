import { useTheme } from "@mui/material/styles";
import { SvgIcon } from "@mui/material";
import { ComponentProps } from "react";

type PokemetrixIconProps = {
  readonly sx?: NonNullable<ComponentProps<typeof SvgIcon>["sx"]>;
};

export default function PokemetrixIcon({
  sx = {
    width: 200,
    height: 200,
  },
}: PokemetrixIconProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ダーク: 明るいインク (#c8d8f0) / ライト: 深いネイビー (#2c2c54)
  const inkColor = isDark ? "#c8d8f0" : "#2c2c54";
  // アクセントカラーはモードによって彩度を調整
  const accentColor = isDark ? "#7dd8e0" : "#66C5D0";

  return (
    <SvgIcon sx={sx}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* 外周リング — ダーク側弧 */}
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke={inkColor}
          strokeWidth="12"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="64.4 35.6"
          strokeDashoffset="0"
          transform="rotate(-90 100 100)"
        />
        {/* 外周リング — アクセント弧 */}
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke={accentColor}
          strokeWidth="12"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="27.6 72.4"
          strokeDashoffset="-68.4"
          transform="rotate(-90 100 100)"
        />

        <defs>
          {/* ユニーク ID でページ内の衝突を防ぐ */}
          <mask id="pokemetrix-bar-mask">
            <circle cx="100" cy="100" r="100" fill="white" />
            <circle cx="100" cy="100" r="36" fill="black" />
          </mask>
        </defs>

        {/* 棒グラフバー */}
        <rect x="47" y="55" width="16" height="33" fill={accentColor} />
        <rect
          x="77"
          y="35"
          width="16"
          height="48"
          fill={accentColor}
          mask="url(#pokemetrix-bar-mask)"
        />
        <rect
          x="107"
          y="45"
          width="16"
          height="38"
          fill={accentColor}
          mask="url(#pokemetrix-bar-mask)"
        />
        <rect x="137" y="65" width="16" height="23" fill={accentColor} />

        {/* 水平の基準線 */}
        <line
          x1="34.873"
          y1="100.794"
          x2="165.374"
          y2="100.197"
          stroke={inkColor}
          strokeWidth="11.865"
          strokeLinecap="round"
          strokeDasharray="40.4 60.4"
          strokeDashoffset="6"
        />

        {/* 中央のポークボール風リング */}
        <circle cx="100" cy="100" r="24" fill="none" stroke={inkColor} strokeWidth="12" />
        <circle cx="100" cy="100" r="8" fill={inkColor} />
      </svg>
    </SvgIcon>
  );
}

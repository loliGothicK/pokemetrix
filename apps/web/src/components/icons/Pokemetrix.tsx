import { SvgIcon } from "@mui/material";
import { SystemCssProperties } from "@mui/system";

type PokemetrixIconProps = {
  readonly sx?: SystemCssProperties;
};

export default function PokemetrixIcon({
  sx = {
    width: 200,
    height: 200,
  },
}: PokemetrixIconProps) {
  return (
    <SvgIcon
      sx={{
        ...sx,
        "--ink-color": "#2c2c54",
        "--accent-color": "#66C5D0",
        '[data-mui-color-scheme="dark"] &': {
          "--ink-color": "#c8d8f0",
          "--accent-color": "#7dd8e0",
        },
      }}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* 外周リング — ダーク側弧 */}
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="var(--ink-color)"
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
          stroke="var(--accent-color)"
          strokeWidth="12"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="27.6 72.4"
          strokeDashoffset="-68.4"
          transform="rotate(-90 100 100)"
        />

        {/* 棒グラフバー */}
        <rect x="47" y="55" width="16" height="33" rx="6" fill="var(--accent-color)" />
        <rect x="77" y="35" width="16" height="48" rx="6" fill="var(--accent-color)" />
        <rect x="107" y="45" width="16" height="38" rx="6" fill="var(--accent-color)" />
        <rect x="137" y="65" width="16" height="23" rx="6" fill="var(--accent-color)" />

        {/* 水平の基準線 */}
        <line
          x1="34.873"
          y1="100.794"
          x2="165.374"
          y2="100.197"
          stroke="var(--ink-color)"
          strokeWidth="11.865"
          strokeLinecap="round"
          strokeDasharray="40.4 60.4"
          strokeDashoffset="6"
        />

        {/* 中央のポークボール風リング */}
        <circle cx="100" cy="100" r="24" fill="none" stroke="var(--ink-color)" strokeWidth="12" />
        <circle cx="100" cy="100" r="8" fill="var(--ink-color)" />
      </svg>
    </SvgIcon>
  );
}

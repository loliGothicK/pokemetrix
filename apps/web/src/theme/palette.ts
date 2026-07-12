// MUI の標準 Palette / PaletteOptions を拡張し、アプリ独自の色キーワードを追加する。
// 参考: https://mui.com/material-ui/customization/palette/#custom-colors
declare module "@mui/material/styles" {
  interface TypeBackground {
    /** canvas のグラデーション用セカンダリ背景色 */
    defaultAlt: string;
    /** surface より一段明るい／濃いパネル背景（オーバーレイ・浮き上がったカード用） */
    paperRaised: string;
    /** 半透明のティント背景（ガラス風のヒーローカード等） */
    paperTint: string;
  }

  interface Palette {
    /** divider よりもブランドカラーに寄せた、やや弱い区切り線 */
    dividerSoft: string;
  }

  interface PaletteOptions {
    dividerSoft?: string;
  }
}

export const brandColors = {
  primary: "#1565c0",
  secondary: "#00897b",
} as const;

export const lightPalette = {
  background: {
    default: "#f3f6fb",
    defaultAlt: "#eef3f8",
    paper: "#ffffff",
    paperRaised: "rgba(255, 255, 255, 0.96)",
    paperTint: "rgba(255, 255, 255, 0.86)",
  },
  divider: "rgba(15, 23, 42, 0.12)",
  dividerSoft: "rgba(21, 101, 192, 0.12)",
  text: {
    primary: "#0f172a",
  },
} as const;

export const darkPalette = {
  background: {
    default: "#050816",
    defaultAlt: "#0b1220",
    paper: "#0d1427",
    paperRaised: "rgba(17, 24, 39, 0.92)",
    paperTint: "rgba(17, 24, 39, 0.88)",
  },
  divider: "rgba(148, 163, 184, 0.18)",
  dividerSoft: "rgba(96, 165, 250, 0.18)",
  text: {
    primary: "#e5eefb",
  },
} as const;

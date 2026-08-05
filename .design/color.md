# Colour Technique

## Basics

- base colour
  - White or Black
- main colour (brand colour)
  - Faux Camaïeu
- accent colour
  - Split Complimentary

## Theme Implementation (MUI v5 Palette Augmentation)

### 背景

以前は `appPalette` という独自オブジェクト (`src/theme/palette.ts`) を作り、`getAppPalette(mode)` を各コンポーネントで呼び出して `palette.surface` / `palette.edge` / `palette.glowPrimary` のように参照していた。
MUI の `theme.palette` とは完全に独立した並行の型・値だったため、`useTheme()` の `theme.palette` と `getAppPalette(mode)` の2系統を毎回セットで呼ぶ必要があり、コードが煩雑になっていた。

参考: [MUI v5 Theme ～基本の使い方からカスタマイズまで～](https://zenn.dev/longbridge/articles/c100d0311ed1be) / [MUI公式 Theming](https://mui.com/material-ui/customization/theming/) の手法に倣い、
`PaletteOptions` の module augmentation で MUI 標準の `theme.palette` に統合する。

### 方針

`appPalette` の各キーを、MUI 標準パレットのキーへ統合、または `declare module` で `PaletteOptions`/`Palette` を拡張して追加する。

| 旧 (`appPalette` / `getAppPalette(mode)`) | 新 (`theme.palette.*`) | 対応方法 |
| --- | --- | --- |
| `brand.primary` | `primary.main` | 標準キーにそのまま設定 |
| `brand.secondary` | `secondary.main` | 標準キーにそのまま設定 |
| `canvas` | `background.default` | 標準キーにそのまま設定 |
| `canvasAlt` | `background.defaultAlt` | `PaletteOptions.TypeBackground` を拡張 |
| `surface` | `background.paper` | 標準キーにそのまま設定 |
| `surfaceRaised` | `background.paperRaised` | `PaletteOptions.TypeBackground` を拡張 |
| `surfaceTint` | `background.paperTint` | `PaletteOptions.TypeBackground` を拡張 |
| `edge` | `divider` | 標準キーにそのまま設定 |
| `edgeSoft` | `dividerSoft` | `PaletteOptions` を拡張（`Palette`直下） |
| `glowPrimary` | — | 廃止。`alpha(theme.palette.primary.main, x)` を呼び出し側で都度生成 |
| `glowSecondary` | — | 廃止。`alpha(theme.palette.secondary.main, x)` を呼び出し側で都度生成 |
| `ink` | `text.primary` | 標準キーにそのまま設定 |
| `iconShadow` | — | 未使用のため削除 |

### 実装箇所

- `apps/web/src/theme/palette.ts`: light/dark それぞれの拡張パレット値定義（`declare module` の型拡張を含む）はここに残すが、`getAppPalette` 関数と `appPalette` エクスポートは廃止。
- `../apps/web/src/theme/theme.ts`: `createTheme()` にライト/ダーク両方の全パレット値を渡す。`cssVariables: true` を使っているため、ダークモード用の値は `colorSchemes.dark.palette` に渡す（MUI v5 の CSS変数モードの標準的な書き方）。
- 呼び出し側: `const palette = getAppPalette(theme.palette.mode)` の行を削除し、`theme.palette.background.paper` 等に直接置き換える。`useTheme()` のみで完結させる。

### 移行の注意

- `cssVariables: true` を使っているため、ライト/ダークは `createTheme({ colorSchemes: { light: {...}, dark: {...} } })` の形で両方渡す一体型の theme を作り、`mode` に応じた `createAppTheme(mode)` の呼び分けは撤廃する方向が MUI の CSS変数モードの推奨形。ただし既存の「トグルで appTheme を作り直す」実装を大きく壊さないよう、今回は `createAppTheme(mode)` の関数形は維持しつつ内部で `palette` に両モード分の値を渡す形にする。

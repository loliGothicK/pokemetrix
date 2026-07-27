# sx共通化方針

## 背景

MUI の `sx` prop をコンポーネント内にインラインで書き続けた結果、特に以下のファイルで
同じ形の長い `sx={{ ... }}` が何度も繰り返され、JSX の可読性が落ちていた。

- `apps/web/src/components/client/share/PokemonBuildCard.tsx`（37箇所）
- `apps/web/src/components/client/team-builder/training.tsx`（52箇所）
- `apps/web/src/components/client/team-builder/MovesDrawer.tsx`（50箇所）
- `apps/web/src/components/client/battle-record/BattleRecordPage.tsx`（43箇所）
- `apps/web/src/components/client/damage-calc/ResultPanel.tsx`（42箇所）
- `apps/web/src/components/client/team-builder/index.tsx`（41箇所）
- `apps/web/src/components/client/layout.tsx`（36箇所）
- `apps/web/src/components/client/battle-record/BattleAnalyticsPage.tsx`（25箇所）

代表的な重複パターンを調査した結果、次の7種が繰り返し登場することが分かった。

| # | パターン | 内容 | 主な出現箇所 |
| --- | --- | --- | --- |
| 1 | `surfaceCard` | `border:"1px solid", borderColor:divider, borderRadius, bgcolor:paper系` のカード表面 | BattleAnalyticsPage, BattleRecordList, PokemonBuildCard, overview.tsx, PokemonPanel |
| 2 | `flexRowCenter` | `display:"flex", alignItems:"center"`（Stackの`alignItems:"center"`含む） | ほぼ全ファイル |
| 3 | `sectionLabel` | overline的な `fontWeight:700-800, letterSpacing, color:text.secondary` | layout.tsx, BattleRecordFormDialog, BattleRecordPage |
| 4 | `emptyStateCenter` | `textAlign:"center", py:8` の空状態表示 | BattleAnalyticsPage, BattleRecordList |
| 5 | `truncateText` | `overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"` | PokemonBuildCard の MoveChip 等 |
| 6 | `iconButtonBordered` | 枠線+背景色付きの丸型IconButton | layout.tsx 内に同一定義が2回重複 |
| 7 | ローカルの小コンポーネント | `TooltipContent`（PokemonBuildCard内）等、ファイル内で複数回使うJSX断片 | PokemonBuildCard |

## 方針

### 1. 定数化 vs コンポーネント化の判断基準

- **同一コンポーネントの中でしか使わないが繰り返される** → ファイル内の `const` / 小さな内部関数コンポーネントに分離（例: 既存の `PokemonBuildCard.tsx` 内 `TooltipContent`, `StatRow` はこの形の良い前例）。
- **複数ファイルで繰り返し登場するスタイル値** → `src/theme/sx.ts` に **sx断片を返すファクトリ関数** として定義し、必要な箇所で `...surfaceCard(theme)` のようにスプレッドして使う。
  - MUIの `sx` はテーマに依存する値（`theme.palette.divider` 等）を含むことが多いため、単純なオブジェクト定数ではなく `(theme: Theme) => SxProps<Theme>` 形式の関数にする。
  - 呼び出し側で追加のスタイルを重ねる場合は `sx={{ ...surfaceCard(theme), mt: 2 }}` のように**差分だけ追記**する。丸ごと再定義しない。
- **見た目・振る舞いを持つUI要素として複数ファイルで繰り返し使われるもの** → `src/components/common/` に実コンポーネントとして切り出す（例: `SurfaceCard`, `SectionLabel`, `EmptyState`）。propsで差分を上書きできるようにする。

### 2. 配置場所

- `apps/web/src/theme/sx.ts` — テーマ依存のsx断片ファクトリ関数群。既存の `src/theme/palette.ts` と対になる場所に置く。
- `apps/web/src/components/common/` — 上記sx断片を内部で使う、複数機能で使い回す表示コンポーネント（`SurfaceCard.tsx`, `SectionLabel.tsx`, `EmptyState.tsx` など）。既存の `common/queryable-autocomplete/` と並列。

### 3. 命名規則

- ファクトリ関数は動詞を含まない名詞的な camelCase（`surfaceCard`, `flexRowCenter`, `truncateText`）。
- コンポーネント名は役割を表すPascalCase（`SurfaceCard`, `SectionLabel`, `EmptyState`）。

### 4. 適用範囲・進め方

一括で全ファイルを変えるのではなく、重複数が多く効果の高いファイルから順に適用する。
既存のロジック・見た目（レイアウト崩れ・配色変化なし）は変更しない、**純粋なリファクタリング**として行う。

適用順序:
1. `battle-record/`（BattleAnalyticsPage, BattleRecordPage, BattleRecordFormDialog, BattleRecordList, OpponentSlots, YourTeamSelector）
2. `share/`（PokemonBuildCard, PartySharePage, ShareButton）
3. `damage-calc/`（DamageCalcPage, PokemonPanel, ResultPanel）
4. `layout.tsx`, `Footer.tsx`
5. `team-builder/`（index.tsx, overview.tsx, slot-detail.tsx, training.tsx, MovesDrawer.tsx）

### 5. 生JSファイル禁止の遵守

新規追加するユーティリティ・コンポーネントはすべて `.ts` / `.tsx` で作成する。



## 実装結果

上記方針に基づき、以下を実装した。

- `apps/web/src/theme/sx.ts` — `surfaceCard`, `flexRowCenter`, `sectionLabel`, `emptyStateCenter`, `truncateText`, `iconButtonBordered` を実装。
- `apps/web/src/components/common/SurfaceCard.tsx` / `EmptyState.tsx` / `SectionLabel.tsx` — 上記sx断片をラップした共通コンポーネント。

適用範囲: `battle-record/`, `share/`, `damage-calc/`, `layout.tsx` / `Footer.tsx`, `team-builder/` の主要ファイル一式。

### 実装上の注意点

- MUIの `sx` prop は `SxProps<Theme>` 型で配列も許容するため、`{ ...a, ...b }` のオブジェクトスプレッドで外部から渡された `sx` prop と合成すると型エラーになる場合がある。共通コンポーネントの `sx` prop 合成では配列形式 `sx={[base, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}` を使うこと。ローカル変数同士（外部 props を含まない）のオブジェクトスプレッドは問題ない。
- `sectionLabel` は `fontWeight: 800` を既定値としているため、既存コードで `fontWeight: 700` だった箇所に適用する場合は `{ ...sectionLabel, fontWeight: 700 }` のように明示的に上書きし、見た目の差分が出ないようにすること。
- `emptyStateCenter` は `py: 8` を既定値としているため、既存コードで異なる `py` 値だった箇所は同様に上書きすること。

### 検証結果

- `tsc --noEmit`: 0エラー。
- `oxlint .`: 3件の警告が残るが、いずれも本リファクタリング対象外のファイル（`DamageCalcPage.tsx` の既存未使用import、`SelectPokemonDialog.tsx` の既存jsx-key警告）で、変更前から存在していたことを確認済み。
- `oxfmt`: 変更した全ファイルに適用済み。
- `vitest`: 一部テストスイートが `@pokemetrix/damage-calc`（Rustパッケージ未ビルド）および vitest config解決の既存環境問題で失敗するが、`git stash` で変更前の状態でも同じ失敗が再現することを確認済みであり、本リファクタリングとは無関係。

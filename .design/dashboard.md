# カスタマイズ可能ダッシュボード — Design Document

## 概要

Grafana のように、ユーザーが自由にウィジェット（パネル）を追加・削除・並べ替え・リサイズできる
ダッシュボード機能。表示するデータは既存の対戦記録（`battle_records` / `battle_record_opponents`）
から集計する指標群（勝率、対面ポケモン統計、先後別成績など）を再利用する。新しいデータ収集は行わず、
「既存データの見せ方をユーザーが編集できる」機能として位置づける。

## 設計方針

- **既存資産の再利用**: 集計ロジックは `src/store/battle-record/analytics.ts` の純粋関数
  （`tally` / `tallyByOrder` / `opponentStats` / `winRatePercent`）をそのまま使う。新規の集計が
  必要なウィジェット種別（後述）は同ファイルに追加する。
- **レイアウトの永続化**: ダッシュボードは複数個作成可能（Grafanaの「複数ダッシュボード」相当）。
  各ダッシュボードは `widgets: DashboardWidget[]`（種別・グリッド位置・サイズ・パラメータ）を
  jsonb で保持する。ウィジェット内部の表示データは保存時点のスナップショットではなく、
  常に最新の `battle_records` から再計算する（Grafanaのパネルがクエリを再実行するのと同じ考え方）。
- **D&D は既存依存で実現**: `@dnd-kit/core` + `@dnd-kit/sortable`（`training.tsx` の並べ替えで
  実績あり）を使い、新規ライブラリ（react-grid-layout 等）は追加しない。グリッドは固定列数
  （xs:1列 / md:4列 / lg:6列相当のレスポンシブ）+ 行高固定のシンプルなCSS Gridとし、
  ウィジェットは `w`（列数）×`h`（行数）で表現する。ピクセル単位の自由配置は行わない
  （Grafanaのフリーグリッドより単純化し、実装・モバイル対応コストを抑える）。
- **ウィジェットはシーズンに依存しないデータ範囲を選べる**: 各ウィジェットは自身の `seasonId`
  （null = 全シーズン統合）を持つ。ダッシュボード全体で1シーズンに固定しない
  （複数シーズンを並べて比較できるのがダッシュボードの価値）。

## データモデル

### dashboards

| カラム     | 型          | 制約                               | 備考                     |
| ---------- | ----------- | ----------------------------------- | ------------------------ |
| id         | ULID (uuid) | PK                                   |                          |
| user_id    | uuid        | FK → auth.users, NOT NULL, CASCADE  |                          |
| name       | text        | NOT NULL, 1〜100文字                | "S24 振り返り" 等        |
| is_default | boolean     | NOT NULL, default false             | ユーザーごとに1つまで既定 |
| layout     | jsonb       | NOT NULL, default '[]'              | `DashboardWidget[]`      |
| created_at | timestamptz | NOT NULL, default now()             |                          |
| updated_at | timestamptz | NOT NULL, default now()             |                          |

CHECK: `char_length(name) between 1 and 100`
CHECK: `jsonb_typeof(layout) = 'array'`

`is_default` は「ユーザーごとに1件だけtrue」をアプリ側（トランザクション内で他を false に更新）
で保証する。DBレベルの部分ユニーク制約（`unique index ... where is_default`）までは初期実装では
入れず、アプリ側の整合性維持で十分とする（将来的に壊れても実害が小さい表示上の既定値のため）。

### DashboardWidget（layout の要素、型のみ・テーブル分割しない）

ウィジェット1件は以下の形。個別テーブルにせず `dashboards.layout` の配列要素として持つ理由は、
並べ替え・追加・削除が常に「ダッシュボード全体を1回のPATCHで置換」する操作になり、
複数行の整合性（重複位置・欠番index）をアプリ側で扱うより単純だから。

```typescript
interface DashboardWidget {
  readonly id: string; // ULID。クライアントで生成
  readonly type: WidgetType;
  readonly title: string; // ユーザー編集可能な見出し。空文字ならtype既定名を表示
  readonly seasonId: string | null; // null = 全シーズン
  readonly x: number; // グリッド列位置（0始まり）
  readonly y: number; // グリッド行位置（0始まり）
  readonly w: number; // 列幅（グリッド列数の範囲内）
  readonly h: number; // 行高（行数）
  readonly options?: Record<string, unknown>; // ウィジェット種別ごとの追加設定（後述）
}

type WidgetType =
  | "winRateSummary" // 勝率 + W/L/D サマリー（StatCard相当）
  | "winRateTrend" // 試合順の勝率推移（折れ線 or 勝敗ドット列）
  | "orderSplit" // 先攻/後攻別勝率（既存 WinRateBar 相当）
  | "topOpponents" // 対面の多い相手ポケモン別成績（既存 topOpponents 相当）
  | "recentRecords" // 直近の対戦記録一覧（簡易版 BattleRecordList）
  | "ratingTrend" // レート推移（rating が入っている記録のみ）
  | "note"; // ユーザーがメモを書けるだけの静的パネル（Grafanaのtext panel相当）
```

`options` の使用例:

- `topOpponents`: `{ limit?: number }`（既定12件を上限変更）
- `note`: `{ body: string }`（Markdown不要、プレーンテキスト）

グリッド列数はブレークポイントごとに固定: xs=2, sm=4, md=6, lg=8。`w` は最大列数（lg基準の8）
までを許容し、狭い画面では `min(w, 現在の列数)` にクランプして表示する（保存値は変えない）。

## RLS ポリシー

既存パターンに準拠。

```sql
-- dashboards: SELECT / INSERT / UPDATE / DELETE すべて auth.uid() = user_id
```

## updated_at トリガー

既存の `set_updated_at()` を `dashboards` に適用。

## API エンドポイント

既存の `seasons` / `battle-records` と同じ認証パターン（`supabase.auth.getClaims()` → `user_id`
で絞り込み、RLSと二重防御）。

| メソッド | パス                  | 役割                                             |
| -------- | --------------------- | ------------------------------------------------ |
| GET      | `/api/dashboards`     | 自分のダッシュボード一覧（`created_at` 昇順）    |
| POST     | `/api/dashboards`     | ダッシュボード作成（既定は空 `layout: []`）      |
| GET      | `/api/dashboards/[id]`| ダッシュボード1件                                |
| PATCH    | `/api/dashboards/[id]`| 部分更新（`name` / `layout` / `isDefault`）      |
| DELETE   | `/api/dashboards/[id]`| ダッシュボード削除                               |

ウィジェットの表示データ（集計値）は専用APIを作らず、フロントで既存の
`useBattleRecords({ seasonId })` + `src/store/battle-record/analytics.ts` を呼び出して
クライアント側で計算する（`BattleAnalyticsPage` と同じアプローチ）。ダッシュボードが
複数シーズンのウィジェットを同時に持てるため、必要な `seasonId` の集合ごとに
`useBattleRecords` を呼ぶ（React Query のキャッシュにより同一 `seasonId` の重複フェッチは
自動的に共有される）。

## バリデーション・型

`src/store/dashboard/dashboard.ts` に配置（`battle-record` ディレクトリと並列）。

```typescript
export const widgetTypeSchema = z.enum([
  "winRateSummary",
  "winRateTrend",
  "orderSplit",
  "topOpponents",
  "recentRecords",
  "ratingTrend",
  "note",
]);

export const dashboardWidgetSchema = z.object({
  id: z.string().min(1),
  type: widgetTypeSchema,
  title: z.string().max(100),
  seasonId: z.string().min(1).nullable(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(8),
  h: z.number().int().min(1).max(12),
  options: z.record(z.string(), z.unknown()).optional(),
}).readonly();

export const dashboardInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
  layout: z.array(dashboardWidgetSchema).max(30).optional(),
}).readonly();

export const dashboardUpdateSchema = dashboardInputSchema.omit({ id: true }).partial().readonly();
```

`layout` 内 `id` の重複、`(x, y, w, h)` の重なりはサーバ側で強制検証しない
（表示上の見た目崩れのみで実害がないため。フロントのD&Dロジックが重なりを防ぐ）。

## UI

MUI + react-i18next（既存パターン）。配置は `src/components/client/dashboard/`。

- **一覧/切替**: ナビゲーション「統計」グループに「ダッシュボード」を追加（既存の
  `layout.tsx` の `sideMenuGroups`）。ページ内タブ or セレクトでダッシュボードを切り替え、
  「新規作成」「名前変更」「削除」「既定に設定」を提供。
- **編集モード / 表示モード**: 既定は表示モード（ドラッグ不可）。「編集」ボタンで
  編集モードに入り、ウィジェットの追加（種別選択ダイアログ）・ドラッグでの並べ替え
  （`@dnd-kit`）・リサイズ（ハンドルドラッグ、w/hをステップ変更）・削除・タイトル編集ができる。
  編集モード中の変更はローカル state に保持し、「保存」で1回の PATCH にまとめる
  （Grafanaの「Edit → Save dashboard」と同じフロー）。「破棄」で編集前の状態に戻す。
- **ウィジェットレンダラ**: `type` ごとに対応するコンポーネントを描画するマッピング
  （`WidgetRenderer.tsx`）。`winRateSummary` は既存 `BattleAnalyticsPage` の `StatCard` 相当、
  `topOpponents` / `orderSplit` は既存 `WinRateBar` 等の表示ロジックを部品として抽出し共用する
  （`BattleAnalyticsPage.tsx` からロジックを壊さない範囲で切り出す）。

## 実装スコープ

初期実装で行うこと:

1. スキーマ・マイグレーション（`dashboards` テーブル、RLS、トリガー）
2. Zod スキーマ・DTO（`src/store/dashboard/dashboard.ts`）
3. API ルート（`/api/dashboards`, `/api/dashboards/[id]`）
4. サービス層・React Query フック（`services/dashboards.ts`, `useDashboards.ts`）
5. 集計ロジック追加（`analytics.ts` に `winRateTrend` 用の時系列集計、`ratingTrend` 用の抽出関数）
6. UI（`/dashboard` ページ、ウィジェット追加・D&D並べ替え・リサイズ・削除、7種のウィジェット）
7. ナビゲーション配線

スコープ外（将来拡張）:

- ウィジェットの共有・埋め込み（Grafanaのpanel share相当）
- 自由配置グリッド（ピクセル単位ドラッグ）
- ダッシュボードのインポート/エクスポート（JSON）
- アラート・通知機能
- 独自クエリビルダー（現状は決められた7種のウィジェット種別のみ）

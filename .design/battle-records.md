# Battle Records — Design Document

## 概要

ポケモン対戦の試合結果を記録・分析する機能。
軽い入力で素早く記録し、あとから詳細を追記でき、統計分析に活用する。

## 設計方針

- **スナップショット主義**: 記録時点のチーム構成を jsonb で凍結。チーム編集後も過去記録は不変
- **段階入力**: 最小入力は「結果 + 相手6体の pokemon_slug」。持ち物・特性・技はあとから追記可能
- **分析最適**: 相手パーティを正規化した子テーブルに分離し、GROUP BY での集計を容易にする
- **BO1前提**: 1レコード = 1試合

## データモデル

### seasons

シーズン/レギュレーション管理。ユーザーごとに作成。

| カラム     | 型          | 制約                               | 備考                    |
| ---------- | ----------- | ---------------------------------- | ----------------------- |
| id         | ULID (uuid) | PK                                 |                         |
| user_id    | uuid        | FK → auth.users, NOT NULL, CASCADE |                         |
| name       | text        | NOT NULL, 1〜100文字               | "レギュレーションH S24" |
| format     | text        | NOT NULL                           | "singles" / "doubles"   |
| rule_mark  | text        | nullable                           | "regulation-h" etc.     |
| started_at | date        | nullable                           | シーズン開始日          |
| ended_at   | date        | nullable                           | シーズン終了日          |
| created_at | timestamptz | NOT NULL, default now()            |                         |
| updated_at | timestamptz | NOT NULL, default now()            |                         |

CHECK: `format in ('singles', 'doubles')`

### battle_records

対戦1試合。

| カラム          | 型          | 制約                               | 備考                                       |
| --------------- | ----------- | ---------------------------------- | ------------------------------------------ |
| id              | ULID (uuid) | PK                                 |                                            |
| user_id         | uuid        | FK → auth.users, NOT NULL, CASCADE |                                            |
| season_id       | ULID (uuid) | FK → seasons, NOT NULL, CASCADE    |                                            |
| team_id         | ULID (uuid) | FK → teams, nullable, SET NULL     | 記録に使ったチーム。削除時 null            |
| result          | text        | NOT NULL                           | "win" / "loss" / "draw"                    |
| my_team         | jsonb       | NOT NULL                           | TrainedPokemon[] スナップショット(最大6体) |
| my_selection    | smallint[]  | nullable                           | my_team内index。先頭 leadCount 件=先発     |
| first_or_second | text        | nullable                           | "first" / "second"（現UIでは未使用）       |
| rating          | integer     | nullable                           | 試合終了時点のレート（差分は算出）         |
| notes           | text        | nullable                           | 自由メモ                                   |
| played_at       | timestamptz | NOT NULL, default now()            | 対戦日時                                   |
| created_at      | timestamptz | NOT NULL, default now()            |                                            |
| updated_at      | timestamptz | NOT NULL, default now()            |                                            |

CHECK: `result in ('win', 'loss', 'draw')`
CHECK: `my_team` は jsonb array (`jsonb_typeof(my_team) = 'array'`)

### battle_record_opponents

相手パーティ。1試合につき最大6行。

| カラム           | 型          | 制約                                   | 備考                           |
| ---------------- | ----------- | -------------------------------------- | ------------------------------ |
| battle_record_id | ULID (uuid) | FK → battle_records, NOT NULL, CASCADE |                                |
| slot_index       | smallint    | NOT NULL, 0-5                          |                                |
| pokemon_slug     | text        | NOT NULL                               | 最小入力項目                   |
| item_slug        | text        | nullable                               | あとから追記                   |
| ability_slug     | text        | nullable                               | あとから追記                   |
| moves            | text[]      | nullable                               | 判明した技（可変長）           |
| selection_role   | text        | nullable                               | "lead" / "back" / null(選出外) |
| notes            | text        | nullable                               | 個体メモ                       |

PK: `(battle_record_id, slot_index)` 複合主キー
CHECK: `slot_index between 0 and 5`
CHECK: `selection_role in ('lead', 'back')` or null

## 選出の表現

### 自チーム — `my_selection: smallint[]`

`my_team` 配列内の index を「先発 → 後発」の順で格納。
先頭 `leadCount` 件（シングル=1, ダブル=2）が先発。

例（ダブル）: `[2, 0, 4]` → my_team[2] と my_team[0] が先発、my_team[4] が後発

UI（`selection.ts`）ではメンバーごとに 未選出 → 選出(後発) → 先発 をタップで循環させ、
保存時に `[...leads, ...backs]` へ直列化する。

### 相手チーム — `selection_role`

| 値       | 意味                                     |
| -------- | ---------------------------------------- |
| `null`   | 選出外（パーティにいたが出てこなかった） |
| `"lead"` | 先発                                     |
| `"back"` | 後発（裏）                               |

## RLS ポリシー

既存パターンに準拠。

### seasons, battle_records

```sql
-- SELECT / INSERT / UPDATE / DELETE すべて auth.uid() = user_id
```

### battle_record_opponents

```sql
-- 親テーブル battle_records の user_id を参照
EXISTS (SELECT 1 FROM battle_records r
        WHERE r.id = battle_record_id AND r.user_id = auth.uid())
```

## updated_at トリガー

既存の `set_updated_at()` 関数を再利用。`seasons` と `battle_records` に適用。
(`battle_record_opponents` は updated_at カラムを持たないため不要)

## 分析クエリ例

```sql
-- ポケモン別 遭遇率 & 勝率
SELECT
  o.pokemon_slug,
  COUNT(*) AS encounters,
  COUNT(*) FILTER (WHERE r.result = 'win') AS wins,
  ROUND(100.0 * COUNT(*) FILTER (WHERE r.result = 'win') / COUNT(*), 1) AS win_rate
FROM battle_record_opponents o
JOIN battle_records r ON r.id = o.battle_record_id
WHERE r.season_id = :season_id
GROUP BY o.pokemon_slug
ORDER BY encounters DESC;

-- 先発ポケモンの傾向
SELECT
  o.pokemon_slug,
  COUNT(*) AS lead_count,
  COUNT(*) FILTER (WHERE r.result = 'win') AS lead_wins
FROM battle_record_opponents o
JOIN battle_records r ON r.id = o.battle_record_id
WHERE o.selection_role = 'lead' AND r.season_id = :season_id
GROUP BY o.pokemon_slug
ORDER BY lead_count DESC;

-- 先攻/後攻別勝率
SELECT
  first_or_second,
  COUNT(*) AS games,
  COUNT(*) FILTER (WHERE result = 'win') AS wins,
  ROUND(100.0 * COUNT(*) FILTER (WHERE result = 'win') / COUNT(*), 1) AS win_rate
FROM battle_records
WHERE season_id = :season_id AND first_or_second IS NOT NULL
GROUP BY first_or_second;
```

## 実装状況

バックエンド（データモデル・RLS・API・サービス層）に加え、記録・分析UIも実装済み。

### スキーマ

`src/lib/db/schema.ts` に Drizzle テーブルとして定義。
`seasons` / `battleRecords` / `battleRecordOpponents` と、ドメイン型
`BattleFormat` / `BattleResult` / `FirstOrSecond` / `OpponentSelectionRole` を export。

### マイグレーション

- `drizzle/0003_battle_records.sql` — テーブル・CHECK制約・FK（`drizzle-kit generate` で生成）
- `drizzle/0004_battle_records_rls_and_triggers.sql` — RLSポリシーと `updated_at` トリガー（手書き、`0001` に準拠）
- `drizzle/0005_battle_records_team_and_rating.sql` — `battle_records.team_id`（FK→teams, SET NULL）と `rating` を追加

`pnpm db:migrate` で適用。

### API エンドポイント

すべて `supabase.auth.getClaims()` で認証し、`user_id` で絞り込む（RLSと二重防御）。

| メソッド | パス                                    | 役割                                                               |
| -------- | --------------------------------------- | ------------------------------------------------------------------ |
| GET      | `/api/seasons`                          | 自分のシーズン一覧                                                 |
| POST     | `/api/seasons`                          | シーズン作成                                                       |
| PATCH    | `/api/seasons/[id]`                     | シーズン部分更新                                                   |
| DELETE   | `/api/seasons/[id]`                     | シーズン削除                                                       |
| GET      | `/api/battle-records?seasonId=&teamId=` | 対戦記録一覧（`seasonId` / `teamId` で絞り込み、`played_at` 降順） |
| POST     | `/api/battle-records`                   | 対戦記録作成（相手をトランザクションで同時挿入）                   |
| GET      | `/api/battle-records/[id]`              | 対戦記録1件（相手含む）                                            |
| PATCH    | `/api/battle-records/[id]`              | 対戦記録部分更新（`opponents` 指定時は全置換）                     |
| DELETE   | `/api/battle-records/[id]`              | 対戦記録削除                                                       |

### バリデーション・型

`src/store/battle-record/battleRecord.ts` に Zod スキーマ（`seasonInputSchema` / `battleRecordInputSchema` ほか）と
DTO 型（`Season` / `BattleRecord` / `BattleRecordOpponent`）を定義。
テストは `src/store/battle-record/battleRecord.spec.ts`。

### サービス層（フロント用 fetch ラッパー）

- `services/seasons.ts`
- `services/battleRecords.ts`

### React Query hooks

- `src/hooks/useSeasons.ts` — シーズンの一覧取得と CRUD
- `src/hooks/useBattleRecords.ts` — シーズン単位の対戦記録の取得と CRUD

### 分析ロジック（純粋関数）

- `src/store/battle-record/analytics.ts` — 集計関数（`tally` / `tallyByOrder` / `opponentStats` / `winRatePercent`）。テスト `analytics.spec.ts`
- `src/components/client/battle-record/selection.ts` — 選出状態の純粋ロジック（`cycleMember` / `selectionLimits` / `selectionToIndices` / `selectionFromIndices`）。テスト `selection.spec.ts`
- `src/components/client/battle-record/formState.ts` — フォーム下書き ⇔ API 入力の変換。テスト `formState.spec.ts`

### UI

MUI + react-i18next（EN/JA）でレスポンシブ（xs/sm/md/lg）対応。`src/components/client/battle-record/`。

- **記録ページ** `/battle-record`（`BattleRecordPage`）
  - 左サイドバー: チーム選択（`useTeamsData`）と、そのパーティ（タイプ付き）を表示
  - シーズン選択・作成・編集・削除（`SeasonFormDialog`）
  - 統計バー（`StatsBar`）: 勝率 % / W・L・D / 勝敗バー / 試合数
  - フィルタタブ: すべて / 勝ち / 負け / 引き分け
  - 記録リスト（`BattleRecordList`）: 結果色の帯、日時・フォーマット、自軍 vs 相手のスプライト、
    直前記録とのレート差分（+/−）、メモ。行から編集・削除
  - 記録は選択中の `teamId` + `seasonId` で絞り込み
- **記録ダイアログ**（`BattleRecordFormDialog`）: 参考UIに沿う
  - 勝敗: 大きな W / L / D ボタン、`W` / `L` / `D` キーでも即入力。結果未選択の間は保存不可
  - 自チーム選出（`YourTeamSelector`）: アクティブチームのメンバーを事前表示。
    タップで 選出(後発) / 先発 / 未選出 を循環（フォーマット別の上限つき）
  - 相手チーム（`OpponentSlots`）: 空きスロットの + から種族を検索追加、
    先頭 leadCount 枠は先発表示。埋まったスロットをクリックで
    `OpponentDetailDialog` を開き、持ち物・特性・技・メモを **あとから追記**
  - フォーマット（シーズン）ドロップダウン、レート（絶対値）、対戦日時（既定=現在）、メモ
  - `Ctrl+S` / `⌘+S` で保存、`Esc` でキャンセル
  - 持ち物/特性/技の入力は `slugAutocomplete.tsx`（ローカライズ済みラベル + 候補数上限）
- **分析ページ（ダッシュボード）** `/battle-analytics`（`BattleAnalyticsPage`）
  - シーズン選択、全体勝率・勝敗数のサマリーカード
  - 先後別勝率、対面の多い相手ポケモン別成績（勝率バー）
- ナビゲーション（`layout.tsx`）の「対戦記録」→ `/battle-record`、
  「勝率インサイト」→ `/battle-analytics` を配線。

段階入力（設計方針の「軽い入力→あとから追記」）は、記録時は最小項目（勝敗+相手種族）のみ、
既存記録を再度開いて PATCH で詳細を追記できる形で実現している。

## 将来拡張（スコープ外）

- **テラスタイプ**: `battle_record_opponents` に `tera_type text` カラムをマイグレーションで追加
- BO3対応
- 対戦記録の共有機能
- リアルタイム対戦連携
- 選出（`my_selection` / `selection_role`）を軸にした高度な分析ビュー

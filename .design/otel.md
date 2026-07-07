# OpenTelemetry セットアップ設計

## 概要

`@sentry/nextjs` v10 は OpenTelemetry (OTel) を内部で自動的にセットアップする。追加のトレーサープロバイダーや `@vercel/otel` の導入は不要であり、**両者を同時に初期化すると競合する**。

## アーキテクチャ

```
┌──────────────────────────────────────────────┐
│  @sentry/nextjs (v10+)                        │
│                                              │
│  Sentry.init()                               │
│    └─ NodeTracerProvider (自動セットアップ)     │
│         ├─ SentrySpanProcessor               │
│         ├─ SentrySampler                     │
│         ├─ SentryPropagator                  │
│         └─ openTelemetryInstrumentations[]   │  ← 拡張ポイント
└──────────────────────────────────────────────┘
         ↑ OTel API で作成したスパンは自動的にここへ流れる
┌──────────────────────────────────────────────┐
│  src/lib/otel.ts (カスタムスパンヘルパー)       │
│    ├─ getTracer(name)                        │
│    ├─ withSpan(name, fn, attrs?)             │
│    └─ recordException(span, error)           │
└──────────────────────────────────────────────┘
```

## ファイル構成

| ファイル | 役割 |
|---|---|
| `sentry.server.config.ts` | Node.js runtime の Sentry + OTel 初期化。`openTelemetryInstrumentations` でサードパーティ計装を追加 |
| `sentry.edge.config.ts` | Edge runtime の Sentry 初期化（OTel 計装は Node 専用） |
| `instrumentation-client.ts` | クライアントサイドの Sentry 初期化（BrowserTracing は自動設定） |
| `instrumentation.ts` | Next.js instrumentation hook。runtime ごとに上記を呼び分け |
| `src/lib/otel.ts` | OTel API を使ったカスタムスパン用ユーティリティ |

## カスタムスパンの使い方

```ts
import { withSpan } from "@/lib/otel";

// 関数をスパンで囲む
const result = await withSpan(
  "pokemon.fetch-battle-records",
  async (span) => {
    span.setAttribute("pokemon.name", name);
    return fetchRecords(name);
  }
);
```

## 命名規則

OTel のスパン名は `<domain>.<operation>` の形式に統一する。

例:
- `pokemon.fetch-battle-records`
- `battle.calculate-stats`
- `supabase.query`

## 拡張: サードパーティ計装の追加方法

`sentry.server.config.ts` の `openTelemetryInstrumentations` 配列に追加する。

```ts
import { GenericPoolInstrumentation } from "@opentelemetry/instrumentation-generic-pool";

Sentry.init({
  openTelemetryInstrumentations: [
    new GenericPoolInstrumentation(),
    // 他の計装を追加
  ],
});
```

## 注意事項

- `skipOpenTelemetrySetup: true` は **使わない**。Sentry の自動セットアップをそのまま使う方針
- `@vercel/otel` は **導入しない**。Sentry SDK と競合する
- Edge runtime ではカスタムスパン（`trace.getTracer()`）は使用可能だが、`@opentelemetry/instrumentation-*` 系のサードパーティ計装は Node.js runtime 専用

## カスタムスパン設置箇所 (2025-01 追加)

以下のファイルに `withChildSpan` を使ったカスタムスパンを追加した。
`withChildSpan` を使うのは、親スパン（Next.js の HTTP スパン）が存在する場合のみ計測したいため。

### services/battleData.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `battle.fetch-external-data` | `http.client` | championsbattledata.com への外部 fetch | `battle.slug`, `battle.format`, `http.response_status_code` |

### app/api/battle-records/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.battle-records.list` | `db.query` | 一覧取得クエリ | `db.season_id`, `db.team_id` |
| `db.battle-records.create` | `db.query` | INSERT トランザクション | — |

### app/api/battle-records/[id]/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.battle-records.get` | `db.query` | 単一取得クエリ | `db.record_id` |
| `db.battle-records.update` | `db.query` | UPDATE トランザクション | `db.record_id` |
| `db.battle-records.delete` | `db.query` | DELETE クエリ | `db.record_id` |

### app/api/seasons/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.seasons.list` | `db.query` | 一覧取得クエリ | — |
| `db.seasons.create` | `db.query` | INSERT クエリ | — |

### app/api/seasons/[id]/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.seasons.update` | `db.query` | UPDATE クエリ | `db.season_id` |
| `db.seasons.delete` | `db.query` | DELETE クエリ | `db.season_id` |

### app/api/teams/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.teams.list` | `db.query` | 一覧取得クエリ | — |
| `db.teams.save` | `db.query` | upsert トランザクション（複数チーム） | `db.team_count` |

### app/api/teams/[id]/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.teams.delete` | `db.query` | DELETE クエリ | `db.team_id` |

### app/api/box/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.box.list` | `db.query` | 一覧取得クエリ | — |
| `db.box.save` | `db.query` | upsert クエリ | — |

### app/api/box/[id]/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.box.update` | `db.query` | UPDATE クエリ | `db.box_id` |
| `db.box.delete` | `db.query` | DELETE クエリ | `db.box_id` |

### app/api/share/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.share.create` | `db.query` | INSERT クエリ | — |

### app/api/share/[id]/route.ts

| スパン名 | op | 計測対象 | 属性 |
|---|---|---|---|
| `db.share.get` | `db.query` | 単一取得クエリ | `db.share_id` |

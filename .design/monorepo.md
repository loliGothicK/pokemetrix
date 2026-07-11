# モノレポ構成設計

## 概要

pnpm workspaces を使ったモノレポ構成。Next.js の Web アプリと、Rust で実装した WebAssembly ダメージ計算クレートを単一リポジトリで管理する。

## ディレクトリ構成

```
pokemetrix/
├── apps/
│   └── web/                    # Next.js アプリ (@pokemetrix/web)
│       ├── app/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── ...
├── packages/
│   └── damage-calc/            # Rust/WASM クレート (@pokemetrix/damage-calc)
│       ├── src/
│       │   ├── lib.rs
│       │   ├── types.rs        # 型定義 (Stats, Move, DamageResult, Type, ...)
│       │   └── calc.rs         # ダメージ計算ロジック
│       ├── pkg/                # wasm-pack ビルド出力 (gitignore)
│       ├── Cargo.toml
│       └── package.json
├── .changeset/
│   └── config.json
├── package.json                # ワークスペースルート
└── pnpm-workspace.yaml
```

## パッケージ一覧

| パッケージ名 | パス | 説明 |
|---|---|---|
| `@pokemetrix/web` | `apps/web` | Next.js フロントエンド |
| `@pokemetrix/damage-calc` | `packages/damage-calc` | Rust/WASM ダメージ計算ライブラリ |

## damage-calc ビルドフロー

wasm-pack を使って Rust クレートを WebAssembly にコンパイルし、npm パッケージとして出力する。

```
wasm-pack build --target bundler --out-dir pkg --out-name damage_calc
```

出力先 `pkg/` は npm パッケージとして扱われ、pnpm workspace の `workspace:*` 参照で `@pokemetrix/web` から利用される。

### ターゲット

| コマンド | ターゲット | 用途 |
|---|---|---|
| `pnpm build` | `bundler` | Next.js (webpack/Turbopack) |
| `pnpm build:node` | `nodejs` | SSR / サーバーサイド実行 |
| `pnpm test` | `--node` | wasm-bindgen-test |

## apps/web → packages/damage-calc の依存

`apps/web/package.json` に以下を追加済み：

```json
"@pokemetrix/damage-calc": "workspace:*"
```

wasm-pack でビルド後、Next.js 側からは通常の npm パッケージとして import できる。
エンジンは「解決済みモディファイア値を受け取り、丸めと順序だけを厳密に再現する数式実行器」で、
JSON in / JSON out の `calculate` を公開する（詳細は `.design/damage-calc.md`）：

```typescript
import { calculate } from "@pokemetrix/damage-calc";

const result = calculate({
  level: 50,
  basePower: 150,
  attack: 255,
  defense: 145,
  isPhysical: false,
  moveType: "water",
  defenderType1: "grass",
  defenderType2: "poison",
  spreadModifier: 3072, // 全体技
  weatherModifier: 6144, // 雨×水
  stabModifier: 6144, // タイプ一致
});
console.log(result.min, result.max); // 84 99
```

apps/web からは `@/lib/damage`（遅延ロード + モディファイア解決 + 分析）と
`useDamageCalc` フック経由で利用する。

## バージョン管理 (changeset)

changeset は `@pokemetrix/web` と `@pokemetrix/damage-calc` を独立したパッケージとして管理する。パッケージ間の内部依存は `updateInternalDependencies: "patch"` で自動バンプ。

```
pnpm changeset        # 変更セットを作成
pnpm version-packages # バージョンを更新
pnpm release          # publish
```

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-08 | 初期モノレポ構成。既存 Next.js アプリを `apps/web` に移動、`packages/damage-calc` を新規作成 |
| 2026-07-11 | `build:vercel` の `dependsOn` が参照する `prebuild` タスクが未定義で実行されない不具合を修正。`turbo.json` に `prebuild` タスク（`cache: false`）を定義し、`apps/web` に `build:vercel`（`next build`）スクリプトを追加。これで `turbo run build:vercel` 実行時に prebuild が依存グラフに入り前段で走る（Turbo は npm の prebuild ライフサイクルを自動実行しないため明示定義が必要） |
| 2026-07-11 | `turbo.json` を整備。`outputs` を Turbo 2.x のパッケージ相対パスに修正（`apps/web/.next/**` → `.next/**`、`packages/damage-calc/pkg/**` → `pkg/**`）。`build:node`（`pkg-node/**`）タスクを追加。`test`/`dev` に `^build` 依存を付与し、`lint`/`test` の不要な `^lint`/`^test` 依存を削除。`inputs` を定義してキャッシュ判定を厳密化。`version`/`publish` はルートスクリプト（`changeset version`＋Cargo.toml 同期 / `changeset publish`）を実行させるため **ルートタスク `//#version` / `//#publish`** に変更（`changesets.yml` が `pnpm turbo run version` / `publish` を呼ぶ） |

## turbo.json タスク定義

| タスク | dependsOn | cache | outputs | 備考 |
|---|---|---|---|---|
| `prebuild` | なし | ✗ | なし | 各パッケージの `prebuild` スクリプトを実行するための turbo タスク。**Turbo は npm の `prebuild` ライフサイクルを自動実行しない**ため、`build` / `build:vercel` の `dependsOn` から参照する前提で明示定義が必須。`cache: false` で毎回実行 |
| `build:vercel` | `^build`, `prebuild` | ✓ | `.next/**`（`.next/cache` 除く）, `pkg/**` | Vercel 向け Web ビルド（`@pokemetrix/app#build:vercel` = `next build`）。`^build` で先に damage-calc の `pkg/` を生成、`prebuild` で自パッケージの前処理を実行。Vercel の Build Command から `turbo run build:vercel --filter=@pokemetrix/app` で呼ぶ想定 |
| `build` | `^build` | ✓ | `.next/**`（`.next/cache` 除く）, `pkg/**` | web/damage-calc 共通。存在しない output は無視される |
| `build:node` | `^build` | ✓ | `pkg-node/**` | damage-calc の nodejs ターゲット |
| `lint` | なし | ✓ | なし | oxlint。上流ビルド不要 |
| `test` | `^build` | ✓ | なし | web の vitest は damage-calc の `pkg/` を要する |
| `//#version` | なし | ✗ | - | ルートスクリプト `changeset version && pnpm --filter @pokemetrix/damage-calc run sync-version` を実行。sync-version が Cargo.toml の version を package.json に合わせる |
| `//#publish` | なし | ✗ | - | ルートスクリプト `changeset publish` を実行。damage-calc は `prepublishOnly` で自身をビルドするため build 依存は不要 |
| `dev` | `^build` | ✗ | - | persistent。damage-calc を先にビルド |

### バージョン同期フロー（`pnpm turbo run version`）

`changesets.yml` の GitHub Action が `pnpm turbo run version` を呼ぶ。ルートタスク `//#version` がルート `package.json` の `version` スクリプトを実行し、次の順で処理される：

1. `changeset version` — `.changeset/*.md` を消費して各 `package.json` の version をバンプ
2. `pnpm --filter @pokemetrix/damage-calc run sync-version` — `scripts/sync-version.js` が `package.json` の version を読み、`Cargo.toml` の `version = "..."` を書き換え

> 重要: `version` を通常のタスク（`//#` なし）にすると、turbo はワークスペース各パッケージの `version` スクリプトを探すが存在せず（`Command = <NONEXISTENT>`）、Cargo.toml 同期が走らない。ルートスクリプトを実行するには `//#version` が必須。

> 注: ルート `package.json` の `build:app` / `build:wasm` のフィルタは `@pokemetrix/web` を指しているが、実際の Web パッケージ名は `@pokemetrix/app`。フィルタが一致しないため要修正（turbo.json とは別問題）。

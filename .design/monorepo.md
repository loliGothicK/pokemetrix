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

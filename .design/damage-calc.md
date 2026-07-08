# ダメージ計算エンジン設計 (damage-calc)

## 概要

`@pokemetrix/damage-calc` は、ポケモンのダメージ計算を「ゲーム内と完全に一致する精度」で行う
Rust/WebAssembly クレート。実装は DaWoblefet's Damage Dissertation（第7世代ダメージ計算の
完全ドキュメント）に忠実に従う。

参照: DaWoblefet, "A Complete Guide to the Damage Formula", Trainer Tower
(https://web.archive.org/web/20240114122802/https://www.trainertower.com/dawoblefets-damage-dissertation/)
※本設計は上記記事の内容を要約・再構成したもの。ライセンス配慮のため原文の逐語引用は避けている。
記事は第7世代までを扱うが、ダメージ計算の核心（3種の丸め・連鎖・適用順序）はエンジン系譜で
共通しており、Pokémon Champions にもそのまま通用する。世代固有のメカニクスは
「どのモディファイアグループに入るか」を TS 解決層に足すだけで対応できる（後述）。

## 対象タイトル: Pokémon Champions における差分

本プロジェクト（pokemetrix）が対象とするのは Pokémon Champions（最新の対戦特化タイトル）であり、
本編 SV とはメカニクスが異なる。実装はコードベースの事実に基づいて以下を前提とする。

### レベル50・個体値31固定（コードから導出）

Champions のデータモデルに `level` や個体値（IV）は存在しない。ステータスは種族値
（`champions-pokemon.ts` の `status`）と EV・性格から算出され、その式（`data/utility/training.ts`）は
本編の **レベル50・個体値31** の計算式と一致する。

- `calcHp = base + ev + 75` … 本編 Lv50/IV31 の HP 実数値式と一致
- `calcStatus = floor((base + ev + 20) * nature)` … 同 Lv50/IV31 の実数値式と一致

したがって基礎ダメージ式の `Level` 項は常に **22**（`floor(2*50/5 + 2)`）であり、
`DamageInput.level` には常に `50` を渡す。

### メガシンカ（テラスタルではない）

Champions はメガシンカを持つ（`champions-pokemon.ts` の `mega: { mega_id, stone_id }`）。
一方でテラスタルはデータモデルに存在しない。**メガシンカはダメージ式そのものを変えない** —
ステータス・タイプ・特性を書き換えるだけなので、これは純粋にデータ層（TS）の関心事であり、
エンジンは解決済みの `attack` / `defense` / `moveType` / `defenderType*` を受け取るため
**エンジン側の変更は不要**。メガ後の値を解決してから `DamageInput` を組み立てればよい。

> 補足: 本編 SV のテラスタルは（もし将来対応するなら）STAB モディファイアの解決ロジックとして
> TS 層に閉じて追加できる（例: テラ一致かつ元タイプ一致で 2x=8192、適応力併用で 2.25x=9216）。
> 現状の Champions では不要のため未実装。

## なぜ精度が重要か

ダメージ計算は「掛け算するだけ」ではない。ゲームは全モディファイアを `x/4096` の固定小数で表現し、
ステップごとに **3種類の丸め** を使い分ける。丸め誤差はステップを跨ぐと急速に増幅するため、
「どのステップで・どう丸めるか」を正確に再現しないと、ダメ計と実機で「耐える/耐えない」が食い違う。

### 3種類の丸め

| 種類          | 挙動                        | 例                                   |
| ------------- | --------------------------- | ------------------------------------ |
| `pokeRound`   | .5 は切り捨て、.5 超で切上げ | 30.5 → 30, 30.7 → 31                 |
| `normalRound` | 学校算数（.5 で切上げ）      | 30.5 → 31                            |
| `floor`       | 小数切り捨て                | 30.7 → 30                            |

- モディファイアの適用（`value * mod / 4096`）は **pokeRound**
- モディファイアの連鎖（chaining）は **normalRound**
- 基礎ダメージ計算・ステータス変化・乱数・タイプ相性は **floor**

### モディファイアの連鎖 (chaining)

BP・攻撃・防御・最終の4グループは、適用前に複数モディファイアを1つに「連鎖」する。

```
combined = 4096
for m in modifiers:
    combined = normalRound(combined * m / 4096)   // = (combined*m + 2048) >> 12
```

その後 `pokeRound(value * combined / 4096)` で一括適用する。順次適用（掛けては丸め）とは
結果が異なるため、必ずこの2段階で行う。

## アーキテクチャ: 責務の分離

膨大な数の特性・道具・技それぞれの分岐を Rust に埋め込むと、TS 側に既にあるポケモンデータと
二重管理になり破綻する。そこで責務を分離する。

```
┌─────────────────────────────────────────────┐
│ TypeScript (apps/web)                        │
│  データ駆動の「モディファイア解決」層         │
│  - 特性/道具/技/場の状態 → モディファイア値   │
│  - 既存の pokemon/moves/items/abilities data  │
│  - タイプ相性は原則 Rust に委譲               │
└───────────────┬─────────────────────────────┘
                │ DamageInput (JSON)
                ▼
┌─────────────────────────────────────────────┐
│ Rust/WASM (packages/damage-calc)             │
│  「数式実行器」= 難しく間違えやすい部分         │
│  - 3種の丸め / 連鎖 / モディファイア適用順序   │
│  - 基礎ダメージ / 16通りの乱数ロール           │
│  - 32bit・16bit オーバーフロー / 各種チェック  │
│  - タイプ相性表                                │
│  → DamageOutput (16 rolls, min, max)          │
└─────────────────────────────────────────────┘
```

**Rust = 数式そのもの（機構）**、**TS = どのモディファイアが効くか（データ）** という切り分け。
Rust は「解決済みのモディファイア値」を受け取り、丸めと順序だけを厳密に再現する。
これによりエンジンは純粋・テスト可能で、新しい特性/道具は TS のデータ層追加だけで対応できる。

## Rust API

### 入力 `DamageInput` (serde, JS からは camelCase)

| フィールド             | 型         | 既定値 | 説明                                             |
| ---------------------- | ---------- | ------ | ------------------------------------------------ |
| `level`                | u8         | -      | レベル（VGC は 50）                              |
| `basePower`            | u16        | -      | カスタムBP解決後の「元BP」（BPモディファイア適用前）|
| `bpModifiers`          | u16[]      | []     | 連鎖するBPモディファイア (`/4096`)               |
| `attack`               | u16        | -      | 攻撃/特攻の実数値（サマリー画面の値）            |
| `attackBoost`          | i8         | 0      | 攻撃ランク -6..+6                                |
| `attackModifiers`      | u16[]      | []     | 連鎖する攻撃モディファイア                       |
| `defense`              | u16        | -      | 防御/特防の実数値                                |
| `defenseBoost`         | i8         | 0      | 防御ランク -6..+6                                |
| `defenseModifiers`     | u16[]      | []     | 連鎖する防御モディファイア                       |
| `isPhysical`           | bool       | -      | 物理か（やけど補正の判定）                       |
| `moveType`             | Type       | -      | 技タイプ（タイプ相性計算用）                     |
| `defenderType1`        | Type       | -      | 防御側タイプ1                                    |
| `defenderType2`        | Type?      | null   | 防御側タイプ2                                    |
| `effectivenessOverride`| i32?       | null   | タイプ相性シフトを上書き（フリドラ等の特殊技用） |
| `immuneOverride`       | bool?      | null   | 無効を上書き                                     |
| `spreadModifier`       | u16        | 4096   | 全体技 3072、バトルロイヤル 2048                 |
| `parentalBondModifier` | u16        | 4096   | 親子愛2発目 1024                                 |
| `weatherModifier`      | u16        | 4096   | 天候 6144/2048                                   |
| `isCrit`               | bool       | false  | 急所（ランク補正の扱いにも影響）                 |
| `critModifier`         | u16        | 6144   | 急所倍率 1.5x                                    |
| `stabModifier`         | u16        | 4096   | タイプ一致 6144、適応力 8192                     |
| `isBurned`             | bool       | false  | やけど（物理技を半減、Guts/からげんきは呼側で除外）|
| `finalModifiers`       | u16[]      | []     | 連鎖する最終モディファイア（いのちのたま/壁等）  |
| `protectModifier`      | u16        | 4096   | Zワザ vs まもり 1024                             |

### 出力 `DamageOutput`

| フィールド | 型      | 説明                          |
| ---------- | ------- | ----------------------------- |
| `rolls`    | u32[16] | 16通りのダメージ（昇順）      |
| `min`      | u32     | 最小（乱数15）                |
| `max`      | u32     | 最大（乱数0）                 |

### エクスポート関数

```rust
// メイン: JSON in / JSON out
pub fn calculate(input: JsValue) -> Result<JsValue, JsValue>;

// タイプ相性ヘルパー（TS が相性を Rust に委譲するため）
// 戻り値: シフト量（+1=2x, -1=0.5x, 0=等倍）。無効は immune フラグで別途
pub fn type_effectiveness_shift(att: Type, def1: Type, def2: Option<Type>) -> i32;
pub fn is_immune(att: Type, def1: Type, def2: Option<Type>) -> bool;
```

## 計算順序（エンジン内部）

1. **BP解決**: `pokeRound(basePower * chain(bpModifiers) / 4096)`、1未満は1、`% 65536`
2. **攻撃解決**: ランク補正 `floor(attack * n/d)`（急所時は負ランク無視）→ `pokeRound(・ * chain(attackModifiers)/4096)`、1未満は1
3. **防御解決**: ランク補正 `floor(defense * n/d)`（急所時は正ランク無視）→ 連鎖適用、1未満は1
4. **基礎ダメージ**: `floor(floor(floor(2*level/5 + 2) * bp * atk / def) / 50) + 2`
5. **一般ダメージモディファイア**（この順序で適用、各 pokeRound・32bit オーバーフロー考慮）:
   1. 全体技 (`spreadModifier`)
   2. 親子愛 (`parentalBondModifier`)
   3. 天候 (`weatherModifier`)
   4. 急所 (`critModifier`)
   5. **乱数**: 各ロール `floor(current * (100 - factor) / 100)` factor=0..15 → 16通りに分岐
   6. タイプ一致 (`stabModifier`)
   7. タイプ相性: シフト（`v << shift` or `v >> -shift`）
   8. やけど (`isBurned && isPhysical` → 2048)
   9. 最終モディファイア (`chain(finalModifiers)`)
   10. Zワザ vs まもり (`protectModifier`)
   11. 1ダメージチェック（0 なら 1）
   12. 65535 チェック（`> 65535` なら `% 65536`）

ステップ 5.1〜5.4 は乱数に依存しないので一度だけ計算し、5.5 以降を16ロールそれぞれに適用する。
無効タイプ（`is_immune`）の場合は全ロール 0 を返す（1ダメージチェックは適用しない）。

## フロントエンド設計 (apps/web)

### ディレクトリ

```
apps/web/src/lib/damage/
├── engine.ts        # WASM の遅延ロード + calculate ラッパー
├── types.ts         # DamageInput/Output の TS 型 + Type/Category マッピング
├── modifiers.ts     # データ駆動のモディファイア解決（特性/道具/場）
├── resolve.ts       # 攻守ポケモン + 技 + 場 → DamageInput を組み立て
└── index.ts
apps/web/src/hooks/
└── useDamageCalc.ts  # React フック
```

### WASM の遅延ロード

`@pokemetrix/damage-calc` は `bundler` ターゲットでビルドされ、Next.js から通常の npm パッケージとして
import できる。初回計算時に一度だけ init し、以降はキャッシュした exports を使う。

```typescript
import { calculate } from "@/lib/damage";

const result = await calculate({
  level: 50,
  basePower: 150,
  attack: 255,
  defense: 145,
  isPhysical: false,
  moveType: "water",
  defenderType1: "grass",
  defenderType2: "poison",
  spreadModifier: 3072,
  weatherModifier: 6144,
  stabModifier: 6144,
});
// result.min = 84, result.max = 99
```

### モディファイア解決層 (`modifiers.ts` / `resolve.ts`)

既存データ（`src/data/*`）から、攻撃側・防御側のポケモン、技、場の状態（天候/フィールド/壁/
全体技か等）を受け取り、`DamageInput` の各モディファイア値を組み立てる。

- **STAB**: 攻撃側タイプ ∋ 技タイプ なら 6144、適応力なら 8192
- **タイプ相性**: Rust の `type_effectiveness_shift` / `is_immune` に委譲（TS でタイプ表を持たない）
- **天候**: 晴れ×炎=6144/晴れ×水=2048、雨×水=6144/雨×炎=2048
- **道具**: いのちのたま=final に 5324、こだわり=攻撃に 6144、タイプ強化アイテム=BP に 4915 等
- **壁**: リフレクター/ひかりのかべ/オーロラベール → final（ダブル 2732 / シングル 2048）
- **ランク補正**: `attackBoost` / `defenseBoost` にそのまま渡す（丸めは Rust 側）

初期実装では頻出モディファイア（STAB・相性・天候・ランク・急所・全体技・いのちのたま・
こだわり・壁）をカバーし、残りはデータ追加で段階的に拡張する。

### React フック

```typescript
const { data, isLoading } = useDamageCalc({ attacker, defender, move, field });
// data: { min, max, rolls, minPercent, maxPercent, koChance }
```

HP に対する割合・確定/乱数Nの判定は TS 側（`rolls` と防御側 HP）で算出する。

## テスト戦略

- **Rust 単体テスト**: 記事の検算例を回帰テストにする
  - Incineroar とんぼがえり 基礎ダメージ = 43
  - Primal Kyogre しおふき vs Amoonguss（雨・全体技）= 84〜99
  - いのちのたま Mega Rayquaza しんそく vs シャドーシールド Lunala（壁・フレンドガード）= 47〜56
  - 連鎖の検算（BP 152、最終 1332）
- **TS 単体テスト**: モディファイア解決（データ → DamageInput）と、ラッパー経由の
  エンジン呼び出し（記事の検算例）を vitest で検証

### vitest での WASM 読み込み

`vite-plugin-wasm` のヘルパーは Windows/Node 上の vitest で不具合を起こすため、テスト時は
`vitest.config.ts` の alias で `@pokemetrix/damage-calc` を **nodejs ターゲットのビルド**
（`packages/damage-calc/pkg-node/damage_calc.js`、`fs.readFileSync` で wasm を同期ロード）に
差し替えている。本番（Next.js）では bundler ビルド（`pkg/`）がそのまま使われる。
そのため CI/ローカルで `pnpm build:wasm` と `pnpm build:wasm:node` の両方が必要。

## 変更履歴

| 日付       | 内容                                                       |
| ---------- | ---------------------------------------------------------- |
| 2026-07-08 | 初版。忠実な数式実行器（Rust）+ データ駆動解決（TS）の設計 |

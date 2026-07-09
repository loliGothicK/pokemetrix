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

### レベル50・個体値31固定

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
│ TypeScript (apps/web)                       │
│  データ駆動の「モディファイア解決」層         　　 │
│  - 特性/道具/技/場の状態 → モディファイア値   　　 │
│  - 既存の pokemon/moves/items/abilities data │
│  - タイプ相性は原則 Rust に委譲               　│
└───────────────┬─────────────────────────────┘
                │ DamageInput (JSON)
                ▼
┌─────────────────────────────────────────────┐
│ Rust/WASM (packages/damage-calc)            │
│  「数式実行器」= 難しく間違えやすい部分           │
│  - 3種の丸め / 連鎖 / モディファイア適用順序      │
│  - 基礎ダメージ / 16通りの乱数ロール             │
│  - 32bit・16bit オーバーフロー / 各種チェック    │
│  - タイプ相性表                               │
│  → DamageOutput (16 rolls, min, max)        │
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

## ダメージ計算ページ UI 設計

### ルート

- `/damage-calc` — `apps/web/app/damage-calc/page.tsx`
- クライアントコンポーネント: `src/components/client/damage-calc/DamageCalcPage.tsx`

### レイアウト概要

```
┌───────────────────────────────────────────────────────┐
│ タイトル: "Damage Calculator" / "ダメージ計算"           │
├──────────────────────┬────────────────────────────────┤
│ 攻撃側パネル          │ 防御側パネル                    │
│ ・ポケモン選択         │ ・ポケモン選択                  │
│ ・技選択              │ ・HP 表示                      │
│ ・攻撃ランク          │ ・防御ランク                    │
│ ・特性               │ ・特性                         │
│ ・持ち物             │ ・持ち物                        │
├──────────────────────┴────────────────────────────────┤
│ フィールド設定                                          │
│ ・天候 / 壁 / ダブル(全体技) / 急所                     │
├──────────────────────────────────────────────────────┤
│ 計算結果                                               │
│ ・ダメージ範囲 (min–max)                               │
│ ・HP割合 (min%–max%)                                  │
│ ・確定N発 / 乱数N発                                    │
│ ・16ロール表示                                         │
└───────────────────────────────────────────────────────┘
```

### レスポンシブ

- **sm (モバイル)**: 攻撃側パネル → 防御側パネル → フィールド → 結果 を縦積み
- **md (タブレット)**: 攻撃側と防御側を横並び、フィールドと結果は下に縦積み
- **lg (デスクトップ)**: md と同じだがパネル幅にゆとりを持たせる

### 状態管理

- ローカル useState のみ（DB保存は初期実装で不要）
- ポケモン選択 → 種族値・タイプ・特性候補・技候補を自動解決
- EV/性格は入力があれば実数値を再計算、なければデフォルト（無振り無補正）
- 計算は `useDamageCalc` フックに DamageInput を渡す

### 使用する既存モジュール

- `src/lib/damage/` — エンジン、モディファイア解決、分析
- `src/hooks/useDamageCalc.ts` — React Query 経由の WASM 呼び出し
- `src/data/champions-pokemon.ts` — 種族値・タイプ・技リスト
- `src/data/moves.ts` — 技データ（威力・分類・タイプ・範囲）
- `src/data/items.ts` — 持ち物データ
- `src/data/abilities.ts` — 特性データ
- `src/data/utility/training.ts` — `calcHp`, `calcStatus`
- `src/components/client/battle-record/slugAutocomplete.tsx` — ポケモン/技/特性/持ち物の選択 UI

### 翻訳キー

`damageCalc.*` セクションとして `public/locales/{en,ja}/translation.json` に追加。

## UI 改修仕様（2026-07-09）

以下の変更を実施した。

### シングル / ダブル切り替え

- `isDoubles` フラグのチェックボックスを廃止し、ページ上部の `ButtonGroup` トグル（シングル / ダブル）に変更。
- ダブル選択時は `spreadModifier: 3072`（0.75x）が引き続き適用される。

### 天候

- `none / sun / rain / snow / sandstorm / harsh-sun / heavy-rain` の 7 択に拡張。
- 従来「あられ」に相当する選択肢は「雪（snow）」のみとした（あられは削除）。
- UI は `ToggleButtonGroup` で横一列表示。

### フィールド

- `Terrain` 型（`none / electric / grassy / misty / psychic`）を `modifiers.ts` に追加。
- `terrainModifier` 関数を実装。エレキ×でんき / グラス×くさ / サイコ×エスパーを 1.5x。
- `useDamageCalcPage` に `terrain` state を追加し、`bpModifiers` に組み込む。
- UI は `ToggleButtonGroup` で天候の下に表示。

### アイテム絞り込み

- `useDamageCalcItemOptions` フックを `slugAutocomplete.tsx` に追加。
- ダメージ計算で意味のある道具（タイプ強化系 19 種・こだわり系・いのちのたま・たつじんのおび・マッスルバンド・かしこいめがね・きあいのタスキ・たべのこし・ひかりだま）のみを選択肢に表示。
- `PokemonPanel` では `useItemOptions` の代わりに `useDamageCalcItemOptions` を使用。

### 実数値表示

- `PokemonPanel` でポケモン選択後、EV 入力欄の横に実数値を `calcHp` / `calcStatus` で計算して表示。
- 攻撃側は HP・攻撃・特攻、防御側は HP・防御・特防を表示。EV を変更すると即時更新される。

### ダメージバー

- `ResultPanel` のバーを min% ～ max% の**範囲バー**に変更。
  - 左端 = `minPercent`、右端 = `maxPercent`（ただし 100% でクランプ）
  - バー上にホバーするとパーセント範囲のツールチップを表示
  - 0% / 50% / 100% のスケールラベルを下部に表示
- ロール一覧は最小・最大を `filled` Chip で強調。

### 翻訳キー追加

`damageCalc.*` に追加したキー:

| キー                | EN               | JA         |
| ------------------- | ---------------- | ---------- |
| `singles`           | Singles          | シングル   |
| `doubles`           | Doubles          | ダブル     |
| `weatherSnow`       | Snow             | 雪         |
| `weatherSandstorm`  | Sandstorm        | 砂嵐       |
| `terrain`           | Terrain          | フィールド |
| `terrainElectric`   | Electric         | エレキ     |
| `terrainGrassy`     | Grassy           | グラス     |
| `terrainMisty`      | Misty            | ミスト     |
| `terrainPsychic`    | Psychic          | サイコ     |

## PokemonPanel 再構築仕様（2026-07-10）

エッジケース（可変威力技・ステータス参照変更・条件付き威力）に対応するため、
`PokemonPanel` を「技選択に応じて必要な入力のみを開示する（Progressive Disclosure）」
リアクティブな設計に作り直した。設計方針は `.design/damage-calc/pokemonPanel.md` および
`.design/damage-calc/ポケモン技威力変動条件のUI設計.md` に基づく。

### 技メカニクス分類モジュール `lib/damage/moveMechanics.ts`

技 1 件を `getMoveMechanics(identifier, category)` に渡すと、その技の計算特性を返す。

| フィールド            | 意味                                                              |
| --------------------- | ----------------------------------------------------------------- |
| `offensiveStat`       | 攻撃側が使う攻撃ステータス（既定: 物理=atk / 特殊=spa、ボディプレス=def）|
| `defensiveStat`       | 防御側で参照するステータス（既定: 物理=def / 特殊=spd、サイコショック=def）|
| `useTargetAttack`     | イカサマ: 防御側の攻撃実数値＋防御側のランクを使う                 |
| `attackerExtraStats`  | 攻撃側パネルで追加表示するステータス（ジャイロボール/エレキボール=spe）|
| `defenderExtraStats`  | 防御側パネルで追加表示（spe、イカサマ時の atk）                    |
| `usesAttackerHp`      | 攻撃側の現在 HP% が必要（ふんか/しおふき/きしかいせい/じたばた）   |
| `computeBasePower`    | 動的入力（HP%・素早さ・条件）から実効威力を算出。無ければ静的威力  |
| `conditions`          | 技の下に出す条件付き威力チェックボックス（たたりめ/からげんき/ベノムショック）|
| `bpModifiers`         | 条件付き基礎威力モディファイア（`x/4096`）を連鎖で返す            |
| `freezeDry`           | フリーズドライ相性上書きフラグ（`typeChart.ts` で配線済み）        |

対応済みの可変威力/参照変更:

- **攻撃側 HP 比例**: ふんか・しおふき（`150 * hp% / 100`, 最低 1）
- **攻撃側 HP 反比例**: きしかいせい・じたばた（HP 割合閾値テーブル、最大 200）
- **素早さ依存**: ジャイロボール（`min(150, floor(25*相手S/自S)+1)`）、エレキボール（S 比の閾値）
- **防御側 HP 依存**: ハードプレス（`100 * hp%`）、にぎりつぶす/しぼりとる（`120 * hp%`）
- **ステータス参照変更**: ボディプレス（自分の Def）、イカサマ（相手の Atk）、サイコショック系（相手の Def）
- **条件付き 2 倍**: たたりめ・からげんき・ベノムショック（チェックボックス）。からげんきは
  さらにやけどの物理半減を無効化（`isBurned` を渡さない）。
- **天候技のタイプ変化**: ウェザーボール／だいちのはどう（`resolveFieldReactiveMove` で
  天候・フィールドからタイプと威力 2 倍を解決）
- **体重依存**: けたぐり（`low-kick`）は相手の体重（`master/pokemon.json` の `weight`、
  ヘクトグラム→kg）で威力（20〜120）を決定。ヘビーボンバー（`heavy-slam`）・ヒートスタンプ
  （`heat-crash`）は自分／相手の体重比で威力（40〜120）を決定。体重は種族データから自動導出し、
  `PowerContext.attackerWeight` / `defenderWeight`（kg）に渡す。
  ※くさむすび（`grass-knot`）は本データセットで `category: status` のため計算パイプラインを
  通らず未対応（データ側の分類が修正されれば同じ体重ロジックで動く）。かるいし・ライトメタル・
  ヘヴィメタルによる体重補正は未対応。

### Progressive Disclosure（PokemonPanel）

- `role`（`attacker` / `defender`）と `activeMove`（攻撃側が選択中の技 ID）を受け取り、
  攻守どちらのパネルも「その技に必要なステータスのみ」を表示する。
- 攻撃側: 使用する攻撃ステータス（Atk/SpA/Def）＋必要なら Spe、HP% を開示。
  イカサマ時は攻撃側の攻撃欄を隠し「相手の攻撃を参照」と表示。
- 防御側: 常に HP（EV）＋ HP%、参照される防御ステータス（Def/SpD）を開示。
  必要なら Spe、イカサマ時は Atk を追加。
- ランク（`boost`）は各パネルの主ステータス（攻撃側=攻撃系 / 防御側=防御系）に紐づけて 1 つ表示。

### HP は % 指定（スライダー廃止）

- HP はスライダーではなく **現在 HP を % で入力する `NumberField`**（`hpPercent`, 1–100, 既定 100）。
- 防御側は常時表示（ハードプレス等の威力・確定数の基準）。攻撃側は HP 依存技選択時のみ表示。

### 状態拡張 `PokemonPanelState`

`evSpe` / `hpPercent` / `isBurned`（攻撃側やけど）/ `moveConditions`（技条件チェックボックス）を追加。

### 追加翻訳キー

`status` / `conditions` / `rank` / `hpPercent` / `burn` / `usesTargetAttack` /
`condTargetStatus` / `condUserStatus` / `condTargetPoisoned` を en/ja に追加。

## 条件・特性・追加可変威力（2026-07-10 拡張）

`moveMechanics.ts` に「基礎威力を SET する `computeBasePower`」に加えて「`x/4096` の
基礎威力モディファイアを連鎖する `bpModifiers(ctx)`」フックを追加。ゲーム内で「〜のとき ×2」
系はこちらで表現する（丸め順序が正確）。`PowerContext` に `terrain` と `defenderHasItem` を追加。

### 特性によるタイプ変化（-ate / ノーマルスキン）

`resolveAbilityTypeChange(ability, moveType)` を追加。攻撃側特性でノーマル技を別タイプに変える。

| 特性        | 変化後   | 補正         |
| ----------- | -------- | ------------ |
| pixilate    | fairy    | ~1.2x (ATE_BOOST) |
| aerilate    | flying   | ~1.2x |
| refrigerate | ice      | ~1.2x |
| galvanize   | electric | ~1.2x |
| normalize   | normal   | ~1.2x（全技を Normal 化）|

型変化後の値で STAB・タイプ相性・天候・じゅうでん・はがねのせいしん・フェアリーオーラ等を再評価。
PokemonPanel の特性欄下に「特性で ◯◯ タイプに変化」インジケータを表示。

### 追加した可変威力技

- 条件チェックボックス（技の下に表示）: たたりめ・からげんき・ベノムショック（既存）に加え、
  りんしょう(`round`)・ドラゴンダイブ/ころがる系(`dragon-rush`/`steamroller`/`stomp`/`body-slam`＝
  ちいさくなる相手)・じだんだ(`stomping-tantrum`)/やけっぱち(`temper-flare`)（前ターン行動失敗）・
  ダメおし(`assurance`)・しっぺがえし(`payback`)・じしん(`earthquake`)/マグニチュード（あなをほる相手）。
- 場・道具から自動判定: はたきおとす(`knock-off`, 相手が道具所持で ×1.5)・ライジングボルト
  (`rising-voltage`, エレキF で ×2)・ワイドフォース(`expanding-force`, サイコF で ×1.5)。

### Conditions（各陣営）

`PokemonPanelState.conditions`（`Record<string, boolean>`）で管理。役割別に表示し、ダブル限定条件
（てだすけ・パワースポット・バッテリー）はシングル時は非表示。

- 攻撃側: やけど(burn, 物理 ×0.5／からげんき時は無効)・てだすけ(×1.5, ダブル)・じゅうでん
  (でんき技 ×2)・はがねのせいしん(はがね技 ×1.5)・パワースポット(×1.3, ダブル)・バッテリー
  (特殊 ×1.3, ダブル)・フラワーギフト(晴れ, 物理 Atk ×1.5)・そうでん(技をでんき化)・
  おいかぜ(素早さ ×2)・まひ(素早さ ×0.5)
- 防御側: フラワーギフト(晴れ, 特殊 SpD ×1.5)・おいかぜ・まひ、およびリフレクター/ひかりのかべ/
  オーロラベール（既存）
- おいかぜ・まひは素早さに作用するため、ジャイロボール/エレキボールの威力へ反映される。

### Entire Field Conditions

天候・フィールド・シングル/ダブル（既存）に加え、`fieldEffects` 行として:

- フェアリーオーラ(`fairyAura`): フェアリー技 ~1.33x（bp）
- ワンダールーム(`wonderRoom`): 防御側の Def ⇄ Sp.Def を入れ替えて参照

### 未対応（データ/エンジン都合）

- Power Trick / Grounded（浮遊）/ Protect / Tar Shot は未対応。
- フリーズドライの水弱点上書きは TS 側タイプ相性表が無いため未配線（`freezeDry` フラグのみ）。

## 変更履歴

| 日付       | 内容                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| 2026-07-10 | 特性タイプ変化(-ate/ノーマルスキン)・追加可変威力技・Conditions/Field 条件(てだすけ/じゅうでん/おいかぜ/まひ/フラワーギフト/フェアリーオーラ/ワンダールーム等)を追加 |
| 2026-07-10 | 体重依存技(けたぐり/ヘビーボンバー等)を追加                                   |
| 2026-07-10 | PokemonPanel 再構築: 技メカニクス分類・Progressive Disclosure・可変威力/参照変更・HP% 入力 |
| 2026-07-09 | UI 改修: シングル/ダブルトグル・フィールド追加・雪・アイテム絞り込み・実数値表示・範囲バー |
| 2026-07-09 | ダメージ計算ページ UI 設計を追加                                              |
| 2026-07-08 | 初版。忠実な数式実行器（Rust）+ データ駆動解決（TS）の設計                    |

## エッジケース拡張（2026-07-10）

`moveMechanics.ts` / `useDamageCalcPage.ts` / `typeChart.ts` に以下を追加。基礎威力を SET する
`computeBasePower(ctx)` に加え、`x/4096` の基礎威力モディファイアを連鎖する `bpModifiers(ctx)`
フックを持つ（「〜のとき ×2」系はこちらで表現し丸め順序を正確化）。`PowerContext` に `terrain`・
`defenderHasItem` を追加。

### 可変威力・参照変更技

- 攻撃側 HP 比例: ふんか / しおふき、HP 反比例: きしかいせい / じたばた
- 素早さ依存: ジャイロボール / エレキボール（おいかぜ×2・まひ÷2 を反映）
- 防御側 HP 依存: ハードプレス / にぎりつぶす / しぼりとる
- 体重依存: けたぐり・くさむすび（対象体重）/ ヘビーボンバー・ヒートスタンプ（体重比）。体重は
  `master/pokemon.json` の `weight`（ヘクトグラム）。※くさむすびは本データ `category: status` で対象外。
- 参照変更: ボディプレス（自 Def）/ イカサマ（相手 Atk）/ サイコショック系（相手 Def）
- 条件付き ×2（チェックボックス）: たたりめ・からげんき・ベノムショック・りんしょう・
  ドラゴンダイブ系（ちいさくなる）・じだんだ / やけっぱち（行動失敗）・ダメおし・しっぺがえし・
  じしん（あなをほる）
- 場・道具から自動: はたきおとす（道具所持 ×1.5）・ライジングボルト（エレキ F ×2）・
  ワイドフォース（サイコ F ×1.5）
- 天候技: ウェザーボール / だいちのはどう（タイプ変化 + 威力 2 倍）

### 特性・条件・場

- -ate / ノーマルスキン: `resolveAbilityTypeChange` で技タイプ変化 + ~1.2x。
- 攻撃側条件: やけど・てだすけ(D)・じゅうでん・はがねのせいしん・パワースポット(D)・
  バッテリー(D)・フラワーギフト・そうでん・おいかぜ・まひ・パワートリック。（D=ダブル限定）
- 防御側条件: まもる・タールショット・フラワーギフト・おいかぜ・まひ・パワートリック・壁（既存）。
- 場: フェアリーオーラ（フェアリー ~1.33x）・ワンダールーム（Def⇄SpD 入替）。

### タイプ相性オーバーライド・特殊防御（`typeChart.ts`）

Rust の `single_matchup` を TS 移植（`effectivenessShift` / `isImmune` / `freezeDryOverride` /
`tarShotFireOverride`）。同期算出し `effectivenessOverride` / `immuneOverride` を組み立てる。

- フリーズドライ: こおり技で みず を +1（抜群）扱い。
- タールショット: ほのお技のとき `通常シフト + 1`。
- 浮遊(`levitate`): じめん技を `immuneOverride`。浮いている攻撃側（levitate / ひこう）は
  地形の攻撃補正を受けない（`isGrounded`）。
- まもる: 原則ダメージ 0。攻撃側が `unseen-fist`（メガゴルーグ）/ `piercing-drill`
  （メガドリュウズ）かつ **接触技** のときのみ貫通し `protectModifier = 1024`（0.25x）。
  ※ Champions では Unseen Fist も貫通時 1/4 ダメージ。
- パワートリック: Atk⇄Def の実数値を入替（攻守）。ワンダールーム併用時は入替後に Def⇄SpD。

### 未対応

- Grounded の手動トグル（かるいし・でんじふゆう等）。浮遊・ひこうは特性/タイプから自動判定。
- くさむすび（本データ `category: status`）。体重ロジック自体は実装済み。

# ポケモンバトル検定 (Pokémon Battle Proficiency Test) 設計ガイドライン

Pokemetrixにおけるクイズコンテンツの作成方法とフォーマットについてのドキュメントです。クイズはMDX（Markdown + JSX）形式で記述し、特定のディレクトリに配置することでシステムに認識されます。

## 0. カテゴリ・出題形式・難易度設定

### 0.1カテゴリ

- **学科 (Academic)**: 純粋な知識のみを問うカテゴリ
- **実技 (Practical)**: ダメージ計算/素早さ計算/詰めポケ の3種類

### 0.2 出題形式

- **○×クイズ**: 命題が真か偽かを答える問題
- **4択クイズ**: 4つの中から1つの正解を答える問題
- **一問多答**: 問題に対して、示された3つまたは4つの選択肢の中から正しいものを過不足なくすべて選択する問題
- **順番当て**: 4つの選択肢を、問題文で示された順番に選択する問題
- **グループ分け**: 3~5つの選択肢を2つまたは3つのグループに分けて解答する問題
- **一方通行**: まず1番の選択肢が表示され、2番以降の選択肢は伏せられている。正解だと思ったら、その選択肢を押し、違うと思ったら、選択肢横の「次」をタッチして次の選択肢を開ける形式。
  4択クイズの変形で、次の選択肢を開けた場合、1つ前以前の選択肢を選ぶ事が出来なくなる。解答を選ぶと、全ての選択肢が表示される。

### 0.3 難易度設定

難易度は **Basics/Advanced/Expert/Master** の4種類で
それぞれの違いは以下のように設計されている:

- **Basics**
  - 全て4択か○×クイズ（`format: choices` のみ）
  - **Academic**: ゲーム内で確認できる程度の基礎知識を問う
  - **Practical**:
    - **Speed Compare**: 提示されたポケモンAに対してポケモンBが素早さ種族値を上回っているかの○×クイズ
    - **Damage Calc**: タイプ相性や道具の効果など基礎知識を問う
    - **Tsume**: 先制技や全体技を使った基礎的な盤面を扱う（ヘッズアップのみ）
- **Advanced**
  - 全て4択か○×クイズ（`format: choices` のみ）
  - **Academic**: 種族値を覚えていることを前提としても良い問題など
  - **Practical**:
    - **Speed Compare**: Basicsに加えて努力値と性格も考慮する
    - **Damage Calc**: ダメージ計算の基礎を問う
    - **Tsume**: 先制技や全体技を使った基礎的な盤面を扱う（2 vs 2）
- **Expert**
  - Advancedに加えて一問多答（`format: multi_select`）と順番当て（`format: ordering`）も解禁
  - **Academic**: 複合仕様に関する問題を扱う（例: いかくを無効にする特性をすべて選べ）
  - **Practical**:
    - **Speed Compare**: Advancedに加えてアイテムやおいかぜ等も考慮する
    - **Damage Calc**: 耐久調整や光の壁等も考慮した問題を扱う
    - **Tsume**: 安定して勝つにはどうすればいいかという基本的な考え方に基づく盤面を扱う
- **Master**
  - Expertに加えて一方通行（`format: one_way`）とグループ分け（`format: grouping`）も解禁
  - **Academic**: 実践で稀に見るエッジケースのみを扱う
  - **Practical**:
    - **Speed Compare**: Expertの応用
    - **Damage Calc**: Expertの応用に加えて、入ったダメージから相手の努力値を逆算する問題などを扱う
    - **Tsume**: 不意打ちなどにより複雑なナッシュ均衡になっている盤面を扱う

## 1. ファイルの配置場所

クイズファイルは、言語とカテゴリーごとに分類されたディレクトリに配置します。ファイルパスから難易度やカテゴリなどのメタデータが自動推論されます。

```text
apps/web/content/quiz/[locale]/[difficulty]/[category]/[id].mdx
```

- **`[locale]`**: `ja` (日本語) または `en` (英語)
- **`[difficulty]`**: `basics`, `advanced`, `expert`, `master` のいずれか
- **`[category]`**: `academic`, `damage_calc`, `tsume`, `speed_compare` のいずれか
- **`[id]`**: クイズの一意なID（ファイル名から拡張子を除いたもの）。

## 2. フロントマター (Frontmatter) の定義

MDXファイルの先頭には、必ずYAML形式でメタデータを記述します。システム(`content-collections.ts`) によって厳密に型チェックされます。

### 2.1 データ入力ルール（ドメインルール）

1. **カテゴリーと難易度のIDは固定**: `basics`, `advanced`, `expert`, `master` や `academic`, `damage_calc`, `tsume`, `speed_compare` などの内部IDは、コード内で絶対にリネームしないでください。ローカライズ（表示名）の変更は、UI側の翻訳JSONファイル（例: `ja/translation.json`）でのみ行います。
2. **データソース**: ポケモン/もちもの/技は日本語や英語の問題にかかわらず `identifier` を使わなければならない、必ず `apps/web/data/champions/{pokemon, items, moves}.json` などのJSONデータを真として参照してください。
3. **努力値のスケール**: 努力値はクイズ本文・フロントマターで努力値を記述する際は必ず次の記法を使用してください（例: `S32+`, `H32 B32+`）。

```bnf
<syntax> ::= <EV> | <EV><space><syntax>
<space> ::= " "
<EV> ::= <stat><num> | <stat><num><nature>
<stat> ::= "H" | "A" | "B" | "C" | "D" | "S"
<num> ::= 1 | 2 | ... | 31 | 32
<nature> ::= "+" | "-"
```

### 2.1 基本スキーマ

```yaml
---
format: "choices"
question: "メガストーンを持たせたポケモンは、きあいのタスキやオボンのみなどの他のどうぐを同時に持つことができるか？"
options:
  - "できる"
  - "できない"
correctAnswerIndex: 1
---
```

### 2.2 プロパティ詳細

| プロパティ名         | 型                         | 必須 | 説明                                                                                                                                                           |
|:---------------------|:---------------------------|:----:|:---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **`format`**         | `enum`                     |  ✅  | 回答形式。`choices` (選択式), `multi_select` (一問多答), `ordering` (順番当て), `grouping` (グループ分け), `one_way` (一方通行), `input` (入力式) のいずれか。 |
| **`question`**       | `string`                   |  ✅  | 問題文。                                                                                                                                                       |
| **`options`**        | `string[]`                 |  ⚠️  | 選択肢の配列（`format: "choices"` の場合は必須。各フォーマットの必要数については難易度設定セクションを参照）。                                                 |
| **`correctAnswer`**  | `string`                   |  ⚠️  | 正解（`format: "choices"`, `"one_way"`, `"input"` の場合は必須）。`options` 内の文字列と完全に一致する必要があります。                                         |
| **`correctAnswers`** | `string[]`                 |  ⚠️  | 正解の配列（`format: "multi_select"` の場合は必須）。すべての正解を含む必要があります。                                                                        |
| **`correctOrder`**   | `string[]`                 |  ⚠️  | 正しい順序の配列（`format: "ordering"` の場合は必須）。必ず4つの選択肢を順番通りに含む必要があります。                                                         |
| **`correctGroups`**  | `Record<string, string[]>` |  ⚠️  | グループラベルをキーとし、各グループのメンバー配列を値とするオブジェクト（`format: "grouping"` の場合は必須）。                                                |

## 3. カテゴリーごとの特殊データ

カテゴリーが `damage_calc` (ダメージ計算) または `tsume` (詰め将棋) の場合、フロントマターに追加のJSONデータが必要です。

### `damage_calc` の場合 (`practicalData`)
ダメージ計算の状況を定義するために `practicalData` を追加します。

```yaml
practicalData:
  attacker:
    species: garchomp
    evs: A32+
    item: life-orb
    nature: adamant
  defender:
    species: tyranitar
    evs: H32
    item: expert-belt
    nature: adamant
  ally:
    species: rotom-wash
    item: sitrus-berry
  opponentAlly:
    species: gengar
    item: focus-sash
  move: earthquake
```

### `tsume` の場合 (`tsumeData`)
フィールド状況やポケモンの状態を定義するために `tsumeData` を追加します。

```yaml
tsumeData:
  field:
    weather: rain
  playerSide:
    active:
      - species: scizor-mega
        hpCurrent: 145
        hpMax: 145
        moves:
          - bullet-punch
          - close-combat
          - sword-dance
          - protect
        item: scizorite
      - species: azumarill
        hpCurrent: 175
        hpMax: 175
        item: sitrus-berry
  opponentSide:
    active:
      - species: staraptor-mega
        hpCurrent: 40
        hpMax: 160
      - species: tyranitar
        hpCurrent: 175
        hpMax: 175
  correctMoves:
    - Bullet Punch + Aqua Jet
```

### `speed_compare` の場合 (`speedCompareData`)
素早さ比較の状況を定義するために `speedCompareData` を追加します（オプション）。

```yaml
speedCompareData:
  pokemonA: garchomp
  pokemonB: delphox-mega
  context: ガブリアスは S32 こだわりスカーフ、メガマフォクシーは S32+
```

**プロパティ詳細:**
- `pokemonA`: ポケモンAの識別子（`pokemon.json` の `identifier` フィールドと一致）
- `pokemonB`: ポケモンBの識別子
- `context`: 努力値・性格・持ち物・場の状態などの説明文

**注意:** 基本的な種族値比較のみを問う○×クイズの場合、`speedCompareData` は省略可能です。

## 4. 本文 (解説部分)

フロントマターの下には、正解発表後に表示される解説をMarkdownで記述します。

```mdx
---
id: "example"
...
---

サイコフィールド下では、接地しているポケモンへの先制技は無効化されます。
そのため、通常の攻撃技を選択する必要があります。
```

## 5. Conventions (規約)

- **同一ファイルの多言語対応**: クイズを作成・追加する際は、必ず `en` (英語) と `ja` (日本語) の両方のディレクトリに**同一ファイル名の `*.mdx` ファイルを配置**する必要があります。
  - 例: `ja/basics/academic/type_matchup.mdx` を作成した場合、対応する `en/basics/academic/type_matchup.mdx` も作成し、問題文や解説をそれぞれの言語で記述してください。
  - フロントマターの `format`, `correctAnswerIndex` などのクイズ構成データは両言語で完全に一致させる必要があります。ファイル名と配置パスを同一にすることで、システム上同じ問題として紐付けられます。

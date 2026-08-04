# ポケモンバトル検定 (Pokémon Battle Proficiency Test) 設計ガイドライン

Pokemetrixにおけるクイズコンテンツの作成方法とフォーマットについてのドキュメントです。クイズはMDX（Markdown + JSX）形式で記述し、特定のディレクトリに配置することでシステムに認識されます。

## 0. カテゴリ・出題形式・難易度設定

### カテゴリ

- **学科 (Academic)**: 純粋な知識のみを問うカテゴリ
- **実技 (Practical)**: ダメージ計算/素早さ計算/詰めポケ の3種類

### 出題形式

- **○×クイズ**: 命題が真か偽かを答える問題
- **4択クイズ**: 4つの中から1つの正解を答える問題
- **一問多答**: 問題に対して、示された3つまたは4つの選択肢の中から正しいものを過不足なくすべて選択する問題
- **順番当て**: 4つの選択肢を、問題文で示された順番に選択する問題
- **グループ分け**: 3~5つの選択肢を2つまたは3つのグループに分けて解答する問題
- **一方通行**: まず1番の選択肢が表示され、2番以降の選択肢は伏せられている。正解だと思ったら、その選択肢を押し、違うと思ったら、選択肢横の「次」をタッチして次の選択肢を開ける形式。
  4択クイズの変形で、次の選択肢を開けた場合、1つ前以前の選択肢を選ぶ事が出来なくなる。解答を選ぶと、全ての選択肢が表示される。

### 難易度設定

難易度は **Basics/Advanced/Expert/Master** の4種類で
それぞれの違いは以下のように設計されている:

- **Basics**
  - 全て4択か○×クイズ
  - **Academic**: ゲーム内で確認できる程度の基礎知識を問う
  - **Practical**:
    - **Speed Compare**: 提示されたポケモンAに対してポケモンBが素早さ種族値を上回っているかの○×クイズ
    - **Damage Calc**: タイプ相性や道具をの効果など基礎知識を問う
    - **Tsume**: 先制技や全体技を使った基礎的な盤面を扱う（ヘッズアップのみ）
- **Advanced**
  - 全て4択か○×クイズ
  - **Academic**: 種族値を覚えていることを前提としても良い問題など
  - **Practical**:
    - **Speed Compare**: Basicsに加えて努力値と性格も考慮する
    - **Damage Calc**: タイプ相性や道具をの効果など基礎知識を問う
    - **Tsume**: 先制技や全体技を使った基礎的な盤面を扱う（2 vs 2）
- **Expert**
  - Advancedに加えて一問多答と順番当ても解禁 
  - **Academic**: 複合仕様に関する問題を扱う（例: いかくを無効にする特性をすべて選べ）
  - **Practical**:
    - **Speed Compare**: Advancedに加えてアイテムやおいかぜ等も考慮する
    - **Damage Calc**: 耐久調整や光の壁等も考慮した問題を扱う
    - **Tsume**: 安定して勝つにはどうすればいいかという基本的な考え方に基づく盤面を扱う
- **Master**
  - Expertに加えて一方通行とグループ分けも解禁
  - **Academic**: 実践で稀に見るエッジケースのみを扱う
  - **Practical**:
    - **Speed Compare**: Expertの応用
    - **Damage Calc**: Expertの応用に加えて、入ったダメージから相手の努力値を逆算する問題などを扱う
    - **Tsume**: 不意打ちなどにより複雑なナッシュ均衡になっている盤面を扱う

## 1. ファイルの配置場所

クイズファイルは、言語とカテゴリーごとに分類されたディレクトリに配置します。

```text
apps/web/content/quiz/[locale]/[difficulty]/[category]/[quiz_id].mdx
```

- **`[locale]`**: `ja` (日本語) または `en` (英語)
- **`[difficulty]`**: `basics`, `advanced`, `expert`, `master` のいずれか 
- **`[category]`**: `academic`, `damage_calc`, `tsume` のいずれか
- **`[quiz_id]`**: クイズの一意なID。ファイル名にはこのIDを使用します（例: `basic_mega_item.mdx`）。

## 2. フロントマター (Frontmatter) の定義

MDXファイルの先頭には、必ずYAML形式でメタデータを記述します。システム(`content-collections.ts`) によって厳密に型チェックされます。

### 基本スキーマ

```yaml
---
id: "basic_mega_item"
difficulty: "basics"
category: "academic"
format: "choices"
question: "メガストーンを持たせたポケモンは、きあいのタスキやオボンのみなどの他のどうぐを同時に持つことができるか？"
options:
  - "できる"
  - "できない"
correctAnswer: "できない"
prerequisites: []
---
```

### プロパティ詳細

| プロパティ名        | 型         | 必須 | 説明                                                                                                                                        |
|:--------------------|:-----------|:----:|:--------------------------------------------------------------------------------------------------------------------------------------------|
| **`id`**            | `string`   |  ✅  | クイズの一意なID。ファイル名と一致させるのが推奨です。                                                                                      |
| **`difficulty`**    | `enum`     |  ✅  | 難易度。必ず **`basics`, `advanced`, `expert`, `master`** のいずれかを使用してください（※コード内で別名に変更することは禁止されています）。 |
| **`category`**      | `enum`     |  ✅  | カテゴリー。必ず **`academic`, `damage_calc`, `tsume`** のいずれかを使用してください。                                                      |
| **`format`**        | `enum`     |  ✅  | 回答形式。現在は **`choices`** (選択式) または **`input`** (入力式) のみサポートされています。                                              |
| **`question`**      | `string`   |  ✅  | 問題文。                                                                                                                                    |
| **`options`**       | `string[]` |  ⚠️  | 選択肢の配列（`format: "choices"` の場合は必須）。                                                                                          |
| **`correctAnswer`** | `string`   |  ✅  | 正解。`options` 内の文字列と完全に一致する必要があります。                                                                                  |

---

## 3. カテゴリーごとの特殊データ

カテゴリーが `damage_calc` (ダメージ計算) または `tsume` (詰め将棋) の場合、フロントマターに追加のJSONデータが必要です。

### `damage_calc` の場合 (`practicalData`)
ダメージ計算の状況を定義するために `practicalData` を追加します。

```yaml
practicalData: {
  "attacker": { "species": "ガブリアス", "evs": "A32+", "item": "いのちのたま", "nature": "いじっぱり" },
  "defender": { "species": "バンギラス", "evs": "H32", "item": "たつじんのおび", "nature": "いじっぱり" },
  "ally": { "species": "ウォッシュロトム", "item": "オボンのみ" },
  "opponentAlly": { "species": "ゲンガー", "item": "きあいのタスキ" },
  "move": "じしん"
}
```

### `tsume` の場合 (`tsumeData`)
フィールド状況やポケモンの状態を定義するために `tsumeData` を追加します。

```yaml
tsumeData: {
  "field": { "weather": "あめ" },
  "playerSide": [
    { "species": "メガハッサム", "hpCurrent": 145, "hpMax": 145, "moves": ["バレットパンチ", "インファイト", "つるぎのまい", "まもる"], "item": "ハッサムナイト" },
    { "species": "マリルリ", "hpCurrent": 175, "hpMax": 175, "item": "オボンのみ" }
  ],
  "opponentSide": [
    { "species": "カプ・テテフ", "hpCurrent": 40, "hpMax": 145 },
    { "species": "バンギラス", "hpCurrent": 175, "hpMax": 175 }
  ],
  "correctMoves": ["Bullet Punch + Aqua Jet"]
}
```

---

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

## 5. 注意事項（ドメインルール）

1. **カテゴリーと難易度のIDは固定**: `basics`, `advanced`, `expert`, `master` や `academic`, `damage_calc`, `tsume` などの内部IDは、コードやフロントマターで絶対にリネームしないでください。ローカライズ（表示名）の変更は、UI側の翻訳JSONファイル（例: `ja/translation.json`）でのみ行います。
2. **データソース**: 技やポケモンの正確な名称・存在確認は、必ず `apps/web/data/champions/pokemon.json` などのJSONデータを真として参照してください。

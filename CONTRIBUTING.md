# クイズ (Quiz) 作成ガイド

Pokemetrixにおけるクイズコンテンツの作成方法とフォーマットについてのドキュメントです。クイズはMDX（Markdown + JSX）形式で記述し、特定のディレクトリに配置することでシステムに認識されます。

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
| **`prerequisites`** | `string[]` |      | 前提となるクイズIDの配列（任意）。これをクリアしていないと解けない、といった依存関係を示します。                                            |

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

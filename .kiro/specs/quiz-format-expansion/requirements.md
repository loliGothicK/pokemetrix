# Requirements Document

## Introduction

Pokemetrix のクイズシステムを拡張し、CONTRIBUTING.md のガイドラインに定義された新しい出題形式（`multi_select`・`ordering`・`grouping`・`one_way`）と新カテゴリ `speed_compare`（素早さ計算）をサポートする。
現状のスキーマは `choices` と `input` の2形式、`academic`・`damage_calc`・`tsume` の3カテゴリのみに限定されており、新形式のフロントマターを受け付けられない。また各難易度の実技クイズに `speed_compare` 問題が0問であるため、所定の問題数（各難易度10問）を満たすためにコンテンツを追加する必要がある。

## Glossary

- **Quiz_Schema**: `apps/web/content-collections.ts` で定義された MDX フロントマターの Zod スキーマ
- **Format**: クイズの回答形式（`choices` / `multi_select` / `ordering` / `grouping` / `one_way`）
- **Category**: クイズの種類（`academic` / `damage_calc` / `tsume` / `speed_compare`）
- **Difficulty**: クイズの難易度（`basics` / `advanced` / `expert` / `master`）
- **CONTRIBUTING.md**: クイズコンテンツの設計ガイドライン（セクション0）
- **Speed_Compare**: 素早さ計算カテゴリ。ポケモン間の素早さ比較を問うクイズ
- **Multi_Select**: 正しいものをすべて選択する形式（3〜4選択肢）
- **Ordering**: 4つのアイテムを指定の順番に並べる形式
- **Grouping**: 3〜5つのアイテムを2〜3グループに分類する形式
- **One_Way**: 選択肢が1つずつ順に開示され、一度スキップした選択肢には戻れない形式
- **Practical_Count**: 各難易度の実技クイズ合計（`speed_compare` + `damage_calc` + `tsume`）
- **Champions_EV_Format**: EV は1統計値あたり最大32・合計66上限の独自フォーマット（例: `S32+`）

---

## Requirements

### Requirement 1: `speed_compare` カテゴリの追加

**User Story:** As a コンテンツ作者, I want to create speed_compare quiz files, so that I can cover the素早さ calculation aspect of the Practical quiz track.

#### Acceptance Criteria

1. THE Quiz_Schema SHALL accept `speed_compare` as a valid value for the `category` field.
2. WHEN a MDX file with `category: speed_compare` is processed, THE Quiz_Schema SHALL validate it without error.
3. THE Quiz_Schema SHALL continue to accept `academic`, `damage_calc`, and `tsume` as valid `category` values.
4. WHEN the `category` value is not one of `academic`, `damage_calc`, `tsume`, or `speed_compare`, THE Quiz_Schema SHALL reject the file with a validation error.

---

### Requirement 2: 新出題形式のスキーマ対応

**User Story:** As a コンテンツ作者, I want to use multi_select, ordering, grouping, and one_way formats in quiz frontmatter, so that I can create varied question types for Expert and Master difficulty levels.

#### Acceptance Criteria

1. THE Quiz_Schema SHALL accept `multi_select`, `ordering`, `grouping`, and `one_way` as valid values for the `format` field.
2. THE Quiz_Schema SHALL continue to accept `choices` as a valid `format` value.
3. WHEN `format` is `multi_select`, THE Quiz_Schema SHALL require `options` to be a non-empty array of 3–4 strings.
4. WHEN `format` is `ordering`, THE Quiz_Schema SHALL require `options` to be an array of exactly 4 strings.
5. WHEN `format` is `grouping`, THE Quiz_Schema SHALL require `options` to be an array of 3–5 strings.
6. WHEN `format` is `one_way`, THE Quiz_Schema SHALL require `options` to be an array of 2–6 strings.
7. WHEN `format` is `multi_select`, THE Quiz_Schema SHALL accept a `correctAnswers` field of type `string[]` containing all correct answers; the `correctAnswer` field SHALL NOT be used for this format.
8. WHEN `format` is `ordering`, THE Quiz_Schema SHALL accept a `correctOrder` field of type `string[]` containing options in the correct sequence; the `correctAnswer` field SHALL NOT be used for this format.
9. WHEN `format` is `grouping`, THE Quiz_Schema SHALL accept a `correctGroups` field of type `Record<string, string[]>` mapping each group label to its member items; the `correctAnswer` field SHALL NOT be used for this format.
10. WHEN `format` is `choices` or `one_way`, THE Quiz_Schema SHALL require `correctAnswer` as a non-empty string.
11. THE Quiz_Schema SHALL define `correctAnswers` (string[]), `correctOrder` (string[]), and `correctGroups` (Record<string, string[]>) as optional fields so that existing `choices`-format MDX files remain valid without modification.

---

### Requirement 3: `speed_compare` 専用データスキーマ

**User Story:** As a コンテンツ作者, I want a dedicated speedCompareData field in the schema, so that I can attach structured comparison data (Pokémon A vs Pokémon B, EV context) to speed_compare quizzes.

#### Acceptance Criteria

1. THE Quiz_Schema SHALL define an optional `speedCompareData` field for documents where `category` is `speed_compare`.
2. WHEN `speedCompareData` is present, THE Quiz_Schema SHALL validate that it contains a `pokemonA` field (string) and a `pokemonB` field (string).
3. WHEN `speedCompareData` is present, THE Quiz_Schema SHALL validate that it contains a `context` field of type string describing EV, nature, and item conditions.
4. THE Quiz_Schema SHALL NOT require `speedCompareData` for `speed_compare` questions (it remains optional for simple ○× questions that need no visual data).

---

### Requirement 4: CONTRIBUTING.md のカテゴリ・形式セクション更新

**User Story:** As a コンテンツ作者, I want CONTRIBUTING.md to reflect the new category `speed_compare` and all 5 supported formats, so that the documentation matches the implemented schema.

#### Acceptance Criteria

1. THE CONTRIBUTING.md SHALL list `speed_compare` in the `[category]` path template (セクション1) as a valid directory name.
2. THE CONTRIBUTING.md SHALL document `multi_select`, `ordering`, `grouping`, and `one_way` as valid values for the `format` property in the frontmatter property table (セクション2).
3. THE CONTRIBUTING.md SHALL document the `speedCompareData` field in セクション3 alongside `practicalData` and `tsumeData`.
4. THE CONTRIBUTING.md SHALL document the difficulty–format constraint (Basics/Advanced = choices only; Expert = choices + multi_select + ordering; Master = all 5 formats) in セクション0.

---

### Requirement 5: `basics` 難易度の `speed_compare` コンテンツ追加

**User Story:** As a quiz player, I want to answer speed_compare questions at the Basics level, so that I can learn whether Pokémon B's base Speed stat exceeds Pokémon A's.

#### Acceptance Criteria

1. THE Content_Collections SHALL contain exactly 10 quiz files with `difficulty: "basics"` and `category: "speed_compare"`.
2. WHEN a `basics/speed_compare` quiz is loaded, THE Quiz_Schema SHALL confirm `format` is `choices` (○× or 4択).
3. THE `basics/speed_compare` quiz questions SHALL compare only base Speed stats between two Pokémon that exist in `apps/web/data/champions/pokemon.json`.
4. IF a `basics/speed_compare` quiz uses `○` and `×` as the two options, THEN `correctAnswer` SHALL be either `"○"` or `"×"`.

---

### Requirement 6: `advanced` 難易度の `speed_compare` コンテンツ追加

**User Story:** As a quiz player, I want speed_compare questions at the Advanced level, so that I can practice Speed calculations that include EVs and nature modifiers.

#### Acceptance Criteria

1. THE Content_Collections SHALL contain exactly 10 quiz files with `difficulty: "advanced"` and `category: "speed_compare"`.
2. WHEN an `advanced/speed_compare` quiz is loaded, THE Quiz_Schema SHALL confirm `format` is `choices`.
3. THE `advanced/speed_compare` quiz questions SHALL reference EVs and/or nature in the question text, using Champions_EV_Format (e.g., `S32+`) where applicable.
4. ALL Pokémon referenced in `advanced/speed_compare` quizzes SHALL exist in `apps/web/data/champions/pokemon.json`.

---

### Requirement 7: `expert` 難易度の `speed_compare` コンテンツ追加

**User Story:** As a quiz player, I want speed_compare questions at the Expert level, so that I can practice Speed calculations that include items (e.g., Choice Scarf) and field conditions (e.g., Tailwind).

#### Acceptance Criteria

1. THE Content_Collections SHALL contain exactly 10 quiz files with `difficulty: "expert"` and `category: "speed_compare"`.
2. WHEN an `expert/speed_compare` quiz is loaded, THE Quiz_Schema SHALL confirm `format` is one of `choices`, `multi_select`, or `ordering`.
3. THE `expert/speed_compare` quiz questions SHALL each reference at least one of the following: held items (こだわりスカーフ等), おいかぜ, トリックルーム, or status conditions affecting Speed.
4. ALL Pokémon and items referenced in `expert/speed_compare` quizzes SHALL exist in `apps/web/data/champions/pokemon.json` and `apps/web/data/champions/items.json` respectively.

---

### Requirement 8: `master` 難易度の `speed_compare` コンテンツ追加

**User Story:** As a quiz player, I want speed_compare questions at the Master level, so that I can be challenged with complex applied Speed scenarios drawn from competitive gameplay.

#### Acceptance Criteria

1. THE Content_Collections SHALL contain exactly 10 quiz files with `difficulty: "master"` and `category: "speed_compare"`.
2. WHEN a `master/speed_compare` quiz is loaded, THE Quiz_Schema SHALL confirm `format` is one of `choices`, `multi_select`, `ordering`, `one_way`, or `grouping`.
3. THE `master/speed_compare` quiz questions SHALL each involve at least one non-trivial interaction such as combined items + EV investment + おいかぜ, or speed ordering across 3 or more Pokémon.
4. ALL Pokémon, items, and moves referenced in `master/speed_compare` quizzes SHALL exist in the Champions data files.

---

### Requirement 9: 既存クイズの難易度・形式整合性確認

**User Story:** As a content maintainer, I want all existing quiz files to conform to the difficulty–format constraints defined in CONTRIBUTING.md, so that no basics or advanced question accidentally uses expert/master-only formats.

#### Acceptance Criteria

1. THE Quiz_Schema SHALL reject any quiz file with `difficulty: "basics"` or `difficulty: "advanced"` whose `format` is `multi_select`, `ordering`, `grouping`, or `one_way`.
2. THE Quiz_Schema SHALL reject any quiz file with `difficulty: "basics"`, `"advanced"`, or `"expert"` whose `format` is `grouping` or `one_way`.
3. WHEN all existing quiz MDX files are processed by content-collections build, THE Build SHALL complete without schema validation errors.

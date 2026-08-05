# Implementation Plan: Quiz Format Expansion

## Overview

This implementation adds support for four new quiz formats (`multi_select`, `ordering`, `grouping`, `one_way`) and a new quiz category (`speed_compare`) to the Pokemetrix quiz system. The work spans schema validation updates in `content-collections.ts`, documentation updates to `CONTRIBUTING.md`, and creation of 40 new speed comparison quiz files across all difficulty levels.

## Tasks

- [x] 1. Extend schema enums and optional fields in content-collections.ts
  - Add `multi_select`, `ordering`, `grouping`, `one_way` to `format` enum
  - Add `speed_compare` to `category` enum
  - Make `correctAnswer` field optional
  - Add optional `correctAnswers` (string[]), `correctOrder` (string[]), `correctGroups` (Record<string, string[]>) fields
  - Define `speedCompareDataSchema` with `pokemonA`, `pokemonB`, `context` fields
  - Add optional `speedCompareData` field to quiz schema
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.7, 2.8, 2.9, 2.10, 2.11, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Implement schema refinement validations
  - [ ] 2.1 Add refinement for format-specific answer field validation
    - `multi_select` requires non-empty `correctAnswers` array
    - `ordering` requires `correctOrder` array with exactly 4 elements
    - `grouping` requires `correctGroups` object with at least 2 groups
    - `choices`, `one_way`, `input` require non-empty `correctAnswer` string
    - _Requirements: 2.7, 2.8, 2.9, 2.10_

  - [x] 2.2 Add refinement for options count validation per format
    - `multi_select`: 3-4 options
    - `ordering`: exactly 4 options
    - `grouping`: 3-5 options
    - `one_way`: 2-6 options
    - `choices`: 2-4 options
    - `input`: options array optional
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 2.3 Add refinement for difficulty-format constraint validation
    - `basics`/`advanced`: only `choices` allowed
    - `expert`: `choices`, `multi_select`, `ordering` allowed
    - `master`: all formats allowed
    - _Requirements: 9.1, 9.2_

- [x] 3. Update CONTRIBUTING.md Section 0 (Category, Format, and Difficulty Settings)
  - Add `speed_compare` to Practical category descriptions for all 4 difficulty levels
  - Ensure difficulty-format constraints are documented in 難易度設定 subsection
  - _Requirements: 4.4_

- [x] 4. Update CONTRIBUTING.md Section 1 (File Placement)
  - Add `speed_compare` to the `[category]` path template list
  - _Requirements: 4.1_

- x ] 5. Update CONTRIBUTING.md Section 2 (Frontmatter Property Table)
  - Update `format` row to list all 6 values: `choices`, `multi_select`, `ordering`, `grouping`, `one_way`, `input`
  - Add row for `correctAnswers` (string[], required for `multi_select`)
  - Add row for `correctOrder` (string[], required for `ordering`)
  - Add row for `correctGroups` (Record<string, string[]>, required for `grouping`)
  - _Requirements: 4.2_

- [x] 6. Update CONTRIBUTING.md Section 3 (Category-Specific Special Data)
  - Add new subsection for `speed_compare` category documenting `speedCompareData` schema
  - Include example YAML with `pokemonA`, `pokemonB`, `context` fields
  - Note that `speedCompareData` is optional for simple base stat comparison questions
  - _Requirements: 4.3_

- [x] 7. Checkpoint - Verify schema and documentation changes
  - Run `pnpm run build:content-collections` to verify schema compiles
  - Run `pnpm tsc --noEmit` to verify TypeScript types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create directory structure for speed_compare content
  - Create `apps/web/content/quiz/ja/basics/speed_compare/` directory
  - Create `apps/web/content/quiz/ja/advanced/speed_compare/` directory
  - Create `apps/web/content/quiz/ja/expert/speed_compare/` directory
  - Create `apps/web/content/quiz/ja/master/speed_compare/` directory
  - _Requirements: 5.1, 6.1, 7.1, 8.1_

- [x] 9. Create basics level speed_compare quizzes (10 files)
  - [ ] 9.1 Create speed_basics_01.mdx through speed_basics_10.mdx
    - Use `format: choices` (○× questions only)
    - Compare base Speed stats only (no EVs or items)
    - Select Pokémon pairs from Champions data with close base speeds (±5 difference)
    - Include `speedCompareData` with `context: "種族値のみ比較"` for each quiz
    - Verify all Pokémon exist in `apps/web/data/champions/pokemon.json`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Create advanced level speed_compare quizzes (10 files)
  - [x] 10.1 Create speed_advanced_01.mdx through speed_advanced_10.mdx
    - Use `format: choices` only
    - Include EV and nature modifiers using Champions format (S32+, S32, etc.)
    - Question pattern: "ポケモンA (S32+ ようき) vs ポケモンB (S32 ようき): どちらが速い？"
    - Include speed calculation in explanation section
    - Verify all Pokémon exist in Champions data
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Create expert level speed_compare quizzes (10 files)
  - [x] 11.1 Create speed_expert_01.mdx through speed_expert_10.mdx
    - Use formats: `choices`, `multi_select`, or `ordering`
    - Include at least one of: held items (こだわりスカーフ), おいかぜ, トリックルーム, or status conditions
    - Ensure at least 1 quiz uses `multi_select` format
    - Ensure at least 1 quiz uses `ordering` format
    - Verify all Pokémon and items exist in Champions data files
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Create master level speed_compare quizzes (10 files)
  - [x] 12.1 Create speed_master_01.mdx through speed_master_10.mdx
    - Use all 5 formats: `choices`, `multi_select`, `ordering`, `grouping`, `one_way`
    - Ensure at least 1 quiz uses `grouping` format
    - Ensure at least 1 quiz uses `one_way` format
    - Include complex multi-factor scenarios (combined items + EV + field conditions)
    - Verify all Pokémon, items, and moves exist in Champions data
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Checkpoint - Verify content creation
  - Run `pnpm run build:content-collections` to verify all 40 quiz files validate
  - Ensure no schema validation errors
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 14. Write unit tests for schema validation
  - [ ]* 14.1 Test format enum accepts all 5 new formats
    - Verify `multi_select`, `ordering`, `grouping`, `one_way` are accepted
    - Verify invalid formats are rejected
    
  - [ ]* 14.2 Test category enum accepts speed_compare
    - Verify `speed_compare` is accepted alongside existing categories
    
  - [ ]* 14.3 Test answer field validation per format
    - Test `multi_select` requires `correctAnswers` array
    - Test `ordering` requires `correctOrder` array with 4 elements
    - Test `grouping` requires `correctGroups` object
    - Test `choices` requires `correctAnswer` string
    
  - [ ]* 14.4 Test options count validation per format
    - Test `multi_select` requires 3-4 options
    - Test `ordering` requires exactly 4 options
    - Test `grouping` requires 3-5 options
    
  - [ ]* 14.5 Test difficulty-format constraint validation
    - Test basics/advanced accept only `choices`
    - Test expert accepts `choices`, `multi_select`, `ordering`
    - Test master accepts all formats
    
  - [ ]* 14.6 Test speedCompareData schema validation
    - Test valid `speedCompareData` with all required fields
    - Test speed_compare quiz without `speedCompareData` (optional)
    - Test rejection when required fields are missing

- [ ]* 15. Write integration tests
  - [ ]* 15.1 Test content-collections build succeeds with all quiz files
    - Verify build completes without schema validation errors
    - Verify all 40 new speed_compare files are recognized
    
  - [ ]* 15.2 Test Pokémon reference validation
    - Verify all Pokémon in speed_compare quizzes exist in Champions pokemon.json
    - Generate warnings for invalid references (don't block build)

- [ ] 16. Final verification
  - Run `pnpm lint` to check for linting errors
  - Run `pnpm tsc --noEmit` to verify no TypeScript errors
  - Run full content-collections build to verify all quizzes validate
  - Review all 40 speed_compare quiz files for calculation accuracy and question clarity

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Unit tests validate schema refinement logic at the Zod layer
- Integration tests validate real MDX files pass schema validation
- The design document uses TypeScript (not pseudocode), so all implementation will be in TypeScript
- Champions EV format uses max 32 per stat (not 252) - this MUST be followed in all quiz content
- All Pokémon, items, and moves MUST be verified against Champions data files before use

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3", "4", "5", "6"] },
    { "id": 3, "tasks": ["8"] },
    { "id": 4, "tasks": ["9.1", "10.1", "11.1", "12.1"] },
    { "id": 5, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "15.1", "15.2"] }
  ]
}
```

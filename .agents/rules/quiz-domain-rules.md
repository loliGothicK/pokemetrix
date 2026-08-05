---
description: "Rules for UI constraints, enums, text formatting, and difficulty philosophy in quizzes"
---
# Quiz Domain & UI Constraints

1. **Strict Enums for Difficulty and Category**:
   - **Difficulty**: The internal difficulty IDs are strictly `basics`, `advanced`, `expert`, and `master`. NEVER rename these in code, schemas, or MDX frontmatter. Flavor names belong EXCLUSIVELY in localization JSON files.
   - **Category**: The internal categories are strictly `academic`, `damage_calc`, and `tsume`.
2. **Premium Gamified UI**:
   - Never build simple, unstyled button lists for the quiz selection.
   - The Quiz UI must follow a premium, gamified 2-step flow: Category Selection -> Difficulty Selection.
   - Omit redundant information (e.g., if a mode always has 10 questions, do not explicitly write "10 Questions" on the UI).
3. **No Fallback Strings Refresher**:
   - Before submitting React code, explicitly double-check that you did not violate the `i18n-consistency` rule. `t("key")` ONLY.
4. **Difficulty Design Philosophy (The "1% Win Rate" Rule)**:
   - **Advanced / Expert**: These tiers are for essential, competitive mechanics. If a player would "instantly lose" a match by not knowing the mechanic (e.g., Prankster immunity for Dark-types, Fake Out turn limits, Weather stat boosts), it MUST be placed here.
   - **Master**: Strictly reserved for completely obscure, ultra-rare edge cases and useless trivia that would not affect a player's win rate by even 1% (e.g., Knock Off damage boosts on a mismatched Mega Stone, bizarre glitch interactions).
   - **Choice Obfuscation (Expert & Master)**: Do not make the options too obvious or easy to eliminate by process of elimination. Design the choices such that players must actually know the underlying mechanic to distinguish the correct answer from plausible distractors. Avoid making choices excessively "user-friendly" or spoon-fed at these high difficulties.
5. **No Internal Slugs in Text**:
   - Never leak internal data slugs (e.g., `charizard-mega-y`, `Charizard-Mega-Y`) into the user-facing text of MDX files (`question`, `options`, `correctAnswer`, or explanations). Always use the proper, localized display name (e.g., `Mega Charizard Y` or `メガリザードンY`).
6. **Bilingual Content Parity & Format Diversity**:
   - Do not rely solely on the `choices` format. Proactively utilize `multi_select`, `ordering`, `grouping`, and `one_way` to provide varied quiz experiences.
   - You **MUST** maintain strict bilingual parity. If you create, update, or move a quiz in `content/quiz/ja/`, you MUST do the exact same in `content/quiz/en/`. Divergence leads to feature imbalances between locales.

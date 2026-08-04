<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:strict-housekeeping-rules -->
# Strict Housekeeping & Clean-up

Before concluding any task or reporting completion to the user, you MUST perform the following cleanup steps:

1. **Never Report Completion Prematurely**: Do not say "I'm done" or claim a task is finished until you have actually executed, tested, linted, and typechecked your changes.
2. **Run Static Analysis & Typechecks**: Always run the project's linter (e.g., `pnpm lint`) and TypeScript compiler (e.g., `pnpm tsc --noEmit` or equivalent) to detect unused variables, missing imports, or syntax/type warnings introduced by your edits. Fix all warnings and errors you caused before stopping.
3. **Execute and Test**: Run the relevant code or tests to verify your implementation actually works in practice, rather than assuming it works based on the source code.
4. **STRICT Workspace Isolation for Scratch Scripts**:
   - **Mandatory Location**: Whenever you write a Node.js, Python, or shell script to automate a task, migrate data, or run quick tests, you **MUST** create it exclusively inside your dedicated agent scratch directory: `<appDataDir>\brain\<conversation-id>\scratch\`.
   - **Absolute Prohibition**: You are strictly forbidden from using **ANY** existing project directory for your own workspace, scratch files, or temporary testing scripts. Do not put them in `scripts/`, `src/`, `tmp/`, or anywhere else inside the workspace. **NO EXCEPTIONS.**
   - **Immediate Cleanup**: If you inadvertently create a temporary file or folder inside the project workspace, you must `rm -rf` it immediately after use to leave no trace.
5. **Clean Up Associated Dead Code**: If you remove a feature, component, or UI element, proactively search for and delete all associated dead code. This strictly includes removing orphaned localization keys from translation files (`en/translation.json`, `ja/translation.json`, etc.).
6. **Remove Temporary Debugging Code**: If you added temporary logs (e.g., `console.log`, `console.error`) or experimental code to debug an issue, you MUST remove them and restore the code to its original clean state before reporting completion.
<!-- END:strict-housekeeping-rules -->

<!-- BEGIN:i18n-consistency -->
# i18n Translation Consistency

When adding new user-facing features, components, or widgets, you MUST ensure that all new translation keys are added to ALL localization files (e.g., public/locales/ja/translation.json and public/locales/en/translation.json). Never leave raw i18n keys exposed in the UI.

**No Fallback Strings in Code**: Do NOT use i18n fallback strings in your `t()` calls (e.g., `t("quiz.result.share", "結果をXでシェア")`). All translation strings must be defined exclusively inside the localization JSON files. The `t()` function must only take the translation key as its primary string argument.
<!-- END:i18n-consistency -->

<!-- BEGIN:mui-stack-props-rule -->
# MUI Stack System Props

When writing or fixing MUI components—especially to resolve React DOM prop warnings like "React does not recognize the `alignItems` prop on a DOM element":
1. **Use `sx` for System Props**: Do NOT pass layout system props (e.g., `alignItems`, `justifyContent`) as direct props on `<Stack>`. Always pass them inside the `sx` prop instead (e.g., `<Stack direction="row" sx={{ alignItems: 'center' }}>`).
2. **Preserve Component Semantics**: Do NOT lazily replace `<Stack>` with `<Box sx={{ display: 'flex' }}>` just to bypass the warning. Maintain the user's semantic choices.
<!-- END:mui-stack-props-rule -->

<!-- BEGIN:frontend-telemetry-rule -->
# Frontend Telemetry & Error Handling (OTel & Sentry)

When creating or modifying frontend services (e.g., fetching or mutating data in `services/*.ts`), you MUST implement proper observability and error handling. NEVER throw generic errors and expect the user to debug via browser console.
1. **Trace Operations**: Wrap asynchronous operations using `withSpan` from `@/lib/otel`. Use a consistent naming convention like `ui.<domain>.<action>`.
2. **Capture API Errors**: If an API response is not `ok`, extract the error text (e.g., `res.text()`) and use `Sentry.captureException(err, { extra: { ... } })` to send the failure to Sentry. Include relevant context in the `extra` field, such as `res.status`, `dashboardId`, and the request payload. Mark the OTel span as failed (`span.setAttribute("error", true)`).
<!-- END:frontend-telemetry-rule -->

<!-- BEGIN:pokemon-domain-constraint-rule -->
# Domain Context: Pokémon Champions

This entire application strictly targets "Pokémon Champions", which is EXCLUSIVELY a Double Battle (VGC) format.
1. **Strict Metagame Validity**: The Pokémon Champions metagame is a highly restricted custom format. Do NOT rely on general Pokémon knowledge (e.g., assuming Zapdos or Tapu Lele exists). You MUST verify that ANY Pokémon, item, or move you use in tests, quizzes, code, or seed data actually exists in this specific environment.
2. **Source of Truth**: Always check the explicit data files before referencing entities:
   - Pokémon: `apps/web/data/champions/pokemon.json` and `apps/web/data/champions/regulations.ts`
   - Items: `apps/web/data/champions/items.json`
   - Moves: `apps/web/data/champions/moves.json`
3. **Champions EV Format**: EVs in this domain are capped at **32 per stat** and **66 in total** (unlike standard Pokémon EVs of 252/510). Whenever you write EV data (e.g., in quizzes, mock data, or tests), you MUST use this 32-based scale. For example, use `"A32+"` or `"H32 B32+"` instead of `"A252+"`, and use `"H2"` for leftovers instead of `"H4"`.
4. **Double Battle Primitives**: Do not assume 1v1/Singles contexts. Quiz schemas explicitly use 2v2 concepts (`playerSide` arrays, `ally`, `opponentAlly`). Whenever you update a schema or data structure, you MUST proactively ensure that any validation scripts are also updated to parse the new fields. Silent validation failures will lead to domain contamination.
<!-- END:pokemon-domain-constraint-rule -->

<!-- BEGIN:mui-responsive-overrides -->
# Responsive Styling & Snapshot Testing

1. **Mandatory Snapshot Testing**: If a requested style change is restricted to a specific viewport (e.g., mobile only or desktop only), **you MUST write and run a snapshot test for the component to lock in the baseline appearance of the unaffected viewport BEFORE making any changes to the source code.** You are forbidden from beginning the work until this snapshot test is established. Failure to do so will result in immediate denial of the task.
2. **Safe Mobile Overrides**: When applying mobile-specific overrides to an existing component's `sx` prop, **do NOT explicitly re-declare the desktop (`md`) value** unless you are completely altering the behavior. Use `{ xs: 'override' }` and omit `md`. This ensures the desktop view safely inherits the component's original defaults without accidentally stripping properties.
3. **Hidden Utility Padding**: When debugging stubborn margin/padding issues, check if custom styled wrappers or utility functions (like `rounded()`) are injecting silent `px` or `py` values. You must explicitly override these (e.g., `p: 0`) rather than just removing padding from parent containers.
<!-- END:mui-responsive-overrides -->

<!-- BEGIN:quiz-domain-rules -->
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
<!-- END:quiz-domain-rules -->

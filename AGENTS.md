<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:strict-housekeeping-rules -->
# Strict Housekeeping & Cleanup

Before concluding any task or reporting completion to the user, you MUST perform the following cleanup steps:

1. **Never Report Completion Prematurely**: Do not say "I'm done" or claim a task is finished until you have actually executed, tested, linted, and typechecked your changes.
2. **Run Static Analysis & Typechecks**: Always run the project's linter (e.g., `pnpm lint`) and TypeScript compiler (e.g., `pnpm tsc --noEmit` or equivalent) to detect unused variables, missing imports, or syntax/type warnings introduced by your edits. Fix all warnings and errors you caused before stopping.
3. **Execute and Test**: Run the relevant code or tests to verify your implementation actually works in practice, rather than assuming it works based on the source code.
4. **Remove Temporary Files**: If you created any temporary scripts (e.g., node scripts to parse JSON or test logic) inside the project directory, you MUST delete them immediately after use.
5. **Clean Up Associated Dead Code**: If you remove a feature, component, or UI element, proactively search for and delete all associated dead code. This strictly includes removing orphaned localization keys from translation files (`en/translation.json`, `ja/translation.json`, etc.).
<!-- END:strict-housekeeping-rules -->

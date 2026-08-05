---
description: "Rules for housekeeping, testing, and cleanup before reporting task completion"
---
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

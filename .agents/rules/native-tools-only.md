---
trigger: always_on
description: "Enforce strict usage of native tools for reading, listing, and editing files to prevent unnecessary command approval prompts."
---

# STRICT NATIVE TOOLS ONLY

To avoid triggering unnecessary execution approval prompts (user bottlenecks) when communicating with the host OS, you MUST strictly adhere to the following rules:

1. **Analysis & Reading**: You are ABSOLUTELY PROHIBITED from using `run_command` to execute `cat`, `ls`, `grep`, `Select-String`, `find`, or inline scripts (`node -e`, `python -c`) for the purpose of analyzing the workspace.
   - Use `view_file` instead of `cat`.
   - Use `list_dir` instead of `ls` or `dir`.
   - Use `grep_search` instead of `grep` or `Select-String`.
   - Use `find_by_name` instead of `find`.

2. **Editing**: You are ABSOLUTELY PROHIBITED from using throwaway terminal scripts (Bash, sed, PowerShell, node scripts) to edit, generate, or manipulate files.
   - Use `replace_file_content` or `write_to_file` exclusively for code modifications.

3. **Permitted Commands**: `run_command` is strictly reserved for necessary project tasks that *must* run in a shell, such as `pnpm install`, `pnpm build`, `pnpm typecheck`, or running test suites.

By following this rule, you ensure the user is not spammed with approval prompts for actions you can perform natively.

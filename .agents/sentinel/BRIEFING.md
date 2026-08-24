# BRIEFING — 2026-08-22T17:36:05Z

## Mission
Coordinate and monitor the port of 199 Abilities, 148 Items, and Move Volatiles to Rust engine with full equivalence testing.

## 🔒 My Identity
- Archetype: sentinel
- Working directory: d:\workspace\pokemetrix\.agents\sentinel
- Orchestrator: 6b9bbfbd-ba4e-4bf2-a413-67eae4d47c37
- Victory Auditor: to be spawned on victory claim

## 🔒 Key Constraints
- No technical decisions — relay only
- Victory Audit is MANDATORY before reporting completion
- Zero Error Policy: pnpm typecheck, pnpm build, vitest tests 0 errors

## User Context
- **Last user request**: Port 199 Abilities, 148 Items, and Move Volatiles/Secondary effects from @pkmn/sim to Rust engine (packages/engine/src/sim/*.rs) with vitest equivalence testing.
- **Pending clarifications**: none
- **Delivered results**: none

## Project Status
- **Phase**: in progress
- **Route Chosen**: General (`teamwork_preview_orchestrator`) — large multi-component SWE porting & equivalence task.
- **Monitoring Tasks**:
  - Cron 1 (Progress Reporting */8m): task-15
  - Cron 2 (Liveness Check */10m): task-17

## Victory Audit Status
- **Triggered**: no
- **Verdict**: pending
- **Retry count**: 0

## Artifact Index
- d:\workspace\pokemetrix\.agents\ORIGINAL_REQUEST.md — Authoritative original user request record
- d:\workspace\pokemetrix\.agents\sentinel\BRIEFING.md — Sentinel state memory
- d:\workspace\pokemetrix\.agents\teamwork_preview_orchestrator_1/ — Active orchestrator workspace

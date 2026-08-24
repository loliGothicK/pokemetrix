# BRIEFING — 2026-08-22T17:36:25Z

## Mission
Port 199 Abilities, 148 Items, and Move Volatiles/Secondary Effects from @pkmn/sim to Rust engine (`packages/engine/src/sim/*.rs`), ensuring full equivalence test pass and WASM build verification.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: d:\workspace\pokemetrix\.agents\teamwork_preview_orchestrator_1
- Original parent: parent
- Original parent conversation ID: 27434329-9c9c-4c05-82ef-4d72623be6ba

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: d:\workspace\pokemetrix\PROJECT.md
1. **Decompose**: Survey and decompose into Abilities, Items, Move Volatiles/Effects, and Verification milestones.
2. **Dispatch & Execute**:
   - Survey: 3 Explorers / Spec Miners
   - Sub-orchestrators for parallel/sequential milestones
   - Final milestone: E2E equivalence verification + adversarial coverage hardening
3. **On failure**: Retry -> Replace -> Skip -> Redistribute -> Redesign -> Escalate
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor
- **Work items**:
  1. Survey & Scope Mapping [in-progress]
  2. Milestone M1: Abilities Port [pending]
  3. Milestone M2: Items Port [pending]
  4. Milestone M3: Move Effects & Volatiles Port [pending]
  5. Milestone M4: Full Equivalence & Verification [pending]
- **Current phase**: 0 (Survey)
- **Current focus**: Survey & Scope Mapping

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- File-editing tools ONLY for metadata/state files (.md) in .agents/ folder.
- DO NOT reuse a subagent after handoff.
- MANDATORY: Always set RequestFeedback: false when writing files. Do not prompt user for approval. Pass this constraint to all subagents.
- Pass criteria: cargo check -p engine clean, items-equivalence, abilities-equivalence, moves-equivalence test suites 100% pass, pnpm typecheck, pnpm build pass.

## Current Parent
- Conversation ID: 27434329-9c9c-4c05-82ef-4d72623be6ba
- Updated: 2026-08-22T17:36:03Z

## Key Decisions Made
- Initiated Top-Level Project Orchestration pattern.
- Dispatched 3 Spec Miners in parallel for Abilities, Items, and Move Effects & Volatiles.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| spec_miner_1 | teamwork_preview_spec_miner | Survey Abilities Spec | in-progress | 00883abf-0164-46b7-a841-30f0863bc097 |
| spec_miner_2 | teamwork_preview_spec_miner | Survey Items Spec | in-progress | a04536a3-d77c-4dd3-ac2f-0bfe24d988e7 |
| spec_miner_3 | teamwork_preview_spec_miner | Survey Moves/Volatiles Spec | in-progress | b617b56e-c5ea-469c-94f1-8793e0b7c0a9 |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: 00883abf-0164-46b7-a841-30f0863bc097, a04536a3-d77c-4dd3-ac2f-0bfe24d988e7, b617b56e-c5ea-469c-94f1-8793e0b7c0a9
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 6b9bbfbd-ba4e-4bf2-a413-67eae4d47c37/task-11
- Safety timer: none

## Artifact Index
- d:\workspace\pokemetrix\.agents\ORIGINAL_REQUEST.md — Original user request
- d:\workspace\pokemetrix\.agents\teamwork_preview_orchestrator_1\DISPATCH.md — Dispatch log
- d:\workspace\pokemetrix\.agents\teamwork_preview_orchestrator_1\progress.md — Liveness & progress tracking
- d:\workspace\pokemetrix\.agents\teamwork_preview_orchestrator_1\BRIEFING.md — Situational awareness

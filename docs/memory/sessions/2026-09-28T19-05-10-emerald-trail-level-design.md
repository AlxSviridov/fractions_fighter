# Session 2026-09-28T19-05-10: emerald-trail-level-design

## Intent

Owner request: "Please do a proper level design for this game with a proper repository of tasks. Level should feel like a real game, not like a placeholder. It should be interesting to play. You need to update documentation etc."

"Repository of tasks" was read two ways, and both are delivered: (1) a repository of in-game maths tasks for the level's puzzles (`src/game/taskBank.ts`, `docs/TASK_BANK.md`), and (2) a tracked list of level-design work items (BACKLOG section "Chapter I level design", LD-1…LD-16).

## Changes

- `src/game/level.ts` (new): Chapter I "The Emerald Trail". 8 areas, 4 gates, 9 enemies (5 minion, 3 elite, 1 boss) with wind-up lines, 14 objects, 5 critical-path objectives, grid pathfinding with clearance and blocking-gate explanations, pure progression rules.
- `src/game/taskBank.ts` (new): 63 authored untimed puzzles with oracle expressions; `drawTask` rotation; `taskQuestion` wrapper.
- `src/game/rpg.ts`: enemies from level data (`key`, `region`, `rank`, `tell`); `resolved` progress; `interactObject`/`objectStatus`; access-gated attacks; quest ready on the boss kill; objective-based progress; story persistence across expeditions; `trail-`/`cache-` loot IDs; legacy five-enemy migration.
- `src/game/world.ts`: new level terrain per area (waterfall, camp, hollow, river, rope bridge, stockade palisade, outpost, cove, antechamber, sanctum, temple); dynamic gates and objects with animations and markers; follow camera and sun; path-following, sub-stepped movement with a re-plan fallback; chunked static batching for frustum culling; legacy landmark seals removed from the wilds.
- `src/App.tsx`, `src/components/TrailMap.tsx` (new), `MathEncounter.tsx`, `World.tsx`, `fighter.css`: trail map (M), objective card and Guide me there, region banners, interaction prompt (E), object dialog, points-of-interest list, threats-in-reach tracker, puzzle labels, gated threat timer, build 0.4 label.
- `src/game/math.ts`: answers accept thousands separators (`2,852`).
- Tests: new `level.test.ts` and `taskBank.test.ts`; updated `rpg`, `defence` and `inventoryMigration` tests; the e2e journey was rewritten for the whole level (with a 12-minute test timeout). Playwright honours `FF_CHROMIUM_PATH`. CI job timeout raised to 30 minutes.
- Docs: new LEVEL_DESIGN.md, TASK_BANK.md and decision 0005; updated GAME_DESIGN, ARCHITECTURE, TESTING, README, ENGINE_PLAN, STATE and BACKLOG.

## Decisions and rationale

See decision 0005. Authored data over procedural terrain, because pacing matters more than size. Gate topology is declared and proven by tests. The quest ends on the boss so optional content stays optional. World puzzles are authored so they can be story-framed and reviewed. Trees on the camera-facing edge become undergrowth so they don't hide the hero.

## Validation and evidence

- `npm test`: 100/100 across 14 files; `npm run build` passes; `npx prettier --check .` is clean.
- Full-level browser journey passed in real Chromium (software WebGL, 1024×640 local override config, `/opt/pw-browsers/chromium`) in 5.5 minutes.
- A first attempt exposed a real bug: grid paths could hug a rectangle edge exactly, and float drift then stopped the hero at the bridge head. Fixed with 0.35-unit route clearance, edge-tolerant arrival and a single re-plan on a hard block. The rerun passed.
- The container renders at about 1–3 fps; the baseline commit measured the same, so this is not a regression. Movement is now sub-stepped (≤ 0.2 units) so a slow frame cannot skip a 0.5-unit gap between areas.
- Screenshots inspected: Waterfall Landing, the Fern Hollow bridge after lowering, the cleared Shard Sanctuary.
- Other six browser tests: 6/6 passed on the level build (full-suite run, 6.9 min) after two harness races were fixed. Both are documented in TESTING.md:
  1. **Ward test** (pre-existing): it failed 1 of 3 runs on the untouched baseline commit too. The trace showed a 22-second `Deselect target` click at 1 fps, during which a ward opened and expired. The test now waits for the ward immediately and uses the game's "Let me think" pause for the block case; after that change it passed.
  2. **Journey test** (new): after a travel ward, walking resumed and the Bridge Winch dialog opened, but the helper expected no dialogs. `handleTravelWard` now waits only for the ward dialog to close. Rerun: journey passed (7.5 min).
- Final full-suite run on the final code: **7/7 passed (8.9 min)**, real Chromium with software WebGL at 1024×640.
- Also fixed: entering the wilds reused the village position for region/threat checks (a wrong banner could flash). Position now resets to the spawn point on travel.

## Known limitations / blockers

- Legacy combat (stationary enemies, quick/power/ritual) is unchanged; the level's enemies differ in stats, size and wind-up text only.
- The Sanctum Door is maths-sealed, not spell-only (owner MATH-3c/P16 still open).
- The 63 prompts were authored and oracle-checked by the same agent; no independent human or agent maths review yet.
- The sanctum portal was lowered after a screenshot showed it partly hiding the boss fight; other edge occlusion is still possible (LD-15).
- The 200-item cap still converts overflow to gold; more loot per expedition makes P3b more urgent.
- Timings are untested with a child.

## Exact next steps

1. Open a PR so CI runs the full suite on the level; fix anything red.
2. LD-9 independent maths review; LD-10 child playtest with the LEVEL_DESIGN questions.
3. ENGINE_PLAN P3b, then P4+ resource combat; LD-12 spell condition for the Sanctum Door when spells exist.

## Model and delegation

Root session only; no subagents were launched. The environment's own instructions say not to spawn agents unless the user asks, and the work was tightly coupled across data, renderer and UI. Model identity is recorded in chat, not in the repository.

## Git and deployment

Branch `claude/trusting-hypatia-ezco3m`, based on 39d3c56. Commit and push status are recorded in the final commit on this branch. No Firebase deployment. No billing.

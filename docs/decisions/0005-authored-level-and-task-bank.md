# 0005 — Authored level data, gate topology and a reviewed task bank

Date: 2026-09-28. Status: implemented (build 0.4).

## Context

The owner asked for "a proper level design … with a proper repository of tasks", and said the level should feel like a real game rather than a placeholder. The previous wilds was one clearing with five always-reachable stationary enemies, decorative landmarks and no gating. The owner's earlier feedback had already asked for "more interesting level design" and "deliberate routes, discoveries and encounter identities". ENGINE_PLAN P13–P17 planned chests, gates and quest pacing, but only after the resource-combat rework.

## Decision

1. **Level as pure data (`src/game/level.ts`).** Regions are unions of axis-aligned rectangles. Gates are rectangles that are walkable only while open. Objects and enemies have fixed authored positions. Navigation (walkability, grid Dijkstra with clearance, smoothing, blocking-gate explanation) and progression (open gates, object availability, objectives) are pure functions shared by the renderer, the RPG rules and the tests. The renderer never decides progress.
2. **Gate topology is declared and verified.** Each region lists the gates it needs, and tests prove that this matches physical connectivity: opening gates in order unlocks exactly the declared regions, and closing any single gate cuts off exactly what lies beyond it.
3. **Progress is `RpgState.resolved: string[]`** (resolved object IDs) plus existing enemy HP. Objects declare `persistence: 'story' | 'expedition'`. On a new expedition, story IDs are kept (bridge, code lock, lore), and chests, the shrine and the seals reset. The outer save version stays 1; a missing `resolved` means `[]`.
4. **The quest completes when the boss falls,** not when every enemy is cleared. The critical path is winch → code lock → Captain Redsail → three seals → Shard Guardian. Everything else is optional and counted.
5. **Rules reject unreachable targets.** `attackEnemy` ignores enemies in regions whose gates are closed. `interactObject` checks region access and requirements (e.g. the strongbox needs the captain defeated). Wrong puzzle answers never cost health or resolve the object.
6. **World puzzles come from an authored task bank (`src/game/taskBank.ts`),** not the generators. 7 pools × 3 bands × 3 variants, each with an independent `oracle` expression that tests evaluate with exact rationals. Variants rotate per expedition.
7. **Legacy save migration.** Saves with the old five keyless enemies migrate to the nine-enemy trail. A fully cleared old trail maps to a fully cleared new one, so a ready or claimed quest keeps its state. A partially cleared old trail restarts fresh. Items, XP and gold are untouched. New enemy loot IDs use a `trail-` prefix so they can't collide with old `loot-` IDs.
8. **Performance.** Static scenery batches are split into spatial chunks so they can be frustum-culled across the longer level. Movement is sub-stepped at 0.2 units so low frame rates can't skip walls.

## Alternatives considered

- **Procedural or streamed terrain now.** Rejected for Chapter I: ARCHITECTURE already notes that infinite randomness without pacing is not a game. The data format allows later chapters or procedural fill between authored beats.
- **Navmesh library.** Unnecessary for rectangle unions. A 0.5-unit grid over 32 × 69 units is about 8.8k cells, and Dijkstra over it costs well under a millisecond on a laptop.
- **Generated puzzle maths.** Rejected for world puzzles because story-framed multi-step prompts need authoring and review. Combat keeps its generators.
- **Requiring every enemy for the quest.** Rejected. It turns optional content into chores, and it is the "click the five names" loop the owner rejected.

## Consequences

- ENGINE_PLAN P13 (a persistent claim-once chest) and parts of P15/P17 (typed objectives, encounter identities and pacing) are delivered early in legacy combat. P16's spell-only door is **not** delivered; the Sanctum Door is maths-sealed. When spells land, add a spell-tagged gate condition rather than a new system.
- Tests that assumed five enemies, `loot-*` IDs or all-enemy quest completion were updated.
- The e2e journey matches puzzle prompts to the bank for answers; the unit oracle keeps that honest.
- The inherited 200-item cap still converts overflow to gold. More loot per expedition (up to 13 items) reaches it sooner, so P3b claimable rewards becomes more urgent.

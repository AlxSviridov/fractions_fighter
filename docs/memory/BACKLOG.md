# Progress tracker

Updated 2026-09-28 (Chapter I level design added; earlier items from 2026-09-13). Full owner requests are retained in `../feedback/2026-09-13-owner-review.md` and `../feedback/2026-09-13-combat-and-equipment-review.md`. The original slice was rejected; checked implementation is not owner acceptance.

## Owner list — implemented in build 0.3

- [x] Clickable local launcher: `Launch Fractions Fighter.command` (previous execution verified; always rebuilds current source).
- [x] Main menu, New Game → character creation, Continue, separate hero Load Game, Settings.
- [x] Persistent inventory/equipment, guaranteed enemy loot, rarity, XP/levels/gold, quest rewards.
- [x] Diablo-inspired illustrated item grid, hero equipment slots and stat comparisons (three slots, no drag-and-drop spatial packing).
- [x] Immediate enemies and separate safe Haven village.
- [x] Prominent labelled Return to Haven with health restoration.
- [x] Thematic locally bundled fonts; original Shattered Compass story and Fractions Fighter name.
- [x] Six reference portraits and distinct procedural 3D hero silhouettes, three classes; identity chosen before play.
- [x] Action-tier maths: close quick comparisons, harder untimed power calculations, deeper untimed rituals.
- [x] Optional falling comparison minigame with hints/relaxed/reduced-motion support.
- [x] Close comparison gaps independently verified; no trivial same-denominator or widely separated pairs in current pool.
- [x] Enemies initiate telegraphed attacks; ward answer blocks, wrong/expired ward applies explicit armour mitigation.
- [x] Authored river crossing/far-bank shelf, pirate outpost and guardian sanctuary; improved attack effects, single real guardian.
- [x] Economical specialist roster, explicit Terra defaults, independent maths review and critical simulated playtesting documented.

## Final verification for this increment

- [x] Independent new maths review: 23 focused tests pass.
- [x] Root browser inspection of hero creation, village/wilds, successful ward, inventory art, laptop layout and pointer escape from telegraph.
- [x] Final unit + strict TypeScript + production build: 71 tests and build pass in P1.
- [x] Full expedition → loot/equip → quest reward → reload/export/import: full 5-test browser suite passed.
- [x] Separate heroes/settings/keyboard/compact layout and enemy defence regressions: browser suite passed.
- [x] P1 code + tracker + session pushed as c557253.
- [ ] Confirm green GitHub CI after P3 route-preservation fix. P2 run 34824017079 still failed; see latest session note.
- [ ] Verified Firebase Hosting release and live smoke test.

## Chapter I level design — The Emerald Trail (build 0.4, 28 September 2026)

Design: [LEVEL_DESIGN.md](../LEVEL_DESIGN.md). Tasks: [TASK_BANK.md](../TASK_BANK.md). Decision: [0005](../decisions/0005-authored-level-and-task-bank.md).

- [x] LD-1 Pure level data: 8 areas, 4 gates, 9 encounters (minion/elite/boss), 14 objects, 5 critical-path objectives.
- [x] LD-2 Pathfinding with clearance and blocked-gate explanations; declared gate topology proven by tests.
- [x] LD-3 Object rules: claim-once chests, boss-gated strongbox, shrine, lore, mechanisms, seals; story vs expedition persistence; safe wrong answers.
- [x] LD-4 Task repository: 63 authored untimed puzzles (7 pools × 3 bands × 3) with independent oracle tests and per-expedition rotation.
- [x] LD-5 Renderer: authored scenery per area, river and rope bridge, stockade, cove, antechamber, sanctum; animated gates, chests and markers; follow camera; chunked batching.
- [x] LD-6 HUD: trail map (M), objective card with Guide me there, region banners, E/click interaction prompt, points-of-interest list, threats-in-reach tracker, object dialog.
- [x] LD-7 Save migration from the five-enemy trail; unit tests (level, task bank, updated RPG/defence) pass.
- [ ] LD-8 Full browser suite green on the new level in CI (local software-rendered run evidence in STATE).
- [ ] LD-9 Independent maths review of all 63 prompts (wording, reading load, 11+ fit). See TASK_BANK review record.
- [ ] LD-10 Real child playtest using the LEVEL_DESIGN playtest questions; time each area; tune HP, threat radius and puzzle bands.
- [ ] LD-11 Grow the bank to ≥ 5 variants per pool/band so replays repeat less.
- [ ] LD-12 Spell-only Sanctum Door condition once P11–P12 spells exist (MATH-3c/P16).
- [ ] LD-13 Distinct enemy behaviours per area (P6/P17): boar charge, lookout ranged, sentinel area slam, captain two-phase.
- [ ] LD-14 NPC on the trail (e.g. a stranded explorer at Tide Ford) with a side quest using the P15 quest state.
- [ ] LD-15 Occlusion pass: fade trees between camera and hero instead of relying on the undergrowth-only camera edge.
- [ ] LD-16 Chapter II data set (river delta / corsair fleet) reusing the level format.

## Next meaningful gameplay increments

- [x] Reward exploration: a real optional discovery/chest, persistent claim-once reward and route choice. Delivered by the Emerald Trail (LD-3).
- [ ] Distinct enemy telegraphs/attack patterns and a short free-action charge experiment; reduce repeated quiz interruptions.
- [ ] Useful village forge/shop economy, equipment tradeoffs and loot rotation; gold currently accumulates.
- [ ] Extend compact map into a paced 20–30 minute story arc with side quests and authored discoveries.
- [ ] More character silhouettes and authored equipment/animation; full hair/body/accessory customisation and 3D creation preview.
- [ ] Expand comparison pool with exact constrained generation; more intelligent multi-step 11+ word problems, fraction operations, ratios and reviewed coverage.
- [ ] Stepwise long-division workspace and geometry diagrams.
- [ ] Owner/child playtest: comprehension, voluntary continuation, reward value and timing accessibility. Commercial-quality experience remains an unmet acceptance goal.
- [ ] Tablet performance/accessibility beyond compact responsive checks.

## Later systems

- [ ] Topic-affinity effects, wear, skill tree and conservative adaptive practice.
- [ ] Deterministic streamed biomes/chunks and reachable quests.
- [ ] Parent-owned cloud profiles, conflict-safe saves and security tests.

## Superseding execution order

14 September handoff: P3 spatial pack and village-only stash are implemented. The old next-action paragraph below is superseded: inspect the pushed P3 CI result, then start P3b global-cap claimable rewards in a fresh session. Owner requested stopping after the current piece. Explicit MATH-3a–3d acceptance checklists now appear in ENGINE_REWORK section 3 and ENGINE_PLAN; melee stamina/arithmetic, arrow crafting/fire/frost, geometry mana/mixed-topic powerful spells/spell-only quests, and defence-only timed facts are all required and still pending implementation.

Follow [ENGINE_PLAN.md](../ENGINE_PLAN.md), P1 through P18, using [ENGINE_REWORK.md](../ENGINE_REWORK.md) as the contract. This replaces the ordering above and retires per-attack quick maths as the long-term combat model. Planning and P1 character/equipment sheet complete; P2 spatial inventory domain/migration implemented; P3 spatial UI/stash/full-pack recovery is next after validation/push. Existing build-0.3 final release verification remains outstanding.

- [ ] Owner-added merchant progression: maths purchases for equipment/cosmetics, white/blue/gold challenge tiers, long tricky gold tasks, NPC buying/selling, then green sets/synergy. Detailed delivery P16a–P16c in ENGINE_PLAN.

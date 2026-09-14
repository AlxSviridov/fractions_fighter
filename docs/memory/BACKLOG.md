# Progress tracker

Updated 2026-09-13. Full owner requests are retained in `../feedback/2026-09-13-owner-review.md` and `../feedback/2026-09-13-combat-and-equipment-review.md`. The original slice was rejected; checked implementation is not owner acceptance.

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
- [ ] P1 code + tracker + session push and fresh GitHub CI confirmation.
- [ ] Verified Firebase Hosting release and live smoke test.

## Next meaningful gameplay increments

- [ ] Reward exploration: a real optional discovery/chest, persistent claim-once reward and route choice. Current beacon/shrines are scenery only.
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

Follow [ENGINE_PLAN.md](../ENGINE_PLAN.md), P1 through P18, using [ENGINE_REWORK.md](../ENGINE_REWORK.md) as the contract. This replaces the ordering above and retires per-attack quick maths as the long-term combat model. Planning and P1 character/equipment sheet complete; P2 spatial inventory domain is next. Existing build-0.3 final release verification remains outstanding.

- [ ] Owner-added merchant progression: maths purchases for equipment/cosmetics, white/blue/gold challenge tiers, long tricky gold tasks, NPC buying/selling, then green sets/synergy. Detailed delivery P16a–P16c in ENGINE_PLAN.

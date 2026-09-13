# Engine rework — bite-size delivery plan

13 September 2026. Contract: ENGINE_REWORK.md. Each numbered increment gets relevant checks, STATE/BACKLOG/session evidence, a commit and a push. Checkboxes mean verified implementation, not design approval. Do not attempt the entire redesign as one opaque change.

## Foundation and inventory first

- [x] P0. Document superseding owner requirements, gameplay rules, architecture and this plan; preserve inherited unfinished work in a labelled checkpoint.
- [ ] P1. Character/equipment sheet: real stat breakdown, full item comparison, equip/unequip, selection/focus and accessible paper-doll layout. Test stat changes and item conservation; inspect laptop UI. Keep legacy inventory storage intact.
- [ ] P2. Spatial inventory domain: 10 × 4 placements, item footprints, move/swap/cancel, separate equipped ownership, capacity and Haven stash; migrate legacy saves without item loss. Pure tests for overlaps, invalid slots and conservation.
- [ ] P3. Spatial inventory UI: pointer and keyboard placement, hover/focus tooltip, full-pack recovery, stash. Add equipment slots only with real loot and rules. Browser tests for reload and small screens.
- [ ] P4. Persistent combat HUD: health/mana globes, stamina, ammunition, action selection and belt. Resource fields/migration introduced with tested limits; no fake functioning controls.

## Moving enemies and direct combat

- [ ] P5. Extract authoritative fixed-step world state/commands and unified pause reasons. Bridge rendering and preserve current flow. Tests prove paused time does not move entities or tick clocks.
- [ ] P6. First chasing melee enemy: patrol/alert/chase/wind-up/strike/recovery/leash, obstacles and shared position source. Verify approach, escape, one hit per attack and no village threats.
- [ ] P7. Direct melee attacks with stamina cost, range/cooldown checks and untimed arithmetic recharge. Remove legacy per-strike maths. Independently review new prompts and verify recharge during enemy wind-up.
- [ ] P8. Replace old defence comparisons with simple quick facts/comparisons; sole timed maths path, explicit assisted mode, expiry/cancel damage and serialized incoming hits. Test hidden-tab and simultaneous attacks.

## Ranged and magic

- [ ] P9. Bow release/projectile hit, normal ammunition and arithmetic crafting. Validate misses, target death, resource exhaustion and refill caps.
- [ ] P10. Fire/frost arrows: harder crafting, explicit quiver selection, shared status clock, freeze resistance and once-only damage-over-time rewards.
- [ ] P11. Mana, geometry recharge with diagrams/text alternatives and direct basic spell. Independently review units/answers; test zero/full mana, hint and reload.
- [ ] P12. Powerful spell: hard mixed-topic question, mana-on-commit, locked target, cancel/retry/idempotency; spell-tagged world event for quest gates.

## World interaction and quests

- [ ] P13. Shared proximity interaction controller, labels and keyboard access; convert one chest into persistent claim-once treasure with full-pack recovery.
- [ ] P14. Working recharge altar and village well; visible effect, pause, bounded blessing and persisted activation where appropriate.
- [ ] P15. Typed quest state/objectives and migration; interactive Mira with !/? markers, acceptance/dialogue/journal and once-only turn-in.
- [ ] P16. Ivo's spell lesson and sealed-door quest: guaranteed focus for every class, mana refill, spell-only opening, persistent door and reachable route.
- [ ] P17. Raider/lookout/guardian attack distinctions, authored encounter pacing, loot and resource balance. Playtest ordinary action bursts versus thinking interruptions.
- [ ] P18. Release pass: full expedition, all resources, defence, objects, quests, save/export/import, parent evidence, accessibility/reduced motion. Full check + e2e, critical playtest report, owner review; then verified Firebase release/live smoke.

## Current starting point and constraints

Baseline at planning time: main at 0d75013 plus inherited uncommitted build-0.3 combat/equipment/world work. Preserve it; do not claim inherited final browser verification. Three slots and list-backed inventory currently work; enemies are stationary and attacks use old quick/focus/ritual questions. Existing tests preserve that baseline until the corresponding increment intentionally replaces it. Node 22 is pinned; local runtime previously reported Node 25. No deployment belongs to the planning checkpoint.

First execution target: P1 only, a visible useful inventory/stats improvement without coupling it to an unfinished combat rewrite. Subsequent sessions take the next unchecked increment. Update this file when actual evidence changes.

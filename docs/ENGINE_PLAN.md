# Engine rework — bite-size delivery plan

13 September 2026. Contract: ENGINE_REWORK.md. Each numbered increment gets relevant checks, STATE/BACKLOG/session evidence, a commit and a push. Checkboxes mean verified implementation, not design approval. Do not attempt the entire redesign as one opaque change.

## Foundation and inventory first

- [x] P0. Document superseding owner requirements, gameplay rules, architecture and this plan; preserve inherited unfinished work in a labelled checkpoint.
- [x] P1. Character/equipment sheet: real stat breakdown, full item comparison, equip/unequip, selection/focus and accessible paper-doll layout. Test stat changes and item conservation; inspect laptop UI. Keep legacy inventory storage intact.
- [x] P2. Spatial inventory domain: 10 × 4 placements, item footprints, move/swap/cancel, separate equipped ownership, capacity and Haven stash; migrate legacy saves without item loss. Pure tests for overlaps, invalid slots and conservation.
- [x] P3. Spatial inventory UI: pointer and keyboard placement, selected-item details, 40-cell pack overflow to stash. Dedicated hover/focus tooltips remain a refinement. Add equipment slots only with real loot and rules. Browser tests for reload and small screens.
- [ ] P3b. Replace the inherited 200-owned-item automatic gold conversion with persistent claimable rewards and a safe way to make storage room. Test once-only recovery and next-expedition persistence.
- [ ] P4. Persistent combat HUD: health/mana globes, stamina, ammunition, action selection and belt. Resource fields/migration introduced with tested limits; no fake functioning controls.

## Moving enemies and direct combat

Owner maths acceptance checklist (all still unimplemented in the legacy combat):

- [ ] MATH-3a / P5+P7: melee hits spend stamina; XXX × YY or similarly complex division refills it; full world pause, no timer. Verify spending once, correct refill, wrong-answer retry and paused enemy/projectile/status clocks.
- [ ] MATH-3b / P9+P10: shots spend arrows; comparable arithmetic refills normal arrows; harder maths grants fire/frost arrows, with frost actually freezing enemies. All crafting untimed with full pause; test ammunition counts and status effects.
- [ ] MATH-3c / P11+P12+P16: simple spells spend mana; geometry refills it; powerful spells need mana plus additional complex mixed-topic maths. All spell maths untimed with full pause. Ship a spell-required door quest and verify weapons cannot bypass it.
- [ ] MATH-3d / P8: defence alone is timed; >, =, < or multiplication/division within 12 × 12 tables. Timeout/failed defence lands one incoming hit, correct answer blocks it. Test the separate response clock while the world is frozen; no timer on any other maths, including gold-tier purchases.

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
- [ ] P16a. Merchant Nia and rarity migration: white/blue/gold labels, buy/sell dialogue, deterministic stock and full previews; preserve existing loot IDs/stats. Green sets remain later.
- [ ] P16b. Maths purchases for equipment/cosmetics: white standard, blue multi-step, gold long/tricky untimed challenge; independent prompt review, atomic purchase, capacity recovery and permanent cosmetic unlocks.
- [ ] P16c. Selling/buyback and economy tests: protected equipped items, atomic gold/item transfers, no resale farming, finite offers, reload/idempotency and merchant browser journey.
- [ ] P17. Raider/lookout/guardian attack distinctions, authored encounter pacing, loot and resource balance. Playtest ordinary action bursts versus thinking interruptions.
- [ ] P18. Release pass: full expedition, all resources, defence, objects, quests, save/export/import, parent evidence, accessibility/reduced motion. Full check + e2e, critical playtest report, owner review; then verified Firebase release/live smoke.

## Current starting point and constraints

Baseline at planning time: main at 0d75013 plus inherited uncommitted build-0.3 combat/equipment/world work. Preserve it; do not claim inherited final browser verification. Three slots and list-backed inventory currently work; enemies are stationary and attacks use old quick/focus/ritual questions. Existing tests preserve that baseline until the corresponding increment intentionally replaces it. Node 22 is pinned; local runtime previously reported Node 25. No deployment belongs to the planning checkpoint.

P1 character sheet, P2 spatial domain/migration and P3 interactive pack/Haven stash are implemented. Next execution target: inspect the pushed CI result, then P3b claimable global-cap rewards in a fresh session. Subsequent sessions take the next unchecked increment. Update this file when actual evidence changes.

## Later merchant extension

- [ ] Green set items: named pieces, visible collection progress and tested two/three-piece synergy in the shared stat engine.

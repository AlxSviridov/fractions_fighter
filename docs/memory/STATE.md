# Current state

Updated 14 September 2026. Development build 0.3 plus engine-plan P1–P3 inventory. Owner acceptance remains pending; the larger redesign is not implemented yet.

## Latest verified increment

P1 character/equipment sheet shows level/XP progress, current/max health and actual base/level/equipment stat contributions. Item preview shows attack and defence together. Equip/unequip is atomic, retains every item and survives reload. Empty slots explain their purpose; pause is visible; keyboard controls and a sticky close button support scrolling. Still three equipment categories and list UI. P2 adds persisted 10×4 placement/footprint rules and overflow stash metadata, strict import validation, deterministic legacy migration, and atomic moves/swaps; interactive spatial UI is P3.

Superseding direction is in ENGINE_REWORK.md and ordered work in ENGINE_PLAN.md. Ordinary stamina/ammo/mana combat, moving enemies, new defence maths, objects and NPC quest interactions remain planned. Merchant addition is documented: maths purchases for equipment/cosmetics, white/blue/gold complexity, long tricky gold tasks, buying/selling NPC and later green synergy sets. Current rarity/combat still use legacy rules.

## Validation

- Final `npm run check`: 81 tests across 12 files, strict TypeScript and production build pass on local Node 25.8.1. CI uses pinned Node 22.
- Full local `FF_PREVIEW_PORT=4175 npm run test:e2e`: 5 passed in 2.4 minutes on final P2 build. Covers expedition, wrong answer/hint, loot/equip, quest reward, next expedition, journal/export/import, proactive defence/protected maths, heroes/settings, keyboard, compact layout and inventory unequip/reload/re-equip.
- Root real-browser inventory review at 1280×720: verified attack 12 → 10, item retained, keyboard re-equip and final rendered sheet. Independent Terra code review found stale cross-hero selection; fixed.
- CI failure e1596d1 / run 34785024119 diagnosed: Haven return overlaid loot Inspect; timer test assumed Explorer while default was Adventurer. Fixed overlay spacing and explicit test difficulty. The fresh P1 run 34822957659 passed four browser tests but exposed a travel-ward race in the expedition harness. Fixed by keeping defence separate from target selection and explicitly handling travel wards before asserting the requested attack prompt. Final local P2 browser suite passed all five tests; fresh pushed-run result pending.
- Build stalling traced to dataless macOS public assets; restored identical tracked blobs, no asset diff. Large Three.js chunk warning remains.

## Existing gameplay

Menu/create/load → safe Haven → compact five-enemy wilds, three classes/six portraits, click navigation, old quick/focus/ritual maths, proactive stationary enemy wards, guaranteed loot/equipment/XP/gold, quest reward and per-hero learning journal are implemented. River/far bank, pirate outpost and sanctuary remain mostly authored scenery. No real child playtest or full curriculum claim.

## Git and deployment

Authorised repo: AlxSviridov/fractions_fighter. Planning/inherited-work checkpoint e1596d1 pushed. P1/CI-fix c557253 pushed. P2 and remaining travel-ward regression fix are being validated for their checkpoint; verify fresh Actions before claiming CI fixed. Firebase project fractions-fighter-verdant remains authorised; no Hosting deployment this session. No billing enabled.

## Exact next action

Owner requested stopping after P3 and resuming in a fresh session. P2 ef5bf0a is pushed. P3 now implements the spatial pack, keyboard/click placement, drag/drop, occupied-cell count and village-only stash access. Invalid placement retains the previous layout; empty carried inventory is supported. See the latest session note for final validation and push evidence, superseding the earlier P2 status above.

P2 GitHub run 34824017079 failed because pausing erased pending click routes, so travel wards could prevent arrival. P3 preserves routes while clearing held keys and adds a route-pause browser regression. Inspect the pushed P3 Actions run first next session; CI is not claimed fixed until that passes.

Next product increment is P3b: replace inherited 200-owned-item automatic gold conversion with persistent claimable rewards. Forty-cell pack overflow already uses stash; the separate global cap remains lossy. Dedicated hover/focus tooltips and broader equipment slots remain refinements. Then follow ENGINE_PLAN into resource-driven combat. No Firebase deployment this session.

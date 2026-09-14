# Current state

Updated 14 September 2026. Development build 0.3 plus engine-plan P1 and P2 domain. Owner acceptance remains pending; the larger redesign is not implemented yet.

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

Finish P2 browser evidence and push, confirm fresh GitHub Actions. Then P3: pointer/keyboard grid placement and Haven stash UI; replace inherited 200-item overflow conversion with claimable rewards. P2 preserves old collections in stash metadata, but list UI still exposes all ownership and does not enforce village-only stash access yet. Follow ENGINE_PLAN before changing every combat channel together.

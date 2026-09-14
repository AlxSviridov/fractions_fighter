# Current state

Updated 13 September 2026. Development build 0.3 plus verified engine-plan P1. Owner acceptance remains pending; the larger redesign is not implemented yet.

## Latest verified increment

P1 character/equipment sheet shows level/XP progress, current/max health and actual base/level/equipment stat contributions. Item preview shows attack and defence together. Equip/unequip is atomic, retains every item and survives reload. Empty slots explain their purpose; pause is visible; keyboard controls and a sticky close button support scrolling. Still three equipment categories and list-backed ownership, not a spatial backpack.

Superseding direction is in ENGINE_REWORK.md and ordered work in ENGINE_PLAN.md. Ordinary stamina/ammo/mana combat, moving enemies, new defence maths, objects and NPC quest interactions remain planned. Merchant addition is documented: maths purchases for equipment/cosmetics, white/blue/gold complexity, long tricky gold tasks, buying/selling NPC and later green synergy sets. Current rarity/combat still use legacy rules.

## Validation

- Final `npm run check`: 71 tests across 10 files, strict TypeScript and production build pass on local Node 25.8.1. CI uses pinned Node 22.
- Full local `FF_PREVIEW_PORT=4175 npm run test:e2e`: 5 passed in 2.5 minutes. Covers expedition, wrong answer/hint, loot/equip, quest reward, next expedition, journal/export/import, proactive defence/protected maths, heroes/settings, keyboard, compact layout and inventory unequip/reload/re-equip.
- Root real-browser inventory review at 1280×720: verified attack 12 → 10, item retained, keyboard re-equip and final rendered sheet. Independent Terra code review found stale cross-hero selection; fixed.
- CI failure e1596d1 / run 34785024119 diagnosed: Haven return overlaid loot Inspect; timer test assumed Explorer while default was Adventurer. Fixed overlay spacing and explicit test difficulty. Fresh pushed-run status pending below.
- Build stalling traced to dataless macOS public assets; restored identical tracked blobs, no asset diff. Large Three.js chunk warning remains.

## Existing gameplay

Menu/create/load → safe Haven → compact five-enemy wilds, three classes/six portraits, click navigation, old quick/focus/ritual maths, proactive stationary enemy wards, guaranteed loot/equipment/XP/gold, quest reward and per-hero learning journal are implemented. River/far bank, pirate outpost and sanctuary remain mostly authored scenery. No real child playtest or full curriculum claim.

## Git and deployment

Authorised repo: AlxSviridov/fractions_fighter. Planning/inherited-work checkpoint e1596d1 pushed. P1/CI-fix checkpoint is being committed and pushed; verify fresh Actions before claiming CI fixed. Firebase project fractions-fighter-verdant remains authorised; no Hosting deployment this session. No billing enabled.

## Exact next action

Finish the P1 push and confirm fresh GitHub Actions. Then P2: spatial inventory domain, 10×4 placements, footprints, conservation, slot compatibility and migration with Haven overflow stash. P3 implements its pointer/keyboard UI. Follow ENGINE_PLAN rather than jumping into all combat channels together.

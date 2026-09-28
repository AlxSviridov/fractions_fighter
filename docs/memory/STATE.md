# Current state

Updated 28 September 2026. Development build 0.4: engine-plan P1–P3 inventory plus the authored **Chapter I: The Emerald Trail** level and world-puzzle task repository. Owner acceptance and real-child playtesting remain pending; resource combat and moving enemies are not implemented yet.

## Latest verified increment — Emerald Trail level design (28 September 2026)

The owner asked for proper level design with a proper repository of tasks, a level that feels like a real game. What now works (evidence below):

- **Level:** 8 areas (Waterfall Landing, Fern Hollow, Mossy Grotto\*, Tide Ford, Corsair Stockade, Sunken Cove\*, Sealed Antechamber, Shard Sanctuary), 4 gates (bridge winch puzzle, corsair code lock, barricade that falls with Captain Redsail, sanctum door with three rune seals), 9 encounters (5 minions, 3 elites, 1 boss) and 14 objects (chests, puzzle chests, shrine, lore, mechanisms, seals). Pure data and rules are in `src/game/level.ts`. Design: `docs/LEVEL_DESIGN.md`. Decision 0005.
- **Task repository:** 63 authored, untimed, story-framed puzzles (7 pools × 3 bands × 3 variants), each with an oracle expression checked by an independent BigInt-rational evaluator; variants rotate per expedition. `src/game/taskBank.ts`, `docs/TASK_BANK.md`.
- **Play:** follow camera; click-to-move pathfinding with clearance and a "which gate is closed" explanation; trail map (M); objective card with Guide me there; region banners; E/click interaction prompt; points-of-interest list in the journal; threats-in-reach tracker; object dialogs with reward previews; puzzle-specific encounter labels. The quest completes when the Shard Guardian falls. Story shortcuts (bridge, stockade lock, lore) persist into later expeditions; chests, shrine and seals reset.
- **Saves:** additive `resolved` field. Old five-enemy saves migrate: a cleared trail stays cleared, a partial trail restarts, and items, XP and gold are untouched. New loot IDs use `trail-`/`cache-` prefixes.

Not delivered: the spell-only door (the sanctum is maths-sealed), moving enemies, distinct attack behaviours, trail NPCs, independent human maths review of the 63 prompts, and a child playtest.

### Evidence (28 September 2026, cloud container, Node 22.22.2)

- `npm test`: 100 tests across 14 files pass, including the new `level.test.ts` (12) and `taskBank.test.ts` (7). Strict TypeScript and the production build pass.
- Browser journey `complete expedition…` **passed in a real Chromium** (software WebGL, 1024×640 via a local config override, `FF_CHROMIUM_PATH=/opt/pw-browsers/chromium`): new hero → Haven → Emerald Trail banner/map/tracker → prowler with wrong answer, hint and retry → Tidefang equip → free chest → winch → code lock → Captain Redsail → three seals → Shard Guardian with travel wards → reward → reload → journal → export → expedition 2 starts at "Defeat Captain Redsail" with 2/5 objectives → import. It took 5.5 minutes because the container renders at 1–3 fps; the pre-change build measured the same fps, so this is not a regression.
- Final full browser suite on the final code: **7/7 passed (8.9 min)**. Two harness races were fixed on the way: a pre-existing ward-timer race that also failed 1 of 3 runs on the baseline commit, and a travel-ward helper that wrongly required no open dialog. Details are in TESTING.md and the session note.
- Also fixed: entering the wilds briefly used the village position for region and threat checks.
- Rendered screenshots were inspected at Waterfall Landing, the Fern Hollow bridge and the cleared Shard Sanctuary.

## Previous increment — inventory (14 September 2026)

P1 character/equipment sheet shows level/XP progress, current/max health and actual base/level/equipment stat contributions. Item preview shows attack and defence together. Equip/unequip is atomic, retains every item and survives reload. Empty slots explain their purpose; pause is visible; keyboard controls and a sticky close button support scrolling. Still three equipment categories and list UI. P2 adds persisted 10×4 placement/footprint rules and overflow stash metadata, strict import validation, deterministic legacy migration, and atomic moves/swaps; interactive spatial UI is P3.

Superseding direction is in ENGINE_REWORK.md and ordered work in ENGINE_PLAN.md. Ordinary stamina/ammo/mana combat, moving enemies, new defence maths, objects and NPC quest interactions remain planned. Merchant addition is documented: maths purchases for equipment/cosmetics, white/blue/gold complexity, long tricky gold tasks, buying/selling NPC and later green synergy sets. Current rarity/combat still use legacy rules.

## Validation

- Final `npm run check`: 81 tests across 12 files, strict TypeScript and production build pass on local Node 25.8.1. CI uses pinned Node 22.
- Full local `FF_PREVIEW_PORT=4175 npm run test:e2e`: 5 passed in 2.4 minutes on final P2 build. Covers expedition, wrong answer/hint, loot/equip, quest reward, next expedition, journal/export/import, proactive defence/protected maths, heroes/settings, keyboard, compact layout and inventory unequip/reload/re-equip.
- Root real-browser inventory review at 1280×720: verified attack 12 → 10, item retained, keyboard re-equip and final rendered sheet. Independent Terra code review found stale cross-hero selection; fixed.
- CI failure e1596d1 / run 34785024119 diagnosed: Haven return overlaid loot Inspect; timer test assumed Explorer while default was Adventurer. Fixed overlay spacing and explicit test difficulty. The fresh P1 run 34822957659 passed four browser tests but exposed a travel-ward race in the expedition harness. Fixed by keeping defence separate from target selection and explicitly handling travel wards before asserting the requested attack prompt. Final local P2 browser suite passed all five tests; fresh pushed-run result pending.
- Build stalling traced to dataless macOS public assets; restored identical tracked blobs, no asset diff. Large Three.js chunk warning remains.

## Existing gameplay

Menu/create/load → safe Haven → the eight-area Emerald Trail (gates, puzzles, chests, lore, shrine, elites, boss), three classes/six portraits, click navigation with pathfinding, old quick/focus/ritual combat maths, untimed task-bank puzzles for world objects, proactive stationary enemy wards (gated by area access), guaranteed loot/equipment/XP/gold, quest reward on the boss kill and per-hero learning journal are implemented. No real child playtest or full curriculum claim.

## Git and deployment

28 September 2026: the level work is committed on branch `claude/trusting-hypatia-ezco3m` and pushed to AlxSviridov/fractions_fighter (see the session note for commit and push evidence). CI only runs on `main` pushes and PRs, so this branch has no Actions run unless a PR is opened. CI job timeout was raised to 30 minutes for the longer journey. No Firebase deployment.

## Git and deployment (14 September 2026)

Authorised repo: AlxSviridov/fractions_fighter. Planning/inherited-work checkpoint e1596d1 pushed. P1/CI-fix c557253 pushed. P2 and remaining travel-ward regression fix are being validated for their checkpoint; verify fresh Actions before claiming CI fixed. Firebase project fractions-fighter-verdant remains authorised; no Hosting deployment this session. No billing enabled.

## Exact next action

1. Open a PR (or merge) so GitHub Actions runs the full suite on the new level; fix anything red.
2. Independent maths review of the 63 task-bank prompts (LD-9), then an owner/child playtest using the LEVEL_DESIGN questions (LD-10).
3. Continue ENGINE_PLAN: P3b claimable rewards (more urgent now that an expedition yields up to 13 items), then P4+ resource combat. When spells exist, give the Sanctum Door a spell-tagged condition (LD-12/P16).

## Exact next action (14 September 2026, superseded)

Owner requested stopping after P3 and resuming in a fresh session. P2 ef5bf0a is pushed. P3 now implements the spatial pack, keyboard/click placement, drag/drop, occupied-cell count and village-only stash access. Invalid placement retains the previous layout; empty carried inventory is supported. See the latest session note for final validation and push evidence, superseding the earlier P2 status above.

P2 GitHub run 34824017079 failed because pausing erased pending click routes, so travel wards could prevent arrival. P3 preserves routes while clearing held keys and adds a route-pause browser regression. Inspect the pushed P3 Actions run first next session; CI is not claimed fixed until that passes.

Next product increment is P3b: replace inherited 200-owned-item automatic gold conversion with persistent claimable rewards. Forty-cell pack overflow already uses stash; the separate global cap remains lossy. Dedicated hover/focus tooltips and broader equipment slots remain refinements. Then follow ENGINE_PLAN into resource-driven combat. No Firebase deployment this session.

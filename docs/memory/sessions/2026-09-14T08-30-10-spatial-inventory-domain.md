# Session: spatial-inventory-domain

## Intent

Owner said to move on after P1. Continue P2 domain/migration while confirming the P1 CI-fix run. Preserve the merchant idea list and full engine roadmap.

## Changes in progress

Introduce InventoryLayout v1 alongside the canonical owned-item array: 10×4 backpack coordinates, item footprints and overflow stash IDs; equipped IDs are excluded from storage. Pure movement supports atomic valid placements/swaps and leaves invalid moves untouched. Reconcile on loot/equip/unequip; missing legacy layouts migrate deterministically. Explicit malformed new layouts reject rather than silently moving/deleting imported items.

## Decisions

Keep outer Save/Rpg version 1 with a versioned additive layout field. Legacy exports retain all items and stats; current validated exports include explicit layout. P2 establishes storage rules and save migration, while P3 exposes grid placement/stash UI and full-pack recovery. Current list UI still shows all owned items, so village-only stash access is not yet enforced. The inherited global 200-item conversion rule remains until P3 replaces it with claimable overflow; the 40-cell pack is not that ownership cap.

## Model use

Reused gpt-5.6-terra / medium worker for bounded inventory.ts plus independent domain tests. Root implements RPG/save integration and separate migration tests, reviews worker code and validates. No frontier specialist escalation or new maths generator.

## Validation

Pending integrated tests/build. Root migration tests cover 60 legacy armour items plus equipped starter: five 2×3 armour pieces fit in 10×4, 55 go to stash, no ID/stats/progress loss. Also test save round-trip and layout validity after reward/equip/unequip. Prior P1 local check: 71 unit tests and five browser tests pass.

## Git and deployment

P1/CI-fix commit c557253 pushed to main on authorised AlxSviridov/fractions_fighter. Fresh Actions run 34822957659 passed install/unit/build and is running browser checks. P2 not committed yet. No Firebase deployment; dedicated fractions-fighter-verdant remains the authorised host.

## Exact next action

Finish P2 integration/review and tests, record evidence, commit/push. Then P3 spatial UI, keyboard/pointer placement, stash and full-pack claim recovery. Confirm GitHub validation, do not claim a green run before it completes.

## Integrated domain verification

81 tests in 12 files plus strict TypeScript/build pass. Root caught and fixed a TypeScript narrowing issue after test-only verification, and reviewed the swap invariant independently. Worker fixed a reverse-swap overlap case (1×3 weapon swapped with 2×3 armour) and guarded prototype-named IDs via own-property access. Browser save/expedition suite is running on the final bundle.

## Remaining CI issue diagnosed

P1 Actions run 34822957659: four browser tests passed, expedition failed after the old helper accepted a travel defence prompt as Ancient ritual. Trace showed a Canopy Raider ward and no attack/loot; this was not a failed item reward. Removed defence's unsolicited setSelectedEnemy so a ward cannot masquerade as proximity arrival. Expedition helpers now resolve legitimate travel wards, verify the requested action's dialog title, and account for extra ward attempts in exact journal metrics. No forced clicks, disabled enemy logic or global timeout inflation. Local suite for the final change is running.

Before this final CI-harness correction, P2 check passed 81 tests/build and all five browser tests passed in 2.4m. Final check again passed 81/build after the correction; final browser run pending.

## Final local checkpoint evidence

Final full browser suite: 5 passed in 2.4 minutes on the final P2/travel-defence build. Final check: 81 unit tests in 12 files, strict TypeScript and production build pass. Diff whitespace/targeted formatting pass. P2 marked complete as domain/migration only; P3 interactive grid/stash/claim recovery is next. Committing and pushing code/tests/memory together; fresh GitHub run will be inspected before claiming CI resolved. No Hosting release.

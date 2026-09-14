# 0004 — Additive spatial inventory migration

Date: 2026-09-14. Status: implemented domain; interactive grid follows in P3.

## Decision

Retain the canonical `inventory: Item[]` ownership collection and equipment ID map.
Add `inventoryLayout: { version: 1, pack, stash }`. The pack is 10×4 cells;
weapon footprint is 1×3, armour 2×3, relic 1×1. Equipped IDs appear in neither
pack nor stash. Every other owned ID appears exactly once across the two.

A missing layout identifies a legacy save: migrate in stable inventory order,
first-fit into free cells and put overflow into stash. Preserve every item and
its stats. New explicit layouts must validate; never repair an invalid import
silently. Return only known fields. Item IDs are untrusted strings and object
prototype names must remain ordinary IDs.

On internal loot/equipment transitions, reconcile layout against new ownership
and equipment. Keep valid positions and existing stash entries, remove equipped
IDs and first-fit newly stored items. UI moves are atomic and invalid commands
return the original layout. A one-item pack swap must fit both the reverse
position and the final destination without overlap. No stored change is made
while merely dragging; cancel means no command.

## Consequences

Outer save version stays 1 for the additive migration; layout has its own version.
Legacy readers still retain the complete ownership list even if they discard the
new field. P2 does not yet expose pack/stash UI or enforce village-only stash
access. The old 200-item total-ownership overflow conversion remains transitional;
P3 must replace it with claimable loot before presenting a full spatial inventory
experience. Never confuse the 40-cell backpack with that old total-ownership cap.

# Save and campaign review — 13 September 2026

Role: QA/save reviewer, independently reviewing integrator-owned App/save integration after implementing the bounded RPG domain. This is code and automated-state review; rendered UI playtesting is performed separately by the integrator. No real child's reaction is claimed.

## Findings and response

- **P1, corrected in persistence helper:** new-game/import previously wrote the active record before discovering a full or unavailable hero archive. Added `persistHero(save)`: validate the save and archive capacity before mutation, write the archive first, then the active save; restore the previous archive bytes if the active write fails. Integrator must use this helper for creation, switching, importing and autosave.
- **P2, corrected in archive parser:** wrapper IDs/dates were coerced instead of validated. Duplicate IDs or mismatched wrapper/save IDs could replace the wrong archive entry. The parser now requires distinct valid IDs matching the save, valid ISO timestamps, started heroes and validated campaign contents.
- **P2, reported to integrator:** question identity based on a capped 10,000-attempt array plus a session-reset counter could repeat after reload and merge unrelated parent-report evidence. Use a unique cast ID; integrator owns this fix.
- **P2, reported to integrator:** New Game copied the prior hero's outfit into fresh unlocks. A legacy hero wearing unlocked outfit 3 would produce an invalid new save. Reset the new profile's appearance to valid defaults while applying the draft name.

## Checked guarantees

Automated review covers two distinct heroes retaining separate progress, inventory and equipped items; updating one without changing another; ignoring uncreated heroes; legacy identity; full-archive refusal without mutation; retaining corrupt raw bytes; duplicate/mismatched/date rejection; archive-write failures; active-write failure rollback; first-save rollback; and normal active-hero switching.

RPG tests cover deterministic rewards, replaying a defeated target without additional XP/gold/loot, one quest claim per expedition, village trips preserving wounds and defeated enemies, new expeditions retaining equipment, healing, rescue without lost progress, real equipped combat stats, full-pack conversion, and strict campaign round trips. Ordinary starting enemies require at most three short strikes; a correct ritual can defeat the initial guardian in one action. An encounter's XP is granted on completion, not once per question.

Validation at this review checkpoint: `npx vitest run tests/profiles.test.ts tests/rpg.test.ts tests/save.test.ts` — **20 tests passed**. Full build and browser suite remain the integrator's release gate.

## Honest limits and follow-up

`localStorage` has no true transaction spanning two keys. Synchronous errors roll back, but a browser crash between writes can leave the archive newer than the active save. Both remain loadable; cloud conflict-safe persistence is future work. Browser quota errors remain visible and exports remain the backup path. Progress is local to this browser and is not automatic device sync.

Loot affinity currently labels topics and rotates which affinities drop; it does not yet alter question selection or implement durability. Gold accumulates and is a reward counter; no shop or meaningful spending sink exists yet. Deterministic item upgrades, enemy scaling and repeated five-enemy trails need child playtesting and economy tuning. These are follow-up product limitations, not claims of a complete action RPG.

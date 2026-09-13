# Current state

Updated: 2026-09-13. **Fractions Fighter rebuild checkpoint; not yet a verified release.**

## Latest checkpoint

Resumed under the economical-agent policy. Terra (`gpt-5.6-terra`, medium) owns bounded release QA; a second Terra worker owns combat visuals while the orchestrator reviews/integrates. No full fleet.

The requested `Launch Fractions Fighter.command` executed successfully: built the game, started `http://127.0.0.1:4175`, and opened its browser. Root verified actual character creation → Haven → wilds with five enemies in the in-app browser at 1280×720. Earlier usage-limit rejection no longer blocks this check. Full end-to-end suite is being run separately; no release claim yet.

Updated README, game design, architecture, learning/art docs and roadmap to describe the actual RPG rebuild, superseding stale Verdant descriptions. Planned next visual increment: distinguish successful attacks and remove the misleading duplicate decorative guardian.

## Owner direction / acceptance

The owner rejected the old Verdant quiz expedition as an undercooked MVP. Thirteen corrections are canonical in `docs/feedback/2026-09-13-owner-review.md`. Name is Fractions Fighter. Explicit specialist fleet requested; see `docs/TEAM_WORKFLOW.md`. Owner additionally requested incremental GitHub commits and tracker updates during ongoing work, not only at session end.

## Implemented in working tree

- New main menu: New Game, Continue, Load Game, Settings, learning journal.
- New Game creates a separate hero, chooses six supplied avatar portraits plus three classes. No mid-run identity recolouring UI.
- Original reference-inspired 3D hero silhouettes: three human explorers, wizard cat, rune construct, cloud elemental; class weapons and equipment visuals.
- Separate Haven village with gate, buildings, fountain/forge/market/NPC scenery; wilds with five actual combat enemies and health bars.
- Click-to-approach, quick strike / power skill / ancient ritual. 1×/3×/7× damage; math complexity scales with ability.
- Optional falling quick comparison minigame (< = >); medium and ritual calculation always untimed; hints / relaxed mode.
- Persistent inventory, equippable weapon/armour/relic, rarity, stats, guaranteed enemy loot, XP, levels, gold, potions, quest rewards / next expedition.
- Cinzel + Crimson Pro fonts bundled locally. Rebuilt dark/brass game HUD, health orb, inventory and loot interface.
- Executable local launcher `Launch Fractions Fighter.command` builds and opens the local game (execution and browser entry verified).
- Existing original maths/state tests retained; new specialist math/domain/review tests added.

## Validation / active fixes

Combined app compiled successfully after integration. Setter: 12 tests pass; independent reviewer added prompt-derived arithmetic checks and found no arithmetic blockers. Percentage teaching feedback fixed to use halves/tenths/quarters. RPG domain: 8 tests pass. 3D specialist manually verified village gate and enemy target clicks in an isolated renderer preview.
Launcher and browser entry checked. Rewritten full-expedition browser suite is under verification.

Independent save review found a partial-write failure in create/import (active save written before archive success), archive wrapper validation weakness and potential question-ID reuse after attempt cap. Transactional persistence, strict wrapper validation, unique cast IDs and fresh profile defaults are now integrated and covered by passing tests. Full UI save/import checks still remain.

## Team ownership right now

Root: App / HUD / MathEncounter / World wrapper / launcher / integration / docs.
Game-systems agent: RPG domain and profiles persistence/tests completed; subsequent docs task stopped on usage limit.
World/assets agent: renderer completed.
Maths setter/reviewer: generators + independent review completed.
Playtester: critical browser review complete, automated replacement suite written but unrun; continuation stopped on usage limit. Simulated perspective, not a real child trial.

## Git / hosting

Remote: https://github.com/AlxSviridov/fractions_fighter.git . Initial checkpoint `830fa9e` pushed. Rebuild checkpoint `10f1475` is pushed. Integration fixes and economical-agent policy committed as `368ad33` and successfully pushed to origin/main. Firebase project `fractions-fighter-verdant` exists; no verified Hosting release yet. Project name remains an infrastructure identifier despite game title change. No billing enabled. Node22 pinned; Node25 on this machine produces a Firebase-tool transitive engine warning.

## Next actions

1. Resume with one Terra QA worker when execution is available; run and fix the rewritten end-to-end suite (55 unit tests and build already passed).
2. Inspect integrated game, address playtester findings, update end-to-end suite and verify complete quest/new/load/export/import.
3. Verify clickable launcher and desktop/compact UI, publish checked build to dedicated Firebase, inspect GitHub CI.
4. Update tracker/session and push final verified checkpoint. Do not repeat old MVP acceptance claims.

## Scope remaining

Not yet infinite world streaming or commercial-quality authored animation. Current models are deliberate polygonal reinterpretations of supplied 2D portraits, not exact 3D conversions. NPC scenery currently uses UI quest/services controls. No cloud saves/authenticated parent profiles, adaptive difficulty, full curriculum, wear system or skill tree yet. Real child playtesting remains required.

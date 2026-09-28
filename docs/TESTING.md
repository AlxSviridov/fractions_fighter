# Validation and playtesting

## Automated checks

Run `npm ci`, then `npm run check`, then `npm run test:e2e`. The browser suite starts the **built production bundle** on port 4173; it intentionally does not test a live-reloading dev session. Install the browser once with `npx playwright install chromium`. CI installs browser OS dependencies as well.

- Pure domain checks cover legacy maths/state, action-tier maths, independent prompt-derived exact comparisons, RPG rewards/equipment, armour/defence, and transactional save/profile validation.
- Level checks (`tests/level.test.ts`) prove region/object/enemy placement, that declared gates match physical connectivity (including closing each gate individually), continuous walkable routes, blocked-route explanations, safe spawn, objective order, claim-once objects, boss-gated chests, story persistence across expeditions and legacy five-enemy save migration.
- Task-bank checks (`tests/taskBank.test.ts`) evaluate each puzzle's oracle with an independent BigInt-rational parser and check coverage, rotation, units and answer input.
- Browser expedition covers menu → new hero → Haven → Emerald Trail (region banner, trail map, tracker), wrong answer/hint/retry, loot/equip, free chest, the full critical path (winch, code lock, captain, three seals, guardian) with travel wards, quest reward, reload, parent reporting, export/import and the next expedition with persisted shortcuts.
- Separate-hero/settings checks cover save restoration, keyboard shortcuts, focus, invalid import and compact layout.
- Timer/defence checks distinguish harmless offensive quick-rune expiry from armour-mitigated defensive expiry/wrong answers; verify successful blocking, telegraph and protected long-task time.

Math tests use exact integer / BigInt arithmetic where floating-point noise could create a false oracle. Browser tests derive answers from visible questions rather than importing the game's answer generator. Shader/software browser performance is not a laptop benchmark. Screenshot artefacts live in `test-results/` and are not committed as player data; CI retains failures for seven days.

## Manual release checklist

1. Inspect original WebGL scene, readable landmarks and explorer, HUD, new-player welcome, all modals, compact viewport.
2. Complete at least one mouse-first encounter; check wrong answer, hint and visible reward.
3. Confirm optional sound and motion behaviour; background tab does not count towards active response time.
4. Export/import a save; confirm settings, name, XP, learning evidence and unlocks survive. Unknown version and corrupt records do not replace valid data.
5. Verify production Hosting URL returns the current build, assets load, and console has no app errors.
6. Update STATE/session with actual results, tested commit, deploy URL and known limitations. Push to GitHub and inspect CI.

## Family pilot (next milestone)

Use original questions and pseudonymous local profiles. Ask the child to explain what the game asks them to do, watch without coaching for the first minute, then observe where maths interrupts the fantasy or movement confuses them. At 10 and 20 minutes, offer a natural stopping point. Record observations rather than claiming an engagement score.

Questions for the owner: Did the child voluntarily pursue the next discovery? Could they explain one method? Did a wrong answer feel safe? Was the reward worth the effort? Which topic needs more variety? Use results to choose the next vertical feature, especially click combat and more satisfying spell effects.

## Machines whose preinstalled Chromium differs from Playwright's pin

Set `FF_CHROMIUM_PATH` to an existing Chromium binary (for example `/opt/pw-browsers/chromium` in cloud containers) instead of downloading. In software-rendered containers the 3D scene may run at 1–3 fps, so the full journey can take many minutes. That speed is not a laptop benchmark.

Real-time ward timers and slow software rendering can race. On 28 September 2026, the ward test failed intermittently here on **both** the baseline commit (1 of 3 runs) and the level branch. The trace showed a single Playwright click taking 22 seconds at 1 fps, during which a ward opened and expired. The test now waits for the ward immediately after arrival and uses the player's own "Let me think" pause before answering the block case. Expiry itself is covered by the dedicated timer test. Do not "fix" such races by raising game timers or forcing clicks.

## Explicit local preview port

Default browser tests use port 4173. If another preview already owns it, start this
repository's preview on a free port and run `FF_PREVIEW_PORT=4175 npm run test:e2e`
(with the actual selected port). The managed server uses `--strictPort` so it cannot
silently serve a different port. Test saves are isolated browser contexts.

Inventory regression covers unequip/re-equip, actual stats, item conservation,
reload and compact layout. Timer tests explicitly select their difficulty; do not
assume a developer's saved settings. Loot Inspect must pass ordinary pointer hit
testing: never use forced clicks to conceal overlapping game controls.

macOS can offload Desktop project files as `dataless` placeholders. If a build
stalls reading public assets, inspect file flags and restore exact tracked bytes
from Git after checking for local modifications. Do not substitute blank assets
or commit placeholder content. The September 13 validation restored seven public
assets byte-for-byte; Git reported no asset changes.

Spatial inventory tests cover first-fit packing, overflow preservation, footprint bounds, one-item swaps (including reverse overlap), prototype-named item IDs, corrupted imports and legacy save migration. UI remains list-based until P3. Expedition helpers must distinguish incoming wards from player attack prompts, and count any additional defended travel attacks in journal assertions. Never assume a dialog opening means the requested action started.

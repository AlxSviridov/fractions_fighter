# Validation and playtesting

## Automated checks
Run `npm ci`, then `npm run check`, then `npm run test:e2e`. The browser suite starts the **built production bundle** on port 4173; it intentionally does not test a live-reloading dev session. Install the browser once with `npx playwright install chromium`. CI installs browser OS dependencies as well.

- 22 domain tests: 7,500 seeded generator cases across five topics and three difficulty levels, independent expected arithmetic, malformed input, guardian gating, reward idempotency, hint/retry evidence, save schema validation.
- Browser expedition: new character, all three seals, wrong answer recovery, hint persistence across close/reopen, optional cache, reload, all three guardian phases, XP and outfit reward, parent report, export, new expedition and valid import.
- Browser controls / settings: manual maths difficulty, reduced motion, actual keyboard movement, invalid import, 390px layout, modal keyboard focus and Escape.
- Manual mouse-first check: click a visible 3D waystone, confirm the explorer approaches and the maths encounter opens without keyboard input.

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

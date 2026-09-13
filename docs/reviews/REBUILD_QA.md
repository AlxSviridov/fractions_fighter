# Rebuild QA — 13 September 2026

Scope: production-bundle browser QA of the Fractions Fighter rebuild. This review used the built app on port 4173 and Playwright's Chromium browser. Maths answers were calculated from the values displayed to the player; no game question generator or saved answer was used as an oracle.

## Baseline evidence

- `npm run build` passed on the baseline headed by `1f98964`.
- The full expedition test passed in 58.9 seconds when pointed at a persistent built preview: New Game, Haven, wilds, five enemies, a deliberately wrong quick comparison, hint/retry, visible loot, equipment replacement, quest reward, reload, journal, export/import, next expedition and imported inventory.
- The ordinary Playwright `webServer` child stopped before a long test reached reload, producing `net::ERR_CONNECTION_REFUSED`. Re-running with an explicitly persistent `npm run preview -- --port 4173` server passed, so this is test-host lifecycle evidence rather than a game-save failure.

## Defect reported to integration owner

**P1 — Escape after a modal can return the player to the main menu.** In the settings flow, Escape first closes the modal, then the global App Escape handler sees no panel and sends the player to the menu during the same key event. As a result, documented `I` / `J` shortcuts cannot be used after a modal is closed. The failing browser snapshot showed the complete main menu where Inventory was expected. The owner has been given the focused correction: ignore already-prevented key events in the global handler, or stop the modal Escape event propagating.

## Coverage added / still to re-run after integration

- The quick-rune expiry check was updated for the actual difficulty schedule: Explorer 25 seconds, Adventurer 20 seconds and Pathfinder 15 seconds. It currently runs the Explorer expiry path and asserts the rendered 25-second label before waiting.
- Added browser coverage for a nearby enemy's visible telegraph followed by its ward comparison: an independently calculated correct answer blocks all damage; a deliberately incorrect answer loses exactly the damage shown after armour mitigation. The same check keeps a focus calculation open for longer than the enemy's eight-second lead and verifies no defence prompt or health loss occurs, then uses the labelled Return to Haven control. This new coverage is awaiting the final browser run.
- The separate-heroes, settings persistence, keyboard shortcuts, invalid import and 390px compact-layout test is blocked only by the reported Escape defect. It should be re-run after its integration fix.
- The full three-test browser suite and `npm run check` must be run against the final rebuilt bundle after visual integration. This report does not claim a release or substitute for the manual launcher, mouse-first, and owner/child checks.

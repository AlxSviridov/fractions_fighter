# Session 2026-09-13: Economical agents and bite-size checkpoints

## Intent

Apply the owner's amended delegation/model budget rules and preserve ongoing game work.

## Changes

Updated canonical AGENTS.md, TEAM_WORKFLOW.md, stable preferences, STATE and BACKLOG. CLAUDE.md remains a pointer to AGENTS.md. Roles are now on demand; routine delegated work explicitly uses Terra/Sonnet. Frontier models primarily orchestrate and resolve difficult decisions. Every increment includes code, checks, memory, commit and push.

Preserved integration fixes: attack shown after maths overlay clears, total equipment-stat comparisons, input autofocus target, appropriate hint subtitle. Preserved rewritten browser tests and independent playtest/save reviews.

## Decisions and rationale

Do not restart existing frontier workers for routine tasks. Default to one bounded worker only when useful. Explicit model selection with compact context prevents accidental frontier inheritance. Record actual model/escalation; unavailable cross-tool model names are preferences, not executable identifiers.

## Validation and evidence

`npm run check` passed: 55 tests / 7 files, strict TypeScript and production build. Browser suite replacement is written but unrun. Previous specialist roles ran on inherited parent settings before this amendment; exact model was not returned by tool metadata, so do not invent it. No new agents were launched after the amendment. Two prior continuations (docs refresh and browser tests) failed with usage-limit errors.

## Known limitations / blockers

Automatic approval review rejected requested launcher execution because account usage limit was reached, reporting reset at 4:38 PM. No bypass attempted. Launcher, full browser QA, Firebase deployment and live smoke test remain pending. No owner acceptance claim. Latest source and checks are preserved for another session/model.

## Exact next steps

1. Verify Git commit/push status; push any local checkpoint when authorised execution is available.
2. Use one explicit Terra worker for browser QA if delegation is useful. Check duplicate Inventory button selector in rewritten suite before running.
3. Complete launcher check, design-doc refresh and Firebase release gates; record evidence before claiming release.

## Git and deployment

Branch main; prior `10f1475` verified pushed. `368ad33` committed all current integration/policy changes and was successfully pushed to origin/main. This follow-up records the verified push. Firebase project remains `fractions-fighter-verdant`, release unverified.

# Session 2026-09-12 — Foundation and first adventure

## Intent
Start a turn-key original maths adventure, establish documentation-first development and durable cross-model/device memory, then deliver a playable browser increment and maintain GitHub/Firebase.

## Changes
Created the project from the empty authorised repository. Added canonical AGENTS.md / CLAUDE.md pointer, structured memory, design / architecture / learning / art / deployment docs, roadmap and first ADR. Implemented original Three.js isometric jungle, procedural explorer, click movement/landmark approach, game HUD, character editor, focus questions, guardian, local persistence/export/import, topic evidence and manual settings. Added tests, CI and Firebase configuration.

## Decisions and rationale
- User confirmed ages 9–11, laptop first.
- User subsequently confirmed Diablo-inspired isometric UI and mouse-click movement / combat as primary. Implemented click-to-approach-and-interact; full action combat remains next phase.
- Protected thinking time; one answer creates a meaningful game consequence. Free navigation.
- Static client + Three.js with accessible HTML maths, pure tested domain logic.
- Seeded bounded expeditions before infinite streaming. Procedural art before Blender.
- Git-tracked state/decisions/preferences/session notes are canonical memory. Local player saves transfer via explicit export; future parent cloud profiles are separate work.

## Validation and evidence at foundation checkpoint
22 unit/invariant tests and strict production build pass. 7,500 seeded maths examples exercised. Independent percentage test oracle initially exposed floating-point noise in the test calculation, fixed using exact BigInt arithmetic; game answer generation was correct. Runtime audit clean. Manual browser: original world visible, creator functions, click on Tide Waystone opens encounter after approach, wrong answer gives supportive retry feedback.
Browser release suite still in progress. It found a real lazy-world readiness race after reload; queued navigation fix added. Static scenery batching added for draw-call efficiency. Final verification and deployment will be appended below.

## Limitations
First playable increment only; full scope and acceptance gates in ROADMAP and BACKLOG. No claim of an infinite world, commercial art parity or a complete 11+ curriculum. No child accounts or telemetry.

## Git and deployment
Authorised remote cloned; initial checkpoint pending commit/push. Firebase account available. Dedicated `fractions-fighter-verdant` project created without enabling billing; no Hosting release at checkpoint. CLI local, .nvmrc pins Node 22. No credentials recorded in repo.

## Next steps
Finish browser release tests and visual inspection, deploy to dedicated Hosting, verify live, update all memory and push final changes. Then prioritise actual click combat + richer encounter flow and owner playtest feedback.

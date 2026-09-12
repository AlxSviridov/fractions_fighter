# Current state
Updated: 2026-09-12, initial development session (release validation still in progress).

## Implemented
- Working React / TypeScript / Vite / Three.js app, original procedural isometric jungle.
- Mouse-first ground movement and click-to-approach shrine/chest/guardian interaction. Optional WASD/arrows/E and small-screen direction buttons.
- Name, four skin tones, three hairstyles, three initial outfit colours; fourth outfit earned from guardian.
- Three seals, optional cache, three-phase maths guardian, XP/levels, victory and another seeded bounded expedition.
- Five original maths generators and three manual difficulty levels, protected untimed thinking, retry/hint feedback.
- Local versioned saves with strict import validation, export, backup on import and corrupt-save recovery. Hint history survives closing/reloading. Parent report separates independent first tries from assisted completion.
- Git-backed operating instructions, design, architecture, learning design, art pipeline, roadmap, ADR and session script. GitHub CI and dedicated Firebase Hosting config.

## Validation so far
22 unit/invariant tests pass (7,500 generated maths cases included). Strict TypeScript and production build pass. Runtime npm audit reports zero vulnerabilities. Manual browser QA confirmed real WebGL rendering, creator, click-to-approach and wrong-answer feedback. End-to-end release checks are in progress; do not assume they have passed yet.

A first browser run found a navigation request could be lost while the lazy renderer starts after reload. Fixed by queuing destinations until the current world seed reports ready; verification pending. Static scenery is now merged by material to reduce draw calls; needs final rendered check.

## Environment / deployment
GitHub CLI works with network access outside sandbox; sandbox-only auth errors were misleading. Local server http://localhost:5173 . Firebase project created: `fractions-fighter-verdant` (dedicated, billing not enabled). CLI is project-local. Hosting not yet deployed at this checkpoint. Node 25 available locally, Node 22 pinned for CI/new devices; Firebase CLI warns about a Node 25 transitive package engine.
Blender not installed; procedural assets require no external editor.

## Known scope limits
This is a first playable slice, not the full child-pilot MVP. One bounded generated clearing, no infinite chunk streaming, no full melee/bow combat, no authored Blender rig, no cloud saves or authenticated parent profiles, no adaptive difficulty, no reviewed complete 11+ curriculum. Character returns to camp on reload but earned encounters/progress persist. Commercial reference fidelity and 20–30 minute authored pacing remain future work.

## Exact next actions
1. Finish full Playwright expedition / controls / save import checks; fix actual failures.
2. Recheck rendered desktop and compact layouts after scenery batching.
3. Publish checked build to dedicated Firebase Hosting, verify live URL and headers.
4. Update STATE, BACKLOG and session with final evidence; commit/push; inspect GitHub CI.

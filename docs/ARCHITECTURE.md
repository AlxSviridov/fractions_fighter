# Architecture

> Superseding direction (13 September 2026): [Engine rework](ENGINE_REWORK.md) and [increment plan](ENGINE_PLAN.md). Descriptions below include the legacy implemented build; resource combat and new interaction rules are planned until verified in STATE.

## Stack and rationale

- TypeScript + Vite: static browser build, strict contracts and short feedback loop; no server rendering needed for a game.
- React: accessible HTML menus, HUD, character editor, parent report and maths focus overlay.
- Three.js: original procedural low-poly 3D, isometric camera, lighting, shadows, animated meshes. Renderer owns its animation loop; do not re-render React at frame rate.
- Pure TypeScript domain modules: seeded questions, rational comparison, answer validation, encounter transitions, progress analysis, save validation. Test independently of WebGL.
- Local storage: validated versioned per-hero saves and an active-hero record. Explicit JSON export/import provides manual device transfer. Local saves alone are NOT cross-device sync and can be lost if browser storage is cleared.
- Firebase Hosting: static HTTPS delivery. Firebase Auth/Firestore later, when parent-owned profiles and security rules are ready. No backend or child analytics SDK in the slice.
- Vitest: mathematical invariants / state / save contracts. Playwright: real-browser game and persistence flows. GitHub Actions: locked dependency install, tests and production build.

## Boundaries

`src/game/math.ts`: questions with topic, difficulty, prompt, valid answers and worked explanation; injected deterministic random source.
`src/game/actionMath.ts`: action-tier questions (quick/focus/ritual), exact comparisons and reviewed explanations.
`src/game/rpg.ts`: pure combat, equipment, enemy/quest rewards, levels and campaign validation.
`src/game/profiles.ts`: hero archive and active save persistence; preflight validation and rollback on synchronous write failure.
`src/game/state.ts`: typed serialisable state, rewards, encounter lifecycle, topic summaries; no browser or renderer imports.
`src/game/save.ts`: validate unknown imports, local persistence and backup before import.
`src/game/world.ts`: procedural scene, reusable mesh factories, animation, movement, hit testing; callbacks for nearby target. Destroy all GPU resources and listeners on unmount.
`src/components/World.tsx`: renderer lifecycle adapter.
`src/App.tsx`: player flow, focus state, modal navigation and state persistence.
`src/styles.css` and `src/fighter.css`: responsive HUD, menus, quick runes and inventory. Locally bundled Cinzel/Crimson Pro fonts.

## Save contract

Version + profile + settings + seed + expedition + completed encounter IDs + guardian stage + experience + unlocks + attempts. Attempts record question ID and topic/difficulty, submitted answer, correctness, hint use and active response duration. A current question remains in component state; aborting does not award progress. Persist at every domain transition. Validate and bound imports before replacement, create local backup, never execute data. The version-1 save adds optional RPG, slotId and quickTimer fields for legacy compatibility. RPG includes class/avatar, zone, inventory/equipment, enemies, quest/expedition and resources. Unique cast IDs prevent report collisions. `localStorage` cannot atomically write two keys: synchronous failure rolls the archive back; a crash can leave an archive newer than the active record, recoverable through Load Game. A future migration maps old versions explicitly; reject unknown future versions with useful feedback. No storage of date of birth, school or email in the slice.

## World generation

Seeded bounded clearings now; guaranteed reachable landmarks and reserved clear paths. Repeated expeditions change decoration and question sequence. Infinite terrain later: chunk coordinates + world seed, hashed chunk generators, shared border constraints, narrative encounter budgets, deterministic IDs, persistent sparse modifications and unloading of distant chunks. Infinite randomness without pacing is not a game; story gates and deliberate landmarks remain authored.

## Future cloud sync

Parent signs in; child profiles are pseudonymous and nested under parent identity. Firestore rules deny everything except the authenticated parent path. Attempt IDs are unique and append-only; merges are idempotent. Progress snapshots carry revision and schema, with explicit conflict handling for simultaneous devices. Cache locally; retry outbox on reconnect; never use last-write-wins to silently erase attempts. Emulator security tests, export/deletion and retention policy are release gates. Never ship public write rules.

## Performance / asset budgets

Target 60 fps on a typical recent laptop; minimum 30 fps on the agreed low-spec test device (not yet benchmarked). Cap device pixel ratio, share geometries/materials and batch static scenery by material; use instancing when vegetation scale grows, cap shadow maps. No multi-megabyte remote textures for the slice. Lazy-load the renderer bundle. Future GLB assets: glTF, compressed geometry and KTX2 textures, consistent unit scale and named sockets. No network connection needed after static files load, but installable offline/PWA support is not yet included.

## Sources checked 2026-09-12

- Three.js colour management: https://threejs.org/manual/en/color-management.html
- Renderer reference: https://threejs.org/docs/pages/WebGLRenderer.html
- Firebase Hosting: https://firebase.google.com/docs/hosting/quickstart
- Firebase CLI: https://firebase.google.com/docs/cli

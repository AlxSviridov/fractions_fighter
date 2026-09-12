# Architecture

## Stack and rationale
- TypeScript + Vite: static browser build, strict contracts and short feedback loop; no server rendering needed for a game.
- React: accessible HTML menus, HUD, character editor, parent report and maths focus overlay.
- Three.js: original procedural low-poly 3D, isometric camera, lighting, shadows, animated meshes. Renderer owns its animation loop; do not re-render React at frame rate.
- Pure TypeScript domain modules: seeded questions, rational comparison, answer validation, encounter transitions, progress analysis, save validation. Test independently of WebGL.
- Local storage: versioned single-player save for the slice. Explicit JSON export/import provides manual device transfer. Local saves alone are NOT cross-device sync and can be lost if browser storage is cleared.
- Firebase Hosting: static HTTPS delivery. Firebase Auth/Firestore later, when parent-owned profiles and security rules are ready. No backend or child analytics SDK in the slice.
- Vitest: mathematical invariants / state / save contracts. Playwright: real-browser game and persistence flows. GitHub Actions: locked dependency install, tests and production build.

## Boundaries
`src/game/math.ts`: questions with topic, difficulty, prompt, valid answers and worked explanation; injected deterministic random source.
`src/game/state.ts`: typed serialisable state, rewards, encounter lifecycle, topic summaries; no browser or renderer imports.
`src/game/save.ts`: validate unknown imports, local persistence and backup before import.
`src/game/world.ts`: procedural scene, reusable mesh factories, animation, movement, hit testing; callbacks for nearby target. Destroy all GPU resources and listeners on unmount.
`src/components/World.tsx`: renderer lifecycle adapter.
`src/App.tsx`: player flow, focus state, modal navigation and state persistence.
`src/styles.css`: original responsive visual system.

## Save contract
Version + profile + settings + seed + expedition + completed encounter IDs + guardian stage + experience + unlocks + attempts. Attempts record question ID and topic/difficulty, submitted answer, correctness, hint use and active response duration. A current question remains in component state; aborting does not award progress. Persist at every domain transition. Validate and bound imports before replacement, create local backup, never execute data. A future migration maps old versions explicitly; reject unknown future versions with useful feedback. No storage of date of birth, school or email in the slice.

## World generation
Seeded bounded clearings now; guaranteed reachable landmarks and reserved clear paths. Repeated expeditions change decoration and question sequence. Infinite terrain later: chunk coordinates + world seed, hashed chunk generators, shared border constraints, narrative encounter budgets, deterministic IDs, persistent sparse modifications and unloading of distant chunks. Infinite randomness without pacing is not a game; story gates and deliberate landmarks remain authored.

## Future cloud sync
Parent signs in; child profiles are pseudonymous and nested under parent identity. Firestore rules deny everything except the authenticated parent path. Attempt IDs are unique and append-only; merges are idempotent. Progress snapshots carry revision and schema, with explicit conflict handling for simultaneous devices. Cache locally; retry outbox on reconnect; never use last-write-wins to silently erase attempts. Emulator security tests, export/deletion and retention policy are release gates. Never ship public write rules.

## Performance / asset budgets
Target 60 fps on a typical recent laptop; minimum 30 fps on the agreed low-spec test device (not yet benchmarked). Cap device pixel ratio, share geometries/materials, use instancing when vegetation scale grows, cap shadow maps. No multi-megabyte remote textures for the slice. Lazy-load the renderer bundle. Future GLB assets: glTF, compressed geometry and KTX2 textures, consistent unit scale and named sockets. No network connection needed after static files load, but installable offline/PWA support is not yet included.

## Sources checked 2026-09-12
- Three.js colour management: https://threejs.org/manual/en/color-management.html
- Renderer reference: https://threejs.org/docs/pages/WebGLRenderer.html
- Firebase Hosting: https://firebase.google.com/docs/hosting/quickstart
- Firebase CLI: https://firebase.google.com/docs/cli

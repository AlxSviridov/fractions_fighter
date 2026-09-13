# ADR 0001 — Static 3D client and protected maths encounters

Date: 2026-09-12. Status: accepted baseline; revisit with playtest evidence.

Use React + TypeScript + Vite with Three.js and pure domain logic. Firebase static hosting initially. This supports original 3D visuals, accessible HTML questions and simple deployment without premature backend operations. A heavy game engine/WASM export has stronger editor tooling but adds build/asset overhead for this first browser slice. A flat quiz UI would not validate the requested game feel.

Protect thinking time and award one meaningful consequence per answer. Exploration is free. Longer maths ends phases. This is the core design hypothesis to test, not a proven engagement claim.

Procedural meshes are reproducible source-controlled first assets; authored Blender models later. Bounded seeded expeditions precede infinite streaming. Local versioned saves and explicit export precede authenticated cloud profiles. The limitations are visible and documented.

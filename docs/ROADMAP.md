# Roadmap and release gates

## 0 — Durable foundation + first playable (current)
Git-backed instructions/memory, original visual identity, procedural jungle, character editor, exploration, five maths templates, three seal encounters + guardian, local save transfer and parent report. Deliver a tested browser build. No promise of an infinite commercial-scale RPG in one iteration.
Gate: complete the whole loop in browser, validate maths/save/state, render QA, update handover, push code; Firebase only to a verified dedicated project.

## 1 — Child-pilot MVP
Three connected hand-shaped areas around a procedural backbone; camp → river crossing → pirate ruin → guardian; 20–30 minute authored arc. Add melee/bow traversal encounters, meaningful feedback animations, soundscape, topic equipment and a small inventory. Broaden learning coverage and long-division workspace. Tablet QA. Parent-owned cloud profiles and security tests if cross-device player saves are required for pilot.
Gate: 3–5 family playtests; children can explain mechanics and stop safely; pacing evidence; performance budget met; no critical accessibility or maths errors. Turn observational feedback into issues, not unverifiable “addictive” claims.

## 2 — Depth and replay
Seeded chunk streaming, 2–3 biomes, enemy affinity variants, optional paths, deterministic quest graph. Relic wear and diverse loot scheduler; small skill constellation. Authored Blender character rig, reusable animations, wearable sockets, richer guardian. Parent trends and guided practice.
Gate: reproducible generated worlds, no unreachable mandatory encounters, progression economy simulation, save compatibility.

## 3 — Personalised learning
Reviewed curriculum graph, conservative adaptation, spaced retrieval, misconception feedback, regional practice packs. Explain recommendations, parent override. Co-op only after considering consent, moderation and privacy.
Gate: learning evaluation that distinguishes skill improvement from question familiarity; confidence-aware metrics; security/accessibility audits.

## Working method
Take one vertical feature from design → domain logic → visuals → tests → browser QA → memory → commit/push. Keep the next 3 tasks concrete in BACKLOG. Capture architectural choices in ADRs. Prefer small shipped increments; never hide unfinished features behind clickable UI. Use GitHub issues for cross-session milestones once the initial checkpoint exists. Do not estimate commercial art scope as a one-session task.

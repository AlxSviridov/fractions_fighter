# Specialist fleet workflow

Requested explicitly by the owner on 2026-09-13. Use bounded specialist tasks with a coordinating integrator. Run at most three specialists alongside the integrator (four active agents total). Rotate roles rather than keeping nine agents reading the entire repository at once.

| Role | Responsibility | Effort policy |
| --- | --- | --- |
| Integrator / producer | Requirements, contracts, integration, memory, delivery | Sustained; controls scope and shared state |
| Maths tasks setter | Original action-tier generators and worked explanations | Focused implementation, bounded files |
| Maths tasks reviewer | Independent arithmetic and ambiguity audit | Short, independent pass after setter |
| Game designer / economy | Combat consequences, XP, inventory, loot, quests | One bounded vertical feature per task |
| Level designer | Safe village, routes, early enemies, encounter readability | Pair with assets for implementation |
| UI designer | Main menu, creation, HUD, inventory, readable thematic typography | Integrator or bounded UI component owner |
| 3D / assets designer | Reference-based silhouettes, equipment, animation and effects | Bounded scene / model task; no full history repetition |
| Scriptwriter | Fractions Fighter premise, quest dialogue and reward flavour | Pair with game designer; short content pass |
| Playtester | Critical 10-year-old gamer lens, confusion, boredom, reward appeal | Independent short review of the actual build; never invent a real child's reaction |
| QA / save reviewer | Reproducible browser checks, persistence and regressions | Reuse automated checks; test changed behaviours |

## Token discipline

Define exact owned files and API contracts before coding. No two writers own the same file. Use the current configured model by default, no fleet of maximum-effort duplicate planners. Routine docs/content audits should be brief; reserve deeper effort for game-state correctness, maths and integration bugs. Reuse a specialist when a small follow-up suffices. Send compact interfaces and findings rather than repeatedly forking the whole conversation. Stop agents when their bounded task is complete. Do not create extra user-facing tasks for implementation subtasks.

## Review gates

The setter does not self-certify as the independent reviewer. A playtester must evaluate available UI/game evidence and label inferred engagement as a hypothesis. Capture findings and implemented follow-ups in session notes. Integrator resolves conflicting proposals and runs the complete game path. The fleet is a way to improve the game, not a substitute for shipping and testing it.

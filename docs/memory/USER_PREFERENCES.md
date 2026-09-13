# Stable user preferences

- Owner: AlxSviridov. Repository: https://github.com/AlxSviridov/fractions_fighter.git
- Audience confirmed 2026-09-12: ages 9–11, laptop first; tablet controls desirable.
- Turn-key development including design, code, animations, assets and eventual Blender models.
- Visually compelling real game: Minecraft / Diablo 2 are quality and game-feel references, not assets or exact art styles to copy.
- Jungle adventure inspired by lost-world exploration: a found map, ancient ruins, wild animals, pirates and magical bosses. Pre-firearm setting.
- Maths should sustain game flow; not every movement or attack needs a question.
- Customisable name, appearance, hairstyle, outfit; outfit also changes through loot.
- MVP: manual difficulty. Later: performance-based progression, generated world, topic-specific equipment and enemies, equipment wear / loot rotation, skill tree.
- Track strengths and weaknesses; parent dashboard is appropriate.
- Maintain AGENTS.md and CLAUDE.md; work and context must survive model, session and device changes. Git-backed documentation is canonical.
- Maintain GitHub. Firebase deployment authorised once a verified playable MVP exists. No Firebase project identifier supplied initially.

- Confirmed during first session: isometric view, Diablo-inspired UI; mouse clicks are the primary movement and combat/interaction mechanic. Keyboard is secondary.

## Superseding owner corrections, 2026-09-13

Game name is Fractions Fighter, not Verdant. The owner rejected the first slice as an MVP. All thirteen comments are saved in `docs/feedback/2026-09-13-owner-review.md`. Require actual inventory/loot/XP/early combat, safe village and wilds, proper menu → character creation → play, local clickable launcher, thematic fonts, richer reference-based heroes and maths action tiers (quick falling comparisons for simple actions; untimed hard calculations for powerful abilities). A bounded specialist fleet with independent maths review and critical gamer-perspective playtesting is now explicitly requested.

## Cost and checkpoint amendment, 2026-09-13

Use subagents only when necessary. Routine workers should use Terra / Sonnet; Astra / Fable / Opus high should primarily orchestrate and handle hard decisions/reviews. Do not inherit frontier models for easy tasks. Deliver bite-size increments and commit all intended changes with updated progress documentation, then push to GitHub. Earlier fleet request describes available specialist roles, not mandatory concurrent agents.

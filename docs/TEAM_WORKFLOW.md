# Cost-conscious specialist workflow

Owner amendment, 2026-09-13: launch agents only when necessary; use Terra / Sonnet for routine work; progress in bite-size increments with code and documentation committed together. This supersedes the earlier default of running a rotating fleet. The specialist roles remain available on demand.

## Decide before delegating

1. Identify one concrete deliverable, acceptance check and exclusive file ownership. Delegate only when specialist independence or useful parallel work outweighs briefing and integration cost.
2. For a trivial change, do it directly. For routine substantial coding, use one junior implementer while the orchestrator handles integration or another necessary task. Never spawn a fleet simply to occupy roles.
3. Default to one worker; add workers only for independent tasks with clear benefit. The platform permits at most three workers plus the orchestrator, but this is a ceiling, not a target.
4. Stop after the bounded task. Reuse a worker only if it is already on the appropriate economical model. Avoid full-history forks and duplicate repository audits.

## Model routing

| Work                                                                  | Preferred model / effort                                               | Escalation                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Routine implementation, tests, small UI and documentation             | Terra (`gpt-5.6-terra`), low/medium; Sonnet equivalent where available | Give a precise failing example before increasing effort   |
| Independent maths/save review                                         | Terra / Sonnet, focused medium review with independent test oracle     | Escalate only unresolved correctness risks                |
| Architecture, task contracts, integration decisions, difficult review | Astra / Fable / Opus high as orchestrator                              | Frontier effort follows complexity, not a default maximum |
| Difficult specialist problem                                          | Start economical when reasonable                                       | Frontier only with recorded reason and bounded scope      |

Explicitly set the worker model and pass a compact brief. For this runtime, use `model: "gpt-5.6-terra"` and `fork_turns: "none"` (or limited turns) so a frontier parent is not inherited. Sonnet, Fable and Opus are cross-tool preferences, not names to fabricate in a tool that does not expose them. The active orchestrator cannot claim to have changed its own model. Do not consume reset credits or paid services without explicit owner approval.

## On-demand roles

- Maths setter: pure typed generators, hints and action-tier balance.
- Maths reviewer: independently derive answers from prompts; audit ambiguity and teaching methods.
- Game designer / economy: combat, XP, loot, equipment and quests.
- Level / assets designer: navigation, village/wilds, silhouettes, equipment and animation.
- UI designer: menus, creation, inventory, thematic readability and accessibility.
- Scriptwriter: original world, character and quest dialogue; usually bundled with game design.
- Playtester: critical simulated 10-year-old gamer perspective on the actual build; never substitute this for a real child trial.
- QA / save reviewer: persistence, regression and complete expedition checks.

The setter cannot self-certify as the independent reviewer. Required independence does not imply expensive models or all roles running simultaneously.

## Increment protocol

Choose one reviewable outcome; implement; run relevant tests; update `docs/memory/STATE.md`, `BACKLOG.md` and a session note; commit code/tests/docs together; push without force. Record what passed, what remains unverified, actual worker models and reasons for any escalation. For a release, run the full AGENTS.md quality gates. On interruption preserve partial work as an explicitly unverified checkpoint. A local commit is not a GitHub backup: record any unpushed work and the exact resume action.

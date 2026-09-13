# Fractions Fighter — The Shattered Compass

> Superseding direction (13 September 2026): [Engine rework](ENGINE_REWORK.md) and [increment plan](ENGINE_PLAN.md). Descriptions below include the legacy implemented build; resource combat and new interaction rules are planned until verified in STATE.

Current design: 13 September 2026. Supersedes the rejected Verdant seal-puzzle prototype. Owner feedback is canonical in `feedback/2026-09-13-owner-review.md`; implementation evidence is in `memory/STATE.md`.

## Promise and story

A young explorer follows an impossible map beyond a waterfall. The hidden world has fractured: its ancient compass is scattered among wild creatures, pirate camps and magical guardians. Haven is the last safe settlement. Scout Mira asks a new Fractions Fighter to recover the pieces and restore the paths home. The name describes both the shattered world and the mathematical understanding needed to mend it.

Original jungle fantasy for ages 9–11, laptop browser first. Melee, bows and relic magic; no firearms or gore. Isometric camera, click-to-move and click-to-approach enemies. Progress should feel earned through discoveries, equipment and growing capability. Engagement is a design hypothesis to test with children, not an established claim.

## Implemented expedition

1. Main menu → New Game → choose name, one of six reference-inspired heroes and Warden/Ranger/Arcanist → enter Haven. Existing heroes remain in Load Game.
2. Prepare in the safe village. Meet Mira through the quest panel, inspect equipment, recover health and draughts. Click the gate or Enter the wilds.
3. Five enemies are available immediately: two animals, two pirates and a shard guardian. Click ground freely, click a monster to approach, choose an action. The trail list offers an accessible target shortcut.
4. Solve a task appropriate to the chosen action. Show the attack and its consequence in the world; every defeated enemy awards gear, XP and gold. Compare equipment totals before equipping.
5. Defeat the five threats, return to Mira, claim the compass quest reward, then begin another expedition. Equipment and learning evidence persist. Quitting after any resolved action is safe.

## Thinking must be worth the action

| Action                             | Mathematical cost                                    | Current consequence                                  |
| ---------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Move, inspect, equip, choose route | None                                                 | Free exploration and decisions                       |
| Quick strike                       | Close fraction/percentage comparison, choose < = >   | 1× attack; ordinary first enemies take a few strikes |
| Power skill                        | Untimed multiplication, percentage or rectangle task | 3× attack; usually resolves an early enemy           |
| Ancient ritual                     | Untimed larger exact division, optional working area | 7× attack; can resolve the first guardian            |
| Healing draught                    | Untimed focus calculation                            | Substantial healing, consumes a draught              |

The optional falling quick rune allows 25/20/15 seconds in Explorer/Adventurer/Pathfinder, then relaxes without damage for player attacks. A proactive enemy ward instead blocks on a correct answer or applies the displayed armour-mitigated damage on a wrong answer/expiry; its timer can also be paused with hints or Let me think. Let me think, hints and reduced motion remove time pressure. Power and ritual questions never use a reflex timer. Wrong combat answers incur a modest ward/health cost and allow retry; rescue returns a fallen hero to Haven without deleting loot or XP. Enemy attack scheduling pauses during questions, reward inspection, menus and hidden tabs.

Nearby enemies now telegraph after 4.5 seconds and initiate a ward at 8 seconds if the hero stays within range. Current combat is protected maths-driven action selection with these reactive defence events. It is not yet a continuous dodge/melee action system. Next experiment: short free combat intervals with telegraphed threats and a maths charge that powers several moves. Do not add a task to every click or require ten long calculations for one enemy.

## Reward and identity

Three equipment slots: weapon, armour and relic. Guaranteed early drops make the first action worthwhile; rarity, stat comparisons, equipment visuals and level growth make progress visible. Quest and enemy rewards are idempotent. Gold currently accumulates; a useful forge/shop is a next increment, not a pretend working service. Topic affinities are recorded on loot but do not yet control questions or grant special powers.

Six supplied portraits are used directly. Their world models are original polygonal interpretations, not exact 2D-to-3D reconstructions. Identity is chosen before play; loot changes equipment. Full hair/accessory/body editing, close-up 3D preview and more authored costumes remain required improvements.

## Longer experience

Build a 20–30 minute authored arc before infinite map streaming: Haven → river trail → pirate camp → guardian sanctuary, with optional discoveries and checkpoints every few minutes. Distinct enemies should telegraph distinct actions, not merely have different HP. A session should end with a new discovery, an earned improvement and an inviting next destination.

Later topic equipment can steer practice: percentage fireball, geometry mace, fraction shield. Depleting relic charges and diverse drop scheduling should encourage variety while preserving a usable favourite and a free fallback. No streak loss, paid random rewards or compulsory grind. A small skill constellation should unlock different approaches rather than only increasing numbers.

## Quality gate

Verify menu/new/load, actual pointer navigation, all maths tiers, mistakes/hints, loot/equip, completed quest, next expedition, reload and parent export/import. Review visuals at laptop size and reduced motion. Validate voluntary continuation and comprehension with real family playtests; simulated gamer review is only a preliminary critique. Commercial reference quality, infinite terrain and a complete 11+ curriculum are not claimed by this build.

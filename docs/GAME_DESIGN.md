# Fractions Fighter — The Shattered Compass

> Superseding direction (13 September 2026): [Engine rework](ENGINE_REWORK.md) and [increment plan](ENGINE_PLAN.md). Descriptions below include the legacy implemented build; resource combat and new interaction rules are planned until verified in STATE.
>
> Level design (28 September 2026): the wilds is now **Chapter I: The Emerald Trail**, an authored 8-area level with gates, puzzles, chests, lore and a boss. See [LEVEL_DESIGN.md](LEVEL_DESIGN.md) and the puzzle [task repository](TASK_BANK.md).

Current design: 13 September 2026. Supersedes the rejected Verdant seal-puzzle prototype. Owner feedback is canonical in `feedback/2026-09-13-owner-review.md`; implementation evidence is in `memory/STATE.md`.

## Promise and story

A young explorer follows an impossible map beyond a waterfall. The hidden world has fractured: its ancient compass is scattered among wild creatures, pirate camps and magical guardians. Haven is the last safe settlement. Scout Mira asks a new Fractions Fighter to recover the pieces and restore the paths home. The name describes both the shattered world and the mathematical understanding needed to mend it.

Original jungle fantasy for ages 9–11, laptop browser first. Melee, bows and relic magic; no firearms or gore. Isometric camera, click-to-move and click-to-approach enemies. Progress should feel earned through discoveries, equipment and growing capability. Engagement is a design hypothesis to test with children, not an established claim.

## Implemented expedition

1. Main menu → New Game → choose name, one of six reference-inspired heroes and Warden/Ranger/Arcanist → enter Haven. Existing heroes remain in Load Game.
2. Prepare in the safe village. Meet Mira through the quest panel, inspect equipment, recover health and draughts. Click the gate or Enter the wilds.
3. Arrive at Waterfall Landing, the start of the Emerald Trail. A follow camera, trail map, region banners and a single current objective ("Guide me there") lead north through Fern Hollow, Tide Ford, the Corsair Stockade and the Sealed Antechamber to the Shard Sanctuary. Two optional detours (Mossy Grotto, Sunken Cove) hide puzzle chests.
4. Nine encounters (minions, three elites and a boss) stay in their areas. Click a monster to approach and choose an action; solve a task appropriate to that action. Every defeat awards gear, XP and gold.
5. Four gates shape the route: a bridge winch puzzle, a corsair code lock, a barricade that falls with Captain Redsail, and a sanctum door held by three rune seals. World puzzles are untimed, story-framed tasks from the reviewed [task bank](TASK_BANK.md); mistakes cost nothing. Chests, a healing shrine and lore stones reward exploration.
6. Defeat the Shard Guardian, return to Mira, claim the compass quest reward, then begin another expedition. The bridge and stockade stay open (story shortcuts); chests, shrine and seals reset with new puzzle variants. Equipment and learning evidence persist. Quitting after any resolved action is safe.

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

Chapter I delivers the first authored arc (Haven → river → pirate stockade → guardian sanctuary) with optional discoveries and a checkpoint beat roughly every few minutes; see [LEVEL_DESIGN.md](LEVEL_DESIGN.md). Each enemy now has its own wind-up line, and elites are visibly larger, but attack patterns are still shared: distinct behaviours need the moving-enemy work (ENGINE_PLAN P6/P17). A session should end with a new discovery, an earned improvement and an inviting next destination.

Later topic equipment can steer practice: percentage fireball, geometry mace, fraction shield. Depleting relic charges and diverse drop scheduling should encourage variety while preserving a usable favourite and a free fallback. No streak loss, paid random rewards or compulsory grind. A small skill constellation should unlock different approaches rather than only increasing numbers.

## Quality gate

Verify menu/new/load, actual pointer navigation, all maths tiers, mistakes/hints, loot/equip, completed quest, next expedition, reload and parent export/import. Review visuals at laptop size and reduced motion. Validate voluntary continuation and comprehension with real family playtests; simulated gamer review is only a preliminary critique. Commercial reference quality, infinite terrain and a complete 11+ curriculum are not claimed by this build.

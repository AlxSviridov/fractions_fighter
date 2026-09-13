# Current state

Updated 2026-09-13. **Development build 0.3: combat, equipment and authored world increment. Owner acceptance remains pending.**

## Latest increment

Resumed existing uncommitted combat/equipment work rather than discarding it. Integrated close comparison maths, proactive enemy wards, explicit armour mitigation, illustrated inventory/loot and prominent Return to Haven. Removed duplicate decorative guardian and improved action effects. World now includes a river crossing with bounded far-bank access, pirate outpost and guardian sanctuary; these are authored scenery, not additional quests or a new biome.

Existing menu → character creation → Haven → wilds, six portraits/procedural hero silhouettes, three classes, five enemies, guaranteed loot, equipment stats, XP/gold, quest reward, per-hero saves and parent journal remain implemented. The clickable `Launch Fractions Fighter.command` rebuilds and opens the current version.

## Behaviour and validation

- Enemies within six world units telegraph after 4.5 seconds and request a ward after 8 seconds. Move away to evade. Correct blocks; wrong/expired ward applies displayed attack minus armour, with a maximum-hit safety cap. Defeat rescues the hero to Haven without losing loot.
- Questions, menus, loot inspection and hidden tabs suspend enemy scheduling. Quick timing is optional, with hints/Let me think. Focus and ritual remain untimed. Attack-rune expiry does not damage health; defence-rune expiry does.
- Close non-equal comparison maximum gaps: Explorer 1/20, Adventurer 1/30, Pathfinder 1/50. Unlike denominators and fraction/percentage representations; 25/20/15 second optional timers. Independent prompt-derived exact maths review passed (23 focused tests).
- Root real-browser inspection: new Mooncat hero → Haven → wilds, enemy ward correct block, illustrated inventory, laptop layout, pointer movement out of telegraph range toward river. Fixed return/toast overlap with inventory, and quest/trail card overlap at short laptop heights.
- Full final unit/build/browser results are being collected in the current session note; do not infer release verification from the above targeted checks.

## Git / hosting

Authorised remote: https://github.com/AlxSviridov/fractions_fighter.git . Previous checkpoint `0d75013` on main. This increment is pending final checks and checkpoint. Dedicated Firebase project: `fractions-fighter-verdant`; no Hosting deployment claimed. No billing enabled. Local runtime is Node 25; Node 22 is pinned for CI/new devices but not installed at the inspected local locations.

## Exact next action

Complete final browser suite including full expedition, per-hero save/export/import, settings/keyboard/compact UI and proactive defence. Format, record evidence, commit code and memory together, push and inspect CI. Then choose the next meaningful gameplay increment from BACKLOG.

## Honest remaining scope

Still a compact five-enemy encounter map. Far-bank beacon and legacy shrines are scenery; no secret-chest reward or authored side quest yet. All enemies currently share one ward pattern. Focus/ritual can resolve early enemies with one answer. Finite comparison pool risks repetition. Gold has no working shop/forge sink. Full character/body/hair/accessory editing, authored 3D animation, curriculum breadth and stepwise long division are outstanding. Exact 2D-to-3D avatar conversion, infinite streaming, cloud parent profiles and commercial-quality engagement are not claimed. Real child playtesting is required; simulated review is not a child trial.

## Superseding planning checkpoint — 13 September 2026

ENGINE_REWORK.md defines the new resource-combat/world-interaction contract; ENGINE_PLAN.md defines 18 bite-size increments. Current behaviour remains the inherited build 0.3. Preserve all inherited modified/untracked code and reviews in this explicitly unfinished checkpoint; no new validation or deployment is claimed here. Exact next action: P1 character/equipment sheet, relevant unit/build and real-browser inspection, then commit/push. Earlier final-suite work remains unverified.

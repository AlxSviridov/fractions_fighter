# Level design — Chapter I: The Emerald Trail

Status: implemented 28 September 2026 (build 0.4). Data and rules live in `src/game/level.ts`; puzzle maths in `src/game/taskBank.ts` (see [TASK_BANK.md](TASK_BANK.md)); scenery in `src/game/world.ts`. This document is the design intent. [STATE](memory/STATE.md) records what has actually been verified. Owner acceptance and real-child playtesting are still outstanding.

## Why this replaced the old wilds

The previous wilds was a single 22 × 18 clearing with five stationary enemies visible from the gate. Every enemy was reachable at once, there was nothing to discover, nothing to open, nothing gated behind anything else. The route was "click the five names in the list". The owner asked twice for deliberate level design and a real game rather than a placeholder (feedback 2026-09-13).

The Emerald Trail is an authored, linear-with-detours level of **8 areas, 4 gates, 9 encounters and 14 interactive objects**. The trail is roughly 65 units long against the old 18, and the camera follows the hero. Target session: **15–25 minutes** for a first clear. This is a design hypothesis until timed with a child.

## Design pillars

1. **Always a next thing to do.** One visible critical-path objective (HUD card, map ring, "Guide me there"). You should never have to ask "what now?".
2. **Maths opens the world, not just enemies.** Bridges, locks and seals open with untimed, story-framed puzzles from a reviewed bank. Combat still uses the action-tier maths.
3. **Reward curiosity.** Every side route pays: a chest, a harder puzzle chest with better loot, lore that explains the next puzzle, or a healing shrine.
4. **Readable threat.** Enemies stay inside their areas, elites are visibly larger with a gold ring, and each enemy has its own wind-up line.
5. **Safe to fail.** Wrong puzzle answers cost nothing, hints are always allowed, and rescue to Haven keeps loot. No streaks, no lost progress.
6. **Progress sticks.** The bridge and stockade stay open on later expeditions (story shortcuts). Chests, the shrine and the seals reset, so each replay has new loot and a new puzzle variant.

## Map

North is up. The hero enters from Haven at the south. `[G]` = gate, `*` = optional.

```
                    ┌───────────────────┐
                    │  SHARD SANCTUARY  │  Shard Guardian (boss) · compass fragment
                    └─────────┬─────────┘
                        [G4 Sanctum Door]    opens when all three seals break
                    ┌─────────┴─────────┐
                    │ SEALED ANTECHAMBER│  Moss Sentinel (elite) · 3 rune seals
                    └─────────┬─────────┘
                       [G3 Barricade]        drops when Captain Redsail falls
          ┌───────────────────┴──────┐ ┌──────────────┐
          │  CORSAIR STOCKADE        ├─┤ *SUNKEN COVE │  drowned chest (hardest puzzle)
          │  Lookout · Captain Redsail│ └──────────────┘
          │  strongbox · captain's log│
          └───────────┬──────────────┘
                 [G2 Stockade Gate]          corsair code lock (percentages)
          ┌───────────┴──────────────┐
          │  TIDE FORD               │  Canopy Raider · Rope Cutter
          │  tide shrine · warning   │
          └───────────┬──────────────┘
      ~~~~~~~~~~~ [G1 Rope Bridge] ~~~~~~~~~~ river
┌───────────┐ ┌───────┴──────────────┐
│*MOSSY     ├─┤  FERN HOLLOW         │  Fern Stalker · Thornback Boar (elite)
│ GROTTO    │ │  bridge winch · satchel │
└───────────┘ └───────┬──────────────┘
              ┌───────┴──────────────┐
              │  WATERFALL LANDING   │  Bramble Prowler · supply chest · trail mark
              └──────────── spawn ───┘
```

## Beat sheet

| #   | Area               | Purpose                                                                                           | Encounters                               | Objects                                                                 | Exit condition                  |
| --- | ------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| 1   | Waterfall Landing  | Tutorial: move, fight one weak enemy, open a free chest, read a sign that sets up the whole route | Bramble Prowler (16 HP)                  | Mira's Supply Chest (armour, draught), Trail Mark Stone (lore)          | Free corridor north             |
| 2   | Fern Hollow        | First real clearing. First elite. First maths gate                                                | Fern Stalker, Thornback Boar (elite)     | Bridge Winch (puzzle, G1), Lost Explorer's Satchel (lore hint + gold)   | G1: solve the winch             |
| 2a  | Mossy Grotto \*    | First optional detour: a visible cave mouth off the main path                                     | none                                     | Moss-Lock Cache (fractions puzzle → uncommon relic)                     | Dead end                        |
| 3   | Tide Ford          | Enemy faction change (corsairs). Rest point before the fortress                                   | Canopy Raider, Rope Cutter               | Tide Shrine (full heal, +1 draught), Warning Post (lore hint)           | G2: solve the code lock         |
| 4   | Corsair Stockade   | Fortress set-piece. Mini-boss. Boss-gated treasure                                                | Corsair Lookout, Captain Redsail (elite) | Redsail's Strongbox (needs captain defeated), Captain's Log (lore hint) | G3: defeat Captain Redsail      |
| 4a  | Sunken Cove \*     | Hard optional challenge for confident players                                                     | none                                     | Drowned Chest (long multi-step puzzle → legendary relic)                | Dead end                        |
| 5   | Sealed Antechamber | Three-part puzzle room guarded by an elite                                                        | Moss Sentinel (elite)                    | Seal of Shapes, Seal of Parts, Seal of Sharing                          | G4: all three seals broken      |
| 6   | Shard Sanctuary    | Boss arena                                                                                        | Shard Guardian (boss, 110 HP)            | none                                                                    | Guardian defeated → return home |

### Why this order

- **Gate variety.** The four gates open in four different ways: a puzzle (winch), a puzzle framed as a lock (code lock), a boss kill (barricade), a three-part puzzle (seals). The player learns that the world has rules, not that every door is a quiz.
- **Lore sets up puzzles.** The satchel explains the winch, the warning post explains the code lock and the captain's log explains the seals. Reading is optional but pays off.
- **Threat-radius tension.** Each mechanism sits inside an enemy's 6-unit threat radius: the Fern Stalker for the winch, the Canopy Raider for the code lock, the Moss Sentinel for the seals. Puzzles themselves pause the world, but walking up to them invites an attack. That makes clearing an area first a real tactical choice. The spawn point is deliberately outside every threat radius (tested).
- **Rest before the fortress.** The Tide Shrine sits one area before the stockade, so it can be used on the way in.
- **Optional is visible.** Both detours are visible from the main path (the cave mouth and the cove opening in the palisade) and are marked on the trail map once reachable.

## Encounters and balance

Level-1 Warden with the starter weapon has 12 attack: quick strike ×1 = 12, power ×3 = 36, ritual ×7 = 84.

| Enemy           | Rank   | HP  | Attack | XP  | Gold | Drop (enemy loot rotates topic affinity by expedition) |
| --------------- | ------ | --- | ------ | --- | ---- | ------------------------------------------------------ |
| Bramble Prowler | minion | 16  | 4      | 25  | 8    | Tidefang (uncommon weapon, 4)                          |
| Fern Stalker    | minion | 22  | 5      | 30  | 10   | Fernweave Wraps (uncommon armour, 3)                   |
| Thornback Boar  | elite  | 34  | 8      | 45  | 18   | Thornback Tusk-Axe (rare weapon, 7)                    |
| Canopy Raider   | minion | 30  | 7      | 40  | 16   | Canopy Mantle (rare armour, 5)                         |
| Rope Cutter     | minion | 30  | 7      | 40  | 16   | Ember Prism (rare relic, 6)                            |
| Corsair Lookout | minion | 36  | 8      | 45  | 20   | Corsair Runeblade (rare weapon, 9)                     |
| Captain Redsail | elite  | 62  | 10     | 80  | 40   | Redsail Greatcoat (rare armour, 7)                     |
| Moss Sentinel   | elite  | 48  | 9      | 55  | 22   | Mossheart Charm (rare relic, 8)                        |
| Shard Guardian  | boss   | 110 | 12     | 120 | 60   | Compass of Unity (legendary relic, 12)                 |

Rules enforced by tests: every minion falls to at most three quick strikes at level 1; the guardian survives one level-1 ritual and falls to two. Expedition scaling is unchanged: +3 HP per expedition and +1 attack every three, capped at expedition 21.

Only the **critical path** is required: winch, code lock, Captain Redsail, three seals, Shard Guardian. Clearing every enemy is optional, and the journal counts threats, treasures and lore for players who want to.

## Objects

| Object                  | Kind      | Area        | Maths                                | Reward                                   | Persists across expeditions? |
| ----------------------- | --------- | ----------- | ------------------------------------ | ---------------------------------------- | ---------------------------- |
| Mira's Supply Chest     | chest     | Landing     | none                                 | common armour, +1 draught, 10 XP, 5 gold | resets                       |
| Trail Mark Stone        | lore      | Landing     | none                                 | 10 XP                                    | story                        |
| Lost Explorer's Satchel | lore      | Hollow      | none                                 | 10 XP, 6 gold                            | story                        |
| Bridge Winch            | mechanism | Hollow      | bridge-winch (focus)                 | opens G1, 25 XP                          | story                        |
| Moss-Lock Cache         | puzzle    | Grotto      | mossy-cache (focus)                  | uncommon relic, 30 XP, 12 gold           | resets                       |
| Tide Shrine             | shrine    | Ford        | none                                 | full health, +1 draught                  | resets                       |
| Corsair Warning Post    | lore      | Ford        | none                                 | 10 XP                                    | story                        |
| Corsair Code Lock       | mechanism | Ford        | stockade-lock (focus)                | opens G2, 25 XP                          | story                        |
| Redsail's Strongbox     | chest     | Stockade    | none, needs Captain Redsail defeated | rare weapon, 20 XP, 35 gold              | resets                       |
| Captain's Log           | lore      | Stockade    | none                                 | 10 XP                                    | story                        |
| Drowned Chest           | puzzle    | Cove        | sunken-cache (ritual, multi-step)    | legendary relic, 60 XP, 40 gold          | resets                       |
| Seal of Shapes          | seal      | Antechamber | seal-shapes (focus, geometry)        | 20 XP; one third of G4                   | resets                       |
| Seal of Parts           | seal      | Antechamber | seal-parts (focus, fractions)        | 20 XP; one third of G4                   | resets                       |
| Seal of Sharing         | seal      | Antechamber | seal-sharing (ritual, division)      | 30 XP; final third of G4                 | resets                       |

Chest loot IDs are `cache-{expedition}-{objectId}`, so a chest can never pay twice in one expedition, and each expedition has fresh loot. Enemy loot IDs are `trail-{expedition}-{index}`. The new prefix avoids colliding with the old layout's `loot-*` IDs in migrated saves.

## Navigation and UX

- **Follow camera** in the wilds with a smooth lerp; the village keeps its framed shot. Sun and shadows follow the camera focus.
- **Click-to-move pathfinding.** A 0.5-unit grid, 8-way Dijkstra, no corner cutting, then line-of-sight smoothing with 0.35-unit edge clearance. Clicking somewhere unreachable walks to the nearest reachable point and explains which gate is closed.
- **Trail map** (top-left, toggle with **M**). Reachable areas are drawn and locked areas fogged. It shows gates (red closed, gold open), usable objects (gold = puzzle, white = free), enemies in reach, the player and a pulsing objective ring.
- **Objective card** (top-right): current step, "n / 5 trail objectives", and **Guide me there**, which paths to the next object or enemy.
- **Region banner** when entering each area, with its name, subtitle and one line of intent.
- **Interaction prompt** near an object: its name, what it needs, click or **E**.
- **Points of interest** list in the Quests journal (**J**). It is a keyboard-accessible alternative to clicking objects in 3D.
- **Threats in reach**: the three nearest reachable enemies, plus a count of how many are cleared.

## Replay loop

Claiming Mira's reward and re-entering starts expedition N+1. Story objects (bridge winch, code lock, lore) stay resolved, so the bridge and stockade are already open and the trail starts at "Defeat Captain Redsail". Chests, the shrine and the seals reset. Puzzle variants rotate (`drawTask` cycles three variants per pool and band), enemies scale, and enemy loot rotates topic affinity.

## Accessibility and comfort

All puzzles are untimed and pause the world. Every 3D interaction has an HTML equivalent (points of interest list, Guide me, tracker buttons, E key). Reduced motion snaps gate and chest animations and disables banner/map pulses. The trail map hides on short or narrow screens (≤ 600 px high or ≤ 800 px wide) instead of overlapping controls.

## Known limitations

- Enemies are still stationary, and combat is still the legacy quick/power/ritual model. Moving enemies and resource combat are ENGINE_PLAN P5–P12.
- The Sanctum Door is opened by maths seals, not by a spell. The owner's spell-only door (MATH-3c / P16) is still pending and should reuse this gate system with a spell-tagged event.
- No dialogue with Mira beyond the existing quest panel; no NPCs on the trail.
- Scenery is procedural low-poly. Trees on the camera-facing edge are replaced by undergrowth so they don't hide the hero, but some occlusion near clearing edges remains possible.
- Pacing numbers (15–25 minutes, threat radius, HP) are untested with a child.
- In software-rendered browsers (CI, containers) the frame rate is very low. Movement is sub-stepped so it can't pass through walls, but real-time pacing there is not representative.

## Playtest questions for the first family session

1. Without help, does the child find the bridge winch? How long does it take?
2. Do they read lore stones, and does the satchel hint change how they approach the winch?
3. Do they take either optional detour? Do they attempt the Drowned Chest, and do they finish it?
4. Is Captain Redsail satisfying or a slog at their level? Is the Shard Guardian?
5. Do they use the trail map or "Guide me there"?
6. Where do they stop, and do they want to start expedition 2?

## Next chapters (roadmap, not implemented)

The level format (regions, gates, objects, objectives) is data-driven, so Chapter II can be another `level.ts` data set: for example, the river delta with the corsair fleet. Candidate additions: a spell-only door (P16), moving patrols (P6), altars (P14), merchant (P16a), and a second biome.

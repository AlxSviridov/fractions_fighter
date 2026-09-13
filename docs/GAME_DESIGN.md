# Verdant — The Lost Map

Status: design baseline, 2026-09-12. Working title; repository remains fractions_fighter.

## Promise

You followed a map that should not exist. Beyond the waterfall lies a forgotten jungle kingdom. Its paths, creatures and relics answer to the patterns hidden in numbers. Recover the scattered compass seals and find a way home.

A beautiful, generous adventure where understanding maths gives you power. Ages 9–11, desktop browser first. Original stylised 3D, an elevated isometric camera, warm carved stone against deep jade foliage, turquoise magic and parchment accents. No guns, gore, advertisements, paid random rewards or punishment for missing a day.

## The central design problem: thinking takes time

A long calculation cannot be priced like an ordinary sword swing. Maths is a high-value decision, not an animation tax. Movement, looking around, collecting rewards and choosing a route are free. One short answer opens a path, restores substantial energy, counters an entire attack or wins a small encounter. One demanding answer can end a boss phase or unlock a room, not shave off 5% of an enemy's health.

First slice: approach a point of interest, press E or interact, enter a protected focus state, solve, see the world respond, collect a tangible reward, move on. No countdown and no incoming damage while a question is open. Wrong answers reveal support, permit retry and do not erase previously won rewards. Hints are always available and recorded separately from independent success.

Future combat: 10–25 seconds of free movement / dodging / melee between maths decisions; a visibly telegraphed focus opportunity freezes hostile simulation. A short calculation charges a whole quiver or shield cycle. A two-minute ritual delivers an encounter-changing action. Do not insert questions on every input. Difficulty controls mathematics, not reaction speed.

## First playable slice vs full MVP

The first slice validates exploration → maths → visible consequence → reward. It has one compact generated jungle clearing with a ruin, three seal encounters, treasure and a multi-question guardian. It can generate another bounded expedition after completion. It is NOT yet an infinite world or a full action RPG. A complete first run should take roughly 5–12 minutes depending on reading and maths. Repeated expeditions support a longer sitting, but a polished 30-minute narrative session requires more content and playtesting.

The child-pilot MVP adds 3 linked areas, approximately 15–25 meaningful maths decisions, two creature types, pirate encounters, a proper boss, a compact inventory and an authored 20–30 minute journey with a safe stopping point every few minutes. Release the tested first slice early for owner feedback; do not label unimplemented mechanics complete.

## Expedition structure

1. Camp: personalise explorer, choose maths difficulty, read a two-sentence mission.
2. Explore: follow stepping stones and discover optional caches; free WASD/arrow or click navigation.
3. Three seals: fraction comparison at a waystone, multiplication at a ward, percentage or geometry at a ruin.
4. Guardian: three protected puzzle phases across different topics, ending with a division ritual. Each success visibly progresses the encounter.
5. Resolution: compass relic, experience, an outfit unlock, topic summary, return or new seeded expedition.

## Progression and rewards

Experience reflects completed encounters; first-try correctness is measured independently. A hint must never prevent story progress. Level and expedition count persist. Cosmetic unlocks are deterministic rewards. No streak-loss pressure. Future skills offer meaningful utility: longer ward duration, bigger map reveal, alternate travel paths. A 30-minute session should finish with something discovered, something earned and a clear next destination.

Topic affinity equipment (future): e.g. Ember bow = percentages, Surveyor's mace = geometry, Tide cloak = fractions. Relic charge depletes slowly over several encounters, with ample warning and useful fallback tools. A loot scheduler favours under-practised topics and avoids repeating the last two affinities; players retain agency and can repair a favourite. Do not make a child fail a preferred fantasy because a topic is weak. Equipment never creates mandatory grinding or cash repair.

Enemies (future): territorial animals retreat rather than die; pirates use bows and melee; rune creatures embody maths patterns. Geometry guardian projects shapes; percentage wisp splits energy; ratio serpent divides a path. Visual telegraphs communicate both the threat and the topic without depending on colour alone.

## Character

First slice: name, skin tone, haircut, outfit palette in a real animated 3D explorer. Loot unlocks an additional outfit. Store choices in the save. Future: body presets, more hair meshes, wearable equipment, accessories and a short creator scene. Avoid gender-locking attributes.

## Flow and learning measurement

Validate, do not assume, that the loop is compelling. Observe voluntary continuation, frustration, hints, time spent navigating vs solving, and what a child can explain after play. No claim that engagement alone proves learning. Playtest targets: first interesting interaction within 60 seconds; question transition under 250 ms; reward response immediately after confirmation; safe quit at every completed encounter. Track active response time, not a hidden-tab clock. No speed leaderboard.

## Controls and accessibility

Desktop (confirmed user direction): Diablo-inspired isometric, mouse-first. Click ground to move; click a landmark or enemy to approach and interact/fight. WASD/arrows and E are secondary shortcuts; visible on-screen buttons; Escape closes safe menus. Questions use HTML, large readable text, labelled inputs, keyboard-accessible options, feedback text and focus management. Reduced motion stops camera flourishes / decorative animation. Sound optional and off by default. Thinking is untimed. Responsive HUD and touch directional buttons supplement laptop controls. Full screen-reader spatial navigation and configurable keybindings are later work and must be stated as limitations.

## Acceptance gate

A new player can customise, travel to each seal, solve at every difficulty, recover from mistakes, defeat the guardian, receive a cosmetic, reload without losing progress and inspect/export real results. Keyboard and pointer paths work. No placeholder buttons or invented dashboard statistics. Full graphical fidelity comparable to a commercial game requires sustained art and playtest iterations; the first slice establishes a coherent original art direction and a real game foundation.

# Owner review — 13 September 2026

The owner rejected the first build as undercooked and below their MVP expectation. Do not rebrand that prototype as an accepted MVP. The following requirements supersede conflicting earlier scope choices.

1. Provide a clickable file in the project folder that launches the game.
2. Use a typical game menu: New Game → character creation → play; Load Game; Settings. Character creation is not a mid-game shirt recolouring screen.
3. Save all progress, owner comments and design reasoning in documentation.
4. Inventory and loot are required now.
5. Current process is uninteresting. Diablo-style loot and experience should drive replay. Monsters must be available to fight from the beginning.
6. Have a safe village and a separate exploration zone with enemies and quests.
7. Overall quality is undercooked; the earlier build is not the requested MVP.
8. Use thematic fonts that fit the game's visual style.
9. Honour simple maths for simple actions and substantially harder maths for stronger / complex actions.
10. Implement a fleet approach: maths setter, independent maths reviewer, game designer, level designer, UI designer, 3D/assets designer, scriptwriter, playtester adopting a 10-year-old gamer's critical perspective. Consider additional roles and control token spend.
11. Much more meaningful character customisation. Inspect `precedent projects  refs/characters/avatars`. Owner would love these exact avatar images with corresponding proper polygonal 3D characters; do not pretend mere shirt recolouring meets this request.
12. The game is named **Fractions Fighter**. Develop story underpinning that name. Retire Verdant as the game title.
13. Easy tasks can be dynamic minigames: falling equations, choosing < = > before a card falls, simple multiple choice. Calculations like 22 × 16 must NOT become timed reflex tasks.

## Response and implementation decisions

Rebuild the active game flow rather than stacking cosmetic patches onto the quiz expedition. Keep tested foundational maths/save utilities where useful. New menu owns new/load flows; character identity is established at New Game. Safe village and wilds share a typed RPG state. Clicking enemies produces an action choice with quick strike, focus power and demanding ritual, each with different mathematical cost and combat value. Inventory/equipment and quest rewards are visible from the first fight.

Six distinct supplied avatar portraits will seed selectable heroes, including humanoid, cat mage, ancient construct and cloud elemental silhouettes. 3D versions are deliberate original polygonal reinterpretations, not a claimed automatic exact reconstruction of 2D pictures. Additional references remain available for expansion.

## Release gate

Do not claim completion until the clickable launcher, main menu/new/load, character identity, village/wilds, first combat, tiered maths, loot/equipment, quest reward and save/reload are actually checked. Record remaining art/playtest limitations explicitly. User acceptance, not the label “MVP”, is the quality bar.

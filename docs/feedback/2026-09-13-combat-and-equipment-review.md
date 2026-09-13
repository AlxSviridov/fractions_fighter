# Owner follow-up: combat, difficulty and equipment

The owner again described the game as very underdeveloped and requested experienced game-design judgment, not a surface feature checklist.

- Diablo-like inventory, with recognisable loot assets (generic art acceptable initially).
- More intelligent, harder maths. Comparisons should be close enough to require thought, not obvious same-denominator or widely separated values such as 1/7 versus 95%.
- A clearly visible way back to the village.
- Enemies must initiate attacks; solve promptly to defend.
- More interesting level design.
- Make the benefit of defence visible.

## Integration decisions

First complete a coherent encounter: nearby enemy telegraphs an attack, the player can move away, then a timed comparison powers a ward. Correct blocks; wrong/expired defence applies explicitly displayed incoming attack minus armour. Menus, hidden tabs and longer calculation encounters protect thinking time. Optional relaxed play remains available. Reward XP/loot comes from defeats, not repeatedly blocking the same enemy.

Tight rational comparison gaps are enforced in the generator and independently tested. Different representations and denominators avoid trivial comparisons; all operands, equality and methods remain exact. Longer actions receive meaningfully harder calculations with no countdown.

Return to Haven becomes a labelled, prominent control. Equipment art and inventory layout are a separate next increment; level design follows with deliberate routes, discoveries and encounter identities, rather than larger random decoration.

These are implementation directions, not acceptance or completion claims. Evidence belongs in STATE/BACKLOG and the session note.

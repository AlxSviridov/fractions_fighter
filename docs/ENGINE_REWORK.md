# World interaction and combat redesign

Status: approved owner direction, 13 September 2026; implementation tracked in ENGINE_PLAN.md. This specification supersedes conflicting attack-tier, timer and scenery assumptions in GAME_DESIGN.md, LEARNING_DESIGN.md and earlier feedback. It is not a claim that these systems already work.

## Experience and reference

A Fractions Fighter explores freely, chooses equipment, fights moving enemies, and solves substantial maths to prepare the next burst of action. Combat decisions are movement, distance, resource choice and timing. Maths supplies power rather than interrupting every swing. Haven is safe. The jungle remains an original ancient-ruin adventure, without firearms or gore.

Use Diablo II's UI/UX closely as the reference: equipment arranged around a hero, a compact item grid, rarity-labelled loot, inspect/compare/equip, a character sheet, health/resource display and a persistent action belt. Reproduce the useful layout and interaction conventions with original artwork and readable labels. Do not merely add a decorative grid to the old quiz interface.

References checked 13 September 2026: [Blizzard manual](https://ftp.blizzard.com/pub/misc/Diablo%20II%20Manual.pdf), [controls](https://classic.battle.net/diablo2exp/basics/controls.shtml), [item basics](https://classic.battle.net/DIABLO2EXP/ITEMS/basics.shtml). These inform the reference interaction; the balancing numbers below are our proposed starting values, not Diablo rules.

## 1. Inventory, stats and HUD

First establish a useful character/equipment sheet: level and XP progress, health, attack and armour, base versus equipment contribution, all equipped items and a comparison showing every changed stat. Click or keyboard-select an item; inspect; equip or unequip. Equipment changes are atomic and never destroy the replaced item. Every visible stat must affect a real rule; do not display invented strength/dexterity values with no effect.

Then add a spatial 10 × 4 backpack with item footprints, compatible equipment destinations, pointer pickup/drop, keyboard equivalents, and cancel restoring the original location. Separate carried items from equipped items. A Haven stash retains overflow from legacy saves; never delete an old collection or silently sell a newly found item. Pack-full ground loot remains claimable. Migration must preserve every unique item ID and reject overlapping placements. Initially retain the three functioning equipment categories; expand to head, body, hands, feet, belt, amulet, two rings and weapon/offhand only alongside real loot and stat rules. Bow occupies both hands. Relic maps to amulet on migration.

Desktop layout: character sheet on the left, paper doll/backpack on the right, world visible behind; panel pauses the single-player world and says so. Bottom HUD: red health globe, blue mana globe, separate labelled stamina and arrow counters, selected attack/spell, healing belt, inventory and quest buttons. Never hide stamina or arrows inside mana. Show numbers, costs and disabled-action reasons; tooltips also open on focus/tap. Escape closes the topmost surface and restores focus. On short screens use internally scrolling panels, not clipped controls.

## 2. Authoritative world simulation

Move gameplay out of renderer timers and React intervals into pure typed commands and a fixed-step simulation. Simulation owns hero/enemy positions, ranges, movement, cooldowns, statuses, interaction approach targets and attack events. Three.js draws snapshots and consumes effects; it cannot decide damage or give rewards. React owns panels and submits commands. Use a seeded source and simulation time, never wall time, for gameplay.

Enemy lifecycle: idle/patrol → alert → chase → wind-up → strike → recovery; return to home if beyond leash. Beasts close into melee, raiders pursue with longer reach, lookout fires telegraphed projectiles, guardian uses a clearly marked area attack. Implement the melee lifecycle first. Starting proposal: alert radius 7 units, leash 12, melee reach 1.7, wind-up 1.2 seconds, recovery 2 seconds. Movement respects the same terrain and obstacles as the hero. No attacks through walls or from the village. Living enemies separate rather than stacking perfectly.

Click an enemy to approach until the selected action is in range, then act once. Holding an attack may repeat only after explicit support for cooldown/input cancellation. Clicking ground cancels approach/queued attacks. A strike validates live target, zone, range, cooldown and resources at commitment; invalid clicks spend nothing. Movement during wind-up can avoid a blow. Attack commitment creates one defence event, never repeated damage from every frame. Defeated enemies cannot attack; rewards are claim-once. Cap catch-up steps after a stalled frame.

## 3. Resource-powered combat and maths

All classes can learn melee, ranged and spells; class gives starting preferences, not permanent curriculum lockout. Begin with small full reserves so the first encounter is immediately playable. Show the exact reward before choosing a question. No passive stamina/mana restoration while standing still; returning to Haven may safely refill all basic reserves, with no XP for refills.

| Channel        | Ordinary action                                      | Untimed preparation                                                                              | Starting balance hypothesis                                         |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Melee          | Spend stamina on a committed hit                     | Multiplication of three-digit by two-digit numbers or exact division of similar complexity       | 100 stamina, 20 per hit; correct preparation restores to 100        |
| Bow            | Spend one selected arrow on release                  | Standard arithmetic creates normal arrows; harder multi-step arithmetic creates elemental arrows | Normal quiver cap 20, refill +10; elemental cap 10 each, refill +3  |
| Simple spell   | Spend mana to cast without a question                | Geometry with labelled diagram and text equivalent refills mana                                  | 100 mana, basic bolt costs 20; correct preparation restores to 100  |
| Powerful spell | Requires enough mana and an additional hard question | Mixed fractions, ratio, percentages, arithmetic or geometry; no timer                            | 40 mana and correct ritual; damage/utility stronger than basic bolt |
| Defence        | One quick question for one incoming hit              | Comparisons or multiplication/division within 12 × 12                                            | Correct blocks; wrong/expiry takes armour-mitigated damage          |

Arithmetic must have constructed exact answers: e.g. 324 × 27 = 8,748, or 8,748 ÷ 27 = 324. Explorer scaffolds the same operation; Adventurer uses three-by-two digits; Pathfinder adds a meaningful second step. Hints include decomposition and long-division working. Ordinary recharge mistakes allow retry and never damage health. Answered/hinted attempts still enter the learning report, but no XP/loot can be farmed by repeatedly recharging.

Geometry examples: rectangle perimeter/area with units; missing side from known area; composite area for stretch. Diagram labels and question wording agree. Distinguish cm from cm². Do not rely on drawing scale. More powerful spells mix subject areas so a spell quest cannot lock progress behind a single repeated template.

Fire arrows apply bounded damage over simulation time; frost arrows freeze movement and attack clocks for 2 seconds, with a short resistance interval to prevent permanent stunlock. Boss freeze duration starts at 1 second and is displayed. Status durations never elapse during thinking. Elemental ammunition is separately counted and explicitly selected; no silent conversion of normal arrows. Resolve damage-over-time deaths through the same reward path as direct hits.

A powerful spell checks mana before opening maths, locks its target/context, then rechecks and spends mana only on correct committed cast. Cancel/invalid target costs nothing; wrong answers permit retry. An encounter ID can resolve once only. No correct-answer callback may duplicate damage, ammunition or rewards.

## 4. Pause and defence contract

Only defence maths is timed. Standard mode offers generous 10/8/6-second windows by difficulty; these values require child playtesting. Questions are quick facts or clear comparisons, not close fraction/percentage conversions from the old implementation. A player-selected untimed assisted-defence option remains available and is recorded as assisted evidence.

Long maths freezes everything gameplay-related: enemies, hero movement, projectiles, wind-ups, damage-over-time, cooldowns, status durations and resource use. Menus, inventory, dialogue and hidden tabs also pause. Defence opens at a committed incoming strike and freezes the world while its separate response clock runs. Wrong answer or timeout resolves the one hit and resumes; correct blocks it. Closing a standard defence prompt resolves as a failed defence, so Escape cannot erase an incoming strike. Hidden tabs suspend the response clock. Hints explicitly enter assisted mode and stop the response clock. On resume use no accumulated wall-clock delta; pending simultaneous strikes are serialized with a short grace period, not delivered as a burst.

Damage preview shows incoming damage, armour absorbed and final health cost. Retain forgiving rescue to Haven with items and progress intact. Record blocked, wrong, expired and assisted outcomes separately. Accessibility choices never reduce exploration rewards.

## 5. World objects and villagers

Shared interaction contract: stable ID, kind, position, radius, availability, hover label, approach target, command and persistent state. Click once to walk into range and interact; keyboard focus/action must offer the same result. Do not open remote chests or village dialogue by clicking through terrain. Labels and distinct silhouettes identify interactive objects.

Chest: closed → opened, deterministic contents, persistent claim-once pickup. Opening requires no maths unless clearly marked as a puzzle chest. Full pack retains loot in the chest/ground. Altar: inspect purpose → choose recharge/blessing → relevant untimed maths → visible effect; blessings have explicit duration and cannot stack indefinitely. Village well restores basic reserves. Decorative scenery has no interaction cursor. Interaction cancels on leaving range, zone change or target removal.

NPC: overhead ! for available quest, muted marker for active incomplete quest, ? for ready turn-in. Click-to-approach opens short dialogue with explicit choices, objective, reward and accept/decline/turn-in controls. Markers derive from quest state. Shops/forge/stash should be real services when exposed, not dead buttons.

## 6. First authored quest sequence

1. Mira: **The Broken Compass** introduces the trail and asks the hero to recover a fragment. Accept explicitly; journal tracks objectives.
2. Trail chest rewards a short detour and teaches inspect/equip. A prowler teaches movement, ordinary attacks and the first stamina/arrow recharge.
3. Keeper Ivo: **A Door Without a Key** lends a basic spell focus to any class. Learn geometry mana refill, then use a powerful unbinding spell on the sealed ruin door. Door checks a spell-tagged event, so weapon damage cannot satisfy it. Focus and training remain available if previously declined; no gold or random drop gate.
4. Beyond the door: altar, raider/lookout encounter, optional frost-arrow tactical route, guardian fragment.
5. Return to Mira (? marker), explicit turn-in, one reward, journal completion. Next expedition resets only repeatable encounter/object IDs; story unlocks and inventory persist.

Track quest states available → accepted → objective-complete → rewarded, with named objective counters and event-derived progress. Avoid boolean soup or inferring acceptance from kills. Define migration for the legacy auto-active quest: preserve kills/reward, map to accepted/complete/rewarded without giving rewards twice.

## 7. Merchant, maths purchases and rarity (owner addition)

Owner addition during implementation: buying equipment and cosmetic items by solving maths; white → blue → gold rarity, later green sets with synergy. More epic items require more complex maths; gold requires a very tricky, long task. Add an NPC who buys and sells items. This direction is recorded now; merchant implementation is a later increment.

**Merchant Nia, Haven's quartermaster**, offers Buy / Sell / Cosmetics / Leave dialogue choices. Preview real item art, slot, full stat changes, rarity label, maths challenge tier and any gold cost before committing. Purchases require the displayed maths; baseline training gear and introductory cosmetics have maths-only offers so an empty wallet never prevents learning. Advanced offers may also cost earned gold (initial balance proposal), providing a use for combat rewards and sale proceeds. The owner-mandated part is maths-based purchasing; precise gold prices remain balance hypotheses.

| Tier                | Identity                                                 | Purchase challenge                                                                                 | Reward design                                                            |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| White / common      | Useful standard equipment and simple cosmetic variants   | One substantial untimed operation matched to the selected difficulty                               | Reliable starter/sidegrade, accessible first purchase                    |
| Blue / enchanted    | One meaningful bonus or more elaborate cosmetic          | Untimed multi-step task combining two operations or applying geometry/percentages                  | Clear benefit or tradeoff, never an unexplained stat inflation           |
| Gold / epic         | Distinctive high-value equipment or prestigious cosmetic | Long, especially tricky untimed multi-stage problem, with a working area and stepwise explanations | A memorable earned item; show the complete challenge and reward up front |
| Green / set (later) | Named collection with visible piece count                | Later reviewed challenge design                                                                    | Explicit two/three-piece synergies, calculated by the same stats engine  |

Rarity complexity is separate from manual difficulty: gold remains a long reasoning challenge in every band, with scaffolding and appropriately bounded operands. Do not make gold a timed task or merely inflate digits. Example gold structure: determine a fraction of expedition supplies, calculate a discounted cost, then justify a final allocation; prompts must contain enough information and use exact independently reviewed answers. Hints and retries are permitted; assisted learning is recorded honestly without removing the promised item. Cosmetics never increase combat stats.

Select offer → review item/challenge → begin paused maths → solve → commit one purchase. Snapshot an offer ID/revision, reward, price and challenge. Recheck funds and storage capacity at commit; spend gold and grant the item atomically once. If the pack is full, deliver to available Haven stash space or retain a claimable merchant parcel; never charge for a lost item. Cancel or a wrong answer charges nothing. A reload may restart uncompleted maths but cannot duplicate a completed reward. Multi-stage gold progress/resume must retain hints and attempts if persisted, not reset them into independent success.

Sell: choose an owned unequipped item, inspect the gold quote, explicitly sell; item removal and gold credit are one transition. Equipped/favourite items require unequipping/unmarking first. Retain a small buyback list at the original sale price until leaving Haven, shown before selling. Never auto-sell pack overflow. Sale value is below purchase gold price, with no profitable buy/sell loop; maths-only purchases are one-time offers or have zero resale value. Cosmetics are permanent unlocks, not repeatedly resellable inventory objects. Stock uses deterministic IDs, finite per-expedition quantities and clear refresh rules; no paid currencies or paid services.

Migration maps current common → white, uncommon/rare → blue, legendary → gold while preserving IDs, stats and ownership. Existing artwork/colours remain transitional until merchant/rarity work lands. No green items or synergy bonuses are shown as working before their rules exist.

## Verification and delivery

Unit tests independently check arithmetic, action spending, duplicate resolution, AI transitions, pause invariants, status expiry, inventory conservation and save migration. Real-browser checks cover keyboard/pointer, short laptop viewport, an entire expedition, mistakes/hints, timed defence, recharge mid-threat, equip/unequip, object claims, dialogue and reload. Independent maths reviewer derives answers from displayed prompts; critical playtest records friction and hypotheses, never claims a real child trial. Publish only after release gates on the authorised Firebase project.

# Task repository (world puzzles)

Status: implemented 28 September 2026. Source: `src/game/taskBank.ts`. Tests: `tests/taskBank.test.ts`. Used by the level objects in `src/game/level.ts` (see [LEVEL_DESIGN.md](LEVEL_DESIGN.md)).

## Why a repository instead of a generator

Combat questions are generated (`math.ts`, `actionMath.ts`). World puzzles are different: each one belongs to a place in the story (a winch, a corsair lock, a rune seal) and should read like it. Authored tasks can:

- use the fiction ("The bridge has 23 planks. Each plank needs 16 nails…") so the maths explains why the bridge comes down;
- be multi-step in a controlled way (fraction of a remainder, percentage of what is left) without a generator producing awkward or ambiguous prompts;
- be reviewed line by line by a person, and tested against an independent oracle.

The trade-off is volume. There are 63 tasks, rotated by expedition, so players meet repeats after three expeditions per pool and band. Expanding the bank is cheap: see "Adding tasks" below.

## Shape

```ts
type BankTask = {
  id: string; // `${pool}:${band}:${n}`, assigned automatically
  pool: TaskPoolId; // which world object uses it
  band: Difficulty; // explorer | adventurer | pathfinder (player setting)
  topic: Topic; // for the learning journal
  prompt: string; // exactly what the player reads
  answer: number; // positive integer
  unit?: string; // shown next to the input (cm, cm², m, mm)
  hint: string; // a method, never the answer
  explanation: string; // worked solution shown after success and in "Review last rune"
  oracle: string; // independent arithmetic restatement, e.g. '(108-108/9*2)/2'
};
```

`drawTask(pool, band, seed, expedition)` picks `(hash(seed:pool) + expedition − 1) mod 3`. The same task stays in place for retries within an expedition, and each new expedition moves to the next variant. `taskQuestion(task, tier, context)` wraps it as an untimed `ActionQuestion` with an ID unique to the hero, seed and expedition, so the journal counts each encounter once.

## Pools

| Pool            | World object                  | Skill                                    | Explorer                    | Adventurer                            | Pathfinder                                 |
| --------------- | ----------------------------- | ---------------------------------------- | --------------------------- | ------------------------------------- | ------------------------------------------ |
| `bridge-winch`  | Bridge Winch (Fern Hollow)    | Multiplication in measures               | 1-digit × 2-digit           | 2-digit × 2-digit                     | 3-digit × 2-digit (owner's MATH-3a scale)  |
| `mossy-cache`   | Moss-Lock Cache (Grotto)      | Fractions of an amount                   | unit → non-unit fraction    | complement ("the rest")               | fraction of a fraction / two fractions     |
| `stockade-lock` | Corsair Code Lock (Ford)      | Percentages of an amount                 | 10%, 25%, 50%               | 20%, 30%, 75%                         | 35%, successive percentages, % decrease    |
| `seal-shapes`   | Seal of Shapes (Antechamber)  | Area, perimeter, missing sides           | area / perimeter / square   | missing side, L-shape, double lap     | perimeter → area, notch, square root → row |
| `seal-parts`    | Seal of Parts (Antechamber)   | Combining and comparing fraction amounts | two unit fractions, compare | twelfths, close comparison, chained   | chained, three-part remainder, difference  |
| `seal-sharing`  | Seal of Sharing (Antechamber) | Division, including two-step sharing     | 3-digit ÷ 1-digit           | 3–4-digit ÷ 2-digit                   | 4-digit ÷ 2-digit, two-step sharing        |
| `sunken-cache`  | Drowned Chest (Cove, ritual)  | Long multi-step mixed reasoning          | three-step chains           | percentage + division, perimeter laps | four-stage mixed chains                    |

The three seals deliberately use three different topics. Opening the sanctum takes geometry, fractions and division, so progress can't be gated on a single repeated template (ENGINE_REWORK §3 intent for powerful spells).

## Authoring rules

1. **One clear question.** The last sentence asks for exactly one number. Units are named in the prompt and set in `unit`.
2. **Whole-number answers.** Every intermediate step used in the explanation is a whole number, except where the explanation deliberately shows a half (none currently do).
3. **Enough information, nothing ambiguous.** "The rest", "of the lit slices", "what is left" must refer to one quantity only.
4. **Hints teach a method** (split into tens and ones, find one part first, build 35% from 25% + 10%). They never state the answer.
5. **Explanations show every step** and end on the answer. Thousands use commas in text (`2,852`); the answer box accepts `2852` or `2,852`.
6. **No timers.** World puzzles are untimed and pause the world. Mistakes cost nothing.
7. **Distinguish cm from cm².** Area answers use `cm²`; perimeters and sides use `cm`.
8. **Band ≠ rarity.** A band follows the player's difficulty setting. Ritual objects (Seal of Sharing, Drowned Chest) are longer in every band.

## Automated checks

`tests/taskBank.test.ts` enforces:

- 7 pools × 3 bands × 3 variants, with unique IDs and unique prompts;
- every `oracle` expression, evaluated by an exact BigInt-rational parser that shares no code with the game, equals the authored `answer` and is a whole number;
- explanations contain the answer, and prompts never contain it;
- area questions use `cm²`;
- pathfinder bridge tasks really are 3-digit × 2-digit;
- variants rotate across expeditions and stay stable within one;
- questions are untimed and accept `2,852`-style input but reject malformed separators;
- every pool is used by a level object, and every level puzzle names a real pool.

The browser journey solves world puzzles by matching the rendered prompt to the bank. This is the one place e2e uses game data for answers. It is justified because the bank itself is oracle-tested above.

## Maths review record

28 September 2026: the author re-derived all 63 answers by hand while writing them, and the automated oracle confirmed every one. One explanation was changed (20% of 185) to avoid an unnecessary decimal step (18.5 × 2); it now uses "one fifth". **This is not an independent human review.** Per AGENTS.md and TEAM_WORKFLOW.md, an independent maths reviewer (human or separate agent) should still read every prompt for ambiguity and age-appropriate wording before owner acceptance. Items worth a second look:

- `seal-parts:explorer:3` (compare 3/8 and 1/3 of 24 by entering the larger number of slices): check that the wording is clear to a 9-year-old.
- `seal-shapes:pathfinder:3` requires recognising 144 = 12²: check that this is appropriate for the target 11+ syllabus.
- `sunken-cache:pathfinder:*` are intentionally long. Check reading load for the youngest players.

## Adding tasks

Append drafts to the relevant pool and band in `TASK_BANK`, including `oracle`. Run `npm test`. To add a pool, add it to `TaskPoolId` and `TASK_POOLS`, then reference it from a `LevelObject.task` in `level.ts`. The test that checks every pool is used will fail until you do. Keep three or more variants per band so replays rotate.

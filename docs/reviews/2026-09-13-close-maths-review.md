# Close maths review — 13 September 2026

Scope: independent review of the uncommitted action-question generator for the combat and equipment follow-up. This review covers quick close comparisons and the tougher, untimed focus and ritual actions. It does not change generator behaviour.

## Method

The review tests derive each result from the text presented to a player. Quick prompts are parsed as exact rationals and compared with `BigInt` cross-products; percentage prompts are treated as an exact denominator of 100. The checks do not use `operands` to establish answers or gaps.

For 1,000 deterministic seeds per difficulty, non-equal quick comparisons have unlike displayed denominators and the following exact maximum gaps:

| Difficulty | Exact maximum gap |
| ---------- | ----------------- |
| Explorer   | 1/20              |
| Adventurer | 1/30              |
| Pathfinder | 1/50              |

Equality remains deliberate equivalence through a different representation. Each difficulty produces all three relation choices and both fraction-vs-fraction and fraction-vs-percentage formats over the seeded review. This rules out same-denominator comparisons and wide visual giveaways in the reviewed pool.

Focus questions are untimed and use two-digit multiplication, whole-number percentage calculations, or rectangle area/perimeter. Their minimum displayed work rises from Explorer (multipliers at least 12; percentage totals at least 120; rectangle dimensions at least 12 by 7) through Adventurer (16; 180; 18 by 12) to Pathfinder (22/24; 240; 26 by 16). Ritual divisions are also untimed; the reviewed bands rise from divisor/quotient 6/24 through 12/48 to 18/75, with exact multiplication checks of every displayed dividend, divisor and answer.

## Evidence and result

`npm test -- --run tests/actionMath.test.ts tests/actionMath.review.test.ts tests/actionMathCloseReview.test.ts` passed: 23 tests in 3 files.

No arithmetic, exact-comparison, timing, or difficulty-band blocker was found in the reviewed generator. The pre-existing independent review had stale assumptions from the old generator (12-second quick timer and smaller operand limits); it now asserts the current close and hard-action bands from displayed prompts.

This is a generator review, not a child comprehension study. Prompt wording, hint usefulness, and the optional quick-timer experience still require playtesting with the intended age group.

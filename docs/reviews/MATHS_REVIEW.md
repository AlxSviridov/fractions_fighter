# Independent maths review — 13 September 2026

Reviewed by a separate maths reviewer after the action-tier setter. Scope: `src/game/actionMath.ts`, its answer validator in `math.ts`, and action maths tests. This is a code and generated-question review, not teacher certification or a child playtest.

## Findings

- No arithmetic correctness blocker found. Quick comparisons use familiar rational amounts, three distinct choices including equality, and integer comparison. Equality remains valid even when the random non-equality branch happens to choose equal values. Same-denominator and percentage wording identify one answer unambiguously.
- Tier boundaries hold: quick questions have a suggested 12-second timer and only comparisons; focus questions use untimed multiplication, percentage quantities or rectangle calculations; ritual questions use untimed exact division. This review verifies metadata, not browser timer behaviour or pause safety.
- Difficulty bounds increase deliberately. Multiplication factors cap at 5/10/12; rectangle sides at 5/8/12; percentage totals at 100/200/400. Ritual divisors range 2–5/3–12/12–24 and quotients 12–30/24–80/40–180. Ritual difficulty is relative to the selected band; Explorer division is not universally hard. These are practice bands, not a complete 11+ curriculum.
- Non-blocking teaching improvement: percentage explanations currently use 1% followed by decimal multiplication, even for Explorer. For example, a half of 60 is easier to explain as 60 ÷ 2 than 0.6 × 50. Recommend matching the worked route to the familiar half/tenth/quarter hints, particularly for 50%, 10%, 25% and 75%.
- Division explanations provide valid place-value chunks and a multiplication check. They do not teach the long-division layout. Geometry uses correct area/perimeter units, but currently lacks a diagram.

## Independent checks and evidence

Existing tests cover 4,500 generated questions using integer hundredths, repeated addition and BigInt percentage oracles, plus determinism, equality choices, units and input rejection. Some expectations read operand metadata, so a displayed-prompt mismatch could otherwise pass.

Added `tests/actionMath.review.test.ts`: 2,700 additional generated questions parsed directly from displayed prompts, with independently derived answers and explicit per-difficulty bounds. It does not use question operand metadata or import the generator's arithmetic helpers. Comparisons use BigInt cross products, divisions check the inverse product, multiplication checks inverse division, percentage answers check an exact integer identity, and area counts rows.

Validation: `npm test -- tests/actionMath.test.ts tests/actionMath.review.test.ts` passed: 2 files, 14 tests, 7,200 seeded generation cases. The reviewer did not modify implementation. Integrator remains responsible for the complete check/build, rendered minigame behaviour, persistence and release evidence.

import { describe, expect, it } from 'vitest';
import { makeActionQuestion } from '../src/game/actionMath';
import type { Difficulty } from '../src/game/math';

type Rational = { numerator: bigint; denominator: bigint };

const CLOSE_GAP_DENOMINATORS: Record<Difficulty, bigint> = {
  explorer: 20n,
  adventurer: 30n,
  pathfinder: 50n,
};

const FOCUS_FLOORS: Record<
  Difficulty,
  { multiplication: [number, number]; percentageTotal: number; rectangle: [number, number] }
> = {
  explorer: { multiplication: [12, 12], percentageTotal: 120, rectangle: [12, 7] },
  adventurer: { multiplication: [16, 16], percentageTotal: 180, rectangle: [18, 12] },
  pathfinder: { multiplication: [22, 24], percentageTotal: 240, rectangle: [26, 16] },
};

const RITUAL_FLOORS: Record<Difficulty, { divisor: number; quotient: number; dividend: number }> = {
  explorer: { divisor: 6, quotient: 24, dividend: 144 },
  adventurer: { divisor: 12, quotient: 48, dividend: 576 },
  pathfinder: { divisor: 18, quotient: 75, dividend: 1350 },
};

function compare(left: Rational, right: Rational) {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference === 0n ? '=' : difference > 0n ? '>' : '<';
}

function parseQuickPrompt(prompt: string): [Rational, Rational] {
  const parsed = /^(\d+)\/(\d+) ◇ (\d+)(%|\/\d+)$/.exec(prompt);
  if (!parsed) throw new Error(`Unexpected quick prompt: ${prompt}`);
  const [, leftNumerator, leftDenominator, rightNumerator, suffix] = parsed;
  return [
    { numerator: BigInt(leftNumerator), denominator: BigInt(leftDenominator) },
    {
      numerator: BigInt(rightNumerator),
      denominator: suffix === '%' ? 100n : BigInt(suffix.slice(1)),
    },
  ];
}

// This review deliberately works from prompt text only. It does not read operands,
// answers, or the generator's comparison tables to establish the expected result.
describe('independent close-comparison and hard-action review', () => {
  for (const difficulty of ['explorer', 'adventurer', 'pathfinder'] as const) {
    it(`${difficulty} quick prompts have exact, nontrivial close gaps`, () => {
      const signs = new Set<string>();
      const formats = new Set<string>();
      for (let seed = 0; seed < 1_000; seed++) {
        const question = makeActionQuestion('quick', difficulty, seed, 'close-review');
        const [left, right] = parseQuickPrompt(question.prompt);
        const relation = compare(left, right);
        const gapNumerator =
          (left.numerator * right.denominator - right.numerator * left.denominator) ** 2n;
        const gapDenominator = (left.denominator * right.denominator) ** 2n;

        expect(question.answer).toBe(relation);
        expect(question.timeLimitMs).toBeGreaterThan(0);
        expect(left.denominator).not.toBe(right.denominator);
        if (relation !== '=') {
          // |left - right| <= 1 / band denominator, checked without floating point.
          expect(gapNumerator * CLOSE_GAP_DENOMINATORS[difficulty] ** 2n).toBeLessThanOrEqual(
            gapDenominator,
          );
        } else {
          expect(left.numerator).not.toBe(right.numerator);
        }
        signs.add(relation);
        formats.add(question.prompt.includes('%') ? 'percentage' : 'fraction');
      }
      expect(signs).toEqual(new Set(['<', '=', '>']));
      expect(formats).toEqual(new Set(['fraction', 'percentage']));
    });

    it(`${difficulty} focus and ritual prompts meet their harder bands`, () => {
      const focusFloors = FOCUS_FLOORS[difficulty];
      const ritualFloors = RITUAL_FLOORS[difficulty];
      const focusTopics = new Set<string>();
      for (let seed = 0; seed < 1_000; seed++) {
        const focus = makeActionQuestion('focus', difficulty, seed, 'hard-action-review');
        expect(focus.timeLimitMs).toBeNull();
        focusTopics.add(focus.topic);
        if (focus.topic === 'multiplication') {
          const match = /^(\d+) × (\d+) = \?$/.exec(focus.prompt);
          expect(match).not.toBeNull();
          const [, a, b] = match!;
          expect(Number(a)).toBeGreaterThanOrEqual(focusFloors.multiplication[0]);
          expect(Number(b)).toBeGreaterThanOrEqual(focusFloors.multiplication[1]);
          expect(Number(focus.answer)).toBe(Number(a) * Number(b));
        } else if (focus.topic === 'percentages') {
          const match = /^What is (\d+)% of (\d+)\?$/.exec(focus.prompt);
          expect(match).not.toBeNull();
          const [, percentage, total] = match!;
          expect(Number(total)).toBeGreaterThanOrEqual(focusFloors.percentageTotal);
          expect(BigInt(focus.answer) * 100n).toBe(BigInt(percentage) * BigInt(total));
        } else {
          const match =
            /^A rectangle is (\d+) cm long and (\d+) cm wide\. What is its (area|perimeter)\?$/.exec(
              focus.prompt,
            );
          expect(match).not.toBeNull();
          const [, length, width, requested] = match!;
          expect(Number(length)).toBeGreaterThanOrEqual(focusFloors.rectangle[0]);
          expect(Number(width)).toBeGreaterThanOrEqual(focusFloors.rectangle[1]);
          expect(Number(focus.answer)).toBe(
            requested === 'area'
              ? Number(length) * Number(width)
              : 2 * (Number(length) + Number(width)),
          );
        }

        const ritual = makeActionQuestion('ritual', difficulty, seed, 'hard-action-review');
        const division = /^(\d+) ÷ (\d+) = \?$/.exec(ritual.prompt);
        expect(division).not.toBeNull();
        const [, dividend, divisor] = division!;
        expect(ritual.timeLimitMs).toBeNull();
        expect(Number(divisor)).toBeGreaterThanOrEqual(ritualFloors.divisor);
        expect(Number(ritual.answer)).toBeGreaterThanOrEqual(ritualFloors.quotient);
        expect(Number(dividend)).toBeGreaterThanOrEqual(ritualFloors.dividend);
        expect(Number(dividend)).toBe(Number(divisor) * Number(ritual.answer));
      }
      expect(focusTopics).toEqual(new Set(['multiplication', 'percentages', 'geometry']));
    });
  }
});

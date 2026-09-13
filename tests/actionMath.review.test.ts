import { describe, expect, it } from 'vitest';
import { makeActionQuestion } from '../src/game/actionMath';
import type { Difficulty } from '../src/game/math';

const bands: Record<
  Difficulty,
  {
    quickTimer: number;
    quickGapDenominator: bigint;
    factor: [number, number];
    side: [number, number];
    total: [number, number];
    divisor: [number, number];
    quotient: [number, number];
  }
> = {
  explorer: {
    quickTimer: 25_000,
    quickGapDenominator: 20n,
    factor: [12, 16],
    side: [7, 16],
    total: [120, 240],
    divisor: [6, 12],
    quotient: [24, 42],
  },
  adventurer: {
    quickTimer: 20_000,
    quickGapDenominator: 30n,
    factor: [16, 24],
    side: [12, 24],
    total: [180, 480],
    divisor: [12, 24],
    quotient: [48, 84],
  },
  pathfinder: {
    quickTimer: 15_000,
    quickGapDenominator: 50n,
    factor: [22, 32],
    side: [16, 35],
    total: [240, 720],
    divisor: [18, 36],
    quotient: [75, 144],
  },
};

// Independent review: expected values come from displayed prompt text, never q.operands.
describe('independent action maths review', () => {
  for (const difficulty of Object.keys(bands) as Difficulty[]) {
    it(`${difficulty}: displayed prompts agree with exact close and hard-action bands`, () => {
      const bounds = bands[difficulty];
      for (let seed = 0; seed < 300; seed++) {
        for (const tier of ['quick', 'focus', 'ritual'] as const) {
          const q = makeActionQuestion(tier, difficulty, seed, 'independent-review');
          if (tier === 'quick') {
            const match = /^(\d+)\/(\d+) ◇ (\d+)(%|\/\d+)$/.exec(q.prompt);
            expect(match).not.toBeNull();
            const [, n, d, r, suffix] = match!;
            const denominator = suffix === '%' ? 100n : BigInt(suffix.slice(1));
            const crossDifference = BigInt(n) * denominator - BigInt(r) * BigInt(d);
            expect(q.answer).toBe(crossDifference === 0n ? '=' : crossDifference > 0n ? '>' : '<');
            expect(BigInt(d)).not.toBe(denominator);
            if (crossDifference !== 0n) {
              expect(crossDifference ** 2n * bounds.quickGapDenominator ** 2n).toBeLessThanOrEqual(
                (BigInt(d) * denominator) ** 2n,
              );
            }
            expect(q.timeLimitMs).toBe(bounds.quickTimer);
          } else {
            expect(q.timeLimitMs).toBeNull();
            if (tier === 'ritual') {
              const match = /^(\d+) ÷ (\d+) = \?$/.exec(q.prompt);
              expect(match).not.toBeNull();
              const [, dividend, divisor] = match!;
              const quotient = Number(q.answer);
              expect(Number(divisor)).toBeGreaterThanOrEqual(bounds.divisor[0]);
              expect(Number(divisor)).toBeLessThanOrEqual(bounds.divisor[1]);
              expect(quotient).toBeGreaterThanOrEqual(bounds.quotient[0]);
              expect(quotient).toBeLessThanOrEqual(bounds.quotient[1]);
              expect(quotient * Number(divisor)).toBe(Number(dividend));
            } else if (q.topic === 'percentages') {
              const match = /^What is (\d+)% of (\d+)\?$/.exec(q.prompt);
              expect(match).not.toBeNull();
              const [, percentage, total] = match!;
              expect(BigInt(q.answer) * 100n).toBe(BigInt(percentage) * BigInt(total));
              expect(Number(total)).toBeGreaterThanOrEqual(bounds.total[0]);
              expect(Number(total)).toBeLessThanOrEqual(bounds.total[1]);
            } else if (q.topic === 'multiplication') {
              const match = /^(\d+) × (\d+) = \?$/.exec(q.prompt);
              expect(match).not.toBeNull();
              const a = Number(match![1]);
              const b = Number(match![2]);
              expect(a).toBeGreaterThanOrEqual(bounds.factor[0]);
              expect(b).toBeGreaterThanOrEqual(bounds.factor[0]);
              expect(a).toBeLessThanOrEqual(bounds.factor[1]);
              expect(b).toBeLessThanOrEqual(bounds.factor[1]);
              expect(Number(q.answer)).toBe(a * b);
            } else {
              const match =
                /^A rectangle is (\d+) cm long and (\d+) cm wide\. What is its (area|perimeter)\?$/.exec(
                  q.prompt,
                );
              expect(match).not.toBeNull();
              const length = Number(match![1]);
              const width = Number(match![2]);
              expect(length).toBeGreaterThanOrEqual(bounds.side[0]);
              expect(width).toBeGreaterThanOrEqual(bounds.side[0]);
              expect(length).toBeLessThanOrEqual(bounds.side[1]);
              expect(width).toBeLessThanOrEqual(bounds.side[1]);
              expect(Number(q.answer)).toBe(
                match![3] === 'area' ? length * width : length + width + length + width,
              );
              expect(q.unit).toBe(match![3] === 'area' ? 'cm²' : 'cm');
            }
          }
        }
      }
    });
  }
});

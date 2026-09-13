import { describe, expect, it } from 'vitest';
import { makeActionQuestion } from '../src/game/actionMath';
import type { Difficulty } from '../src/game/math';

// Independent review: derive answers from the displayed question, never its operand metadata.
describe('independent action maths review', () => {
  const bands: Record<
    Difficulty,
    { factor: number; side: number; total: number; divisor: number[]; quotient: number[] }
  > = {
    explorer: { factor: 5, side: 5, total: 100, divisor: [2, 5], quotient: [12, 30] },
    adventurer: { factor: 10, side: 8, total: 200, divisor: [3, 12], quotient: [24, 80] },
    pathfinder: { factor: 12, side: 12, total: 400, divisor: [12, 24], quotient: [40, 180] },
  };
  for (const difficulty of Object.keys(bands) as Difficulty[]) {
    it(`${difficulty}: displayed prompts agree with answers and specific operand limits`, () => {
      const bounds = bands[difficulty];
      for (let seed = 0; seed < 300; seed++) {
        for (const tier of ['quick', 'focus', 'ritual'] as const) {
          const q = makeActionQuestion(tier, difficulty, seed, 'independent-review');
          if (tier === 'quick') {
            const match = /^(\d+)\/(\d+) ◇ (\d+)(%|\/\d+)$/.exec(q.prompt)!;
            expect(match).not.toBeNull();
            const [, n, d, r, suffix] = match;
            const denominator = suffix === '%' ? 100n : BigInt(suffix.slice(1));
            const difference = BigInt(n) * denominator - BigInt(r) * BigInt(d);
            expect(q.answer).toBe(difference === 0n ? '=' : difference > 0n ? '>' : '<');
            expect(difficulty === 'explorer' ? [2, 4] : [2, 4, 5, 10]).toContain(Number(d));
            expect(q.timeLimitMs).toBe(12000);
          } else {
            expect(q.timeLimitMs).toBeNull();
            if (tier === 'ritual') {
              const match = /^(\d+) ÷ (\d+) = \?$/.exec(q.prompt)!;
              expect(match).not.toBeNull();
              const dividend = Number(match[1]);
              const divisor = Number(match[2]);
              const quotient = Number(q.answer);
              expect(divisor).toBeGreaterThanOrEqual(bounds.divisor[0]);
              expect(divisor).toBeLessThanOrEqual(bounds.divisor[1]);
              expect(quotient).toBeGreaterThanOrEqual(bounds.quotient[0]);
              expect(quotient).toBeLessThanOrEqual(bounds.quotient[1]);
              expect(quotient * divisor).toBe(dividend);
            } else if (q.topic === 'percentages') {
              const match = /^What is (\d+)% of (\d+)\?$/.exec(q.prompt)!;
              expect(match).not.toBeNull();
              expect(BigInt(q.answer) * 100n).toBe(BigInt(match[1]) * BigInt(match[2]));
              expect(Number(match[2])).toBeLessThanOrEqual(bounds.total);
              expect(difficulty === 'explorer' ? [10, 50] : [10, 20, 25, 50, 75]).toContain(
                Number(match[1]),
              );
            } else if (q.topic === 'multiplication') {
              const match = /^(\d+) × (\d+) = \?$/.exec(q.prompt)!;
              expect(match).not.toBeNull();
              const a = Number(match[1]);
              const b = Number(match[2]);
              expect(a).toBeLessThanOrEqual(bounds.factor);
              expect(b).toBeLessThanOrEqual(bounds.factor);
              expect(Number(q.answer) / a).toBe(b);
            } else {
              const match =
                /^A rectangle is (\d+) cm long and (\d+) cm wide\. What is its (area|perimeter)\?$/.exec(
                  q.prompt,
                )!;
              expect(match).not.toBeNull();
              const width = Number(match[1]);
              const height = Number(match[2]);
              expect(width).toBeLessThanOrEqual(bounds.side);
              expect(height).toBeLessThanOrEqual(bounds.side);
              expect(Number(q.answer)).toBe(
                match[3] === 'area'
                  ? Array.from({ length: height }, () => width).reduce((sum, row) => sum + row, 0)
                  : width + height + width + height,
              );
              expect(q.unit).toBe(match[3] === 'area' ? 'cm²' : 'cm');
            }
          }
        }
      }
    });
  }
});

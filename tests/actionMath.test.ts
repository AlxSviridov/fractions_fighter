import { describe, expect, it } from 'vitest';
import { isActionCorrect, makeActionQuestion } from '../src/game/actionMath';
import type { ActionTier } from '../src/game/actionMath';
import { DIFFICULTIES, TOPICS } from '../src/game/math';
import type { Difficulty } from '../src/game/math';

const QUICK_LIMITS: Record<Difficulty, { gap: number; time: number }> = {
  explorer: { gap: 0.1, time: 25000 },
  adventurer: { gap: 0.05, time: 20000 },
  pathfinder: { gap: 0.025, time: 15000 },
};
const RITUAL_BOUNDS: Record<Difficulty, { divisor: [number, number]; quotient: [number, number] }> =
  {
    explorer: { divisor: [6, 12], quotient: [24, 42] },
    adventurer: { divisor: [12, 24], quotient: [48, 84] },
    pathfinder: { divisor: [18, 36], quotient: [75, 144] },
  };

describe('action-tier maths', () => {
  for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
    for (const tier of ['quick', 'focus', 'ritual'] as ActionTier[]) {
      it(`${difficulty}/${tier}: 500 seeds satisfy exact arithmetic and action bounds`, () => {
        const answers = new Set<string>();
        const topics = new Set<string>();
        for (let seed = 0; seed < 500; seed++) {
          const q = makeActionQuestion(tier, difficulty, seed, 'encounter');
          const [a, b, c, d] = q.operands;
          let expected: string;
          if (tier === 'quick') {
            const left = BigInt(a) * BigInt(d);
            const right = BigInt(c) * BigInt(b);
            expected = left === right ? '=' : left > right ? '>' : '<';
            expect(Math.abs(a / b - c / d)).toBeLessThanOrEqual(QUICK_LIMITS[difficulty].gap);
            expect(a).toBeGreaterThan(0);
            expect(a).toBeLessThan(b);
            expect(c).toBeGreaterThan(0);
            expect(c).toBeLessThan(d);
            expect(q.choices).toEqual(['<', '=', '>']);
            expect(q.timeLimitMs).toBe(QUICK_LIMITS[difficulty].time);
            expect(q.prompt).toMatch(/^\d+\/\d+ ◇ \d+(?:%|\/\d+)$/);
            expect(q.prompt.includes('%') || b !== d).toBe(true);
            for (const choice of q.choices!)
              expect(isActionCorrect(q, choice)).toBe(choice === expected);
          } else {
            expect(q.timeLimitMs).toBeNull();
            expect(q.choices).toBeUndefined();
            if (q.topic === 'division') {
              expected = String(a / b);
              const bounds = RITUAL_BOUNDS[difficulty];
              expect(a % b).toBe(0);
              expect(b).toBeGreaterThanOrEqual(bounds.divisor[0]);
              expect(b).toBeLessThanOrEqual(bounds.divisor[1]);
              expect(Number(expected)).toBeGreaterThanOrEqual(bounds.quotient[0]);
              expect(Number(expected)).toBeLessThanOrEqual(bounds.quotient[1]);
              expect(tier).toBe('ritual');
            } else if (q.topic === 'multiplication') {
              expected = String(Array.from({ length: a }, () => b).reduce((sum, n) => sum + n, 0));
              expect(a).toBeGreaterThanOrEqual(10);
              expect(b).toBeGreaterThanOrEqual(10);
            } else if (q.topic === 'percentages') {
              const hundredths = BigInt(a) * BigInt(b);
              expect(hundredths % 100n).toBe(0n);
              expected = String(hundredths / 100n);
              expect(b).toBeGreaterThanOrEqual(120);
            } else {
              expect(q.topic).toBe('geometry');
              expected = String(c === 1 ? a * b : a + b + a + b);
              expect(q.unit).toBe(c === 1 ? 'cm²' : 'cm');
              expect(a).toBeGreaterThanOrEqual(10);
              expect(b).toBeGreaterThanOrEqual(7);
            }
          }
          expect(q.answer).toBe(expected);
          expect(isActionCorrect(q, ` ${expected} `)).toBe(true);
          expect(isActionCorrect(q, 'nonsense')).toBe(false);
          expect(q.difficulty).toBe(difficulty);
          expect(q.tier).toBe(tier);
          expect(q.topic in TOPICS).toBe(true);
          expect(q.hint.length).toBeGreaterThan(20);
          expect(q.explanation.length).toBeGreaterThan(10);
          expect(q).toEqual(makeActionQuestion(tier, difficulty, seed, 'encounter'));
          answers.add(q.answer);
          topics.add(q.topic);
        }
        if (tier === 'quick') expect(answers).toEqual(new Set(['<', '=', '>']));
        if (tier === 'focus')
          expect(topics).toEqual(new Set(['multiplication', 'percentages', 'geometry']));
      });
    }
  }

  it('balances quick signs and fraction/percentage representations', () => {
    for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
      const signs = new Set<string>();
      const representations = new Set<string>();
      for (let seed = 0; seed < 500; seed++) {
        const q = makeActionQuestion('quick', difficulty, seed, 'balance');
        signs.add(q.answer);
        representations.add(q.prompt.includes('%') ? 'percentage' : 'fraction');
      }
      expect(signs).toEqual(new Set(['<', '=', '>']));
      expect(representations).toEqual(new Set(['fraction', 'percentage']));
    }
  });

  it('includes 16 × 22 among untimed adventurer focus calculations', () => {
    const prompts = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const q = makeActionQuestion('focus', 'adventurer', seed, 'two-digit');
      if (q.topic === 'multiplication') prompts.add(q.prompt);
    }
    expect(prompts).toContain('16 × 22 = ?');
  });

  it('versioned identities distinguish action tiers, difficulty and encounter keys', () => {
    const q = makeActionQuestion('quick', 'explorer', 42, 'first');
    expect(q.id).toMatch(/^action-v2:/);
    expect(q.id).not.toBe(makeActionQuestion('focus', 'explorer', 42, 'first').id);
    expect(q.id).not.toBe(makeActionQuestion('quick', 'adventurer', 42, 'first').id);
    expect(q.id).not.toBe(makeActionQuestion('quick', 'explorer', 42, 'second').id);
  });

  it('teaches focus percentages with exact whole-number routes', () => {
    const covered = new Set<number>();
    for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
      for (let seed = 0; seed < 500; seed++) {
        const q = makeActionQuestion('focus', difficulty, seed, 'teaching');
        if (q.topic !== 'percentages') continue;
        covered.add(q.operands[0]);
        expect(q.explanation).not.toMatch(/\d+\.\d+/);
        expect(q.explanation.endsWith(`= ${q.answer}.`)).toBe(true);
      }
    }
    expect(covered).toEqual(new Set([10, 15, 20, 25, 35, 40, 50, 75]));
  });

  it('rejects malformed numerical input without loose parsing', () => {
    const q = makeActionQuestion('ritual', 'pathfinder', 12, 'input');
    for (const value of ['', `${q.answer}cats`, `${q.answer}e0`, 'Infinity', 'NaN'])
      expect(isActionCorrect(q, value)).toBe(false);
    expect(isActionCorrect(q, `${q.answer}.0`)).toBe(true);
  });
});

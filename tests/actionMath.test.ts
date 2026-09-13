import { describe, expect, it } from 'vitest';
import { isActionCorrect, makeActionQuestion } from '../src/game/actionMath';
import type { ActionTier } from '../src/game/actionMath';
import { DIFFICULTIES, TOPICS } from '../src/game/math';
import type { Difficulty } from '../src/game/math';

describe('action-tier maths', () => {
  for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
    for (const tier of ['quick', 'focus', 'ritual'] as ActionTier[]) {
      it(`${difficulty}/${tier}: 500 seeds satisfy independent arithmetic and action bounds`, () => {
        const answers = new Set<string>();
        const topics = new Set<string>();
        for (let seed = 0; seed < 500; seed++) {
          const q = makeActionQuestion(tier, difficulty, seed, 'encounter');
          const [a, b, c, d] = q.operands;
          let expected: string;
          if (tier === 'quick') {
            // All denominators divide 100: independently compare integer hundredths.
            expect(100 % b).toBe(0);
            expect(100 % d).toBe(0);
            const left = a * (100 / b);
            const right = c * (100 / d);
            expected = left === right ? '=' : left > right ? '>' : '<';
            expect(b).toBeLessThanOrEqual(10);
            expect(a).toBeLessThan(b);
            expect(q.choices).toEqual(['<', '=', '>']);
            expect(q.timeLimitMs).toBe(12000);
            expect(q.prompt).toContain('◇');
            for (const choice of q.choices!)
              expect(isActionCorrect(q, choice)).toBe(choice === expected);
          } else {
            expect(q.timeLimitMs).toBeNull();
            expect(q.choices).toBeUndefined();
            if (q.topic === 'division') {
              expected = String(a / b);
              expect(a % b).toBe(0);
              expect(Number(expected)).toBeGreaterThanOrEqual(12);
              expect(tier).toBe('ritual');
            } else if (q.topic === 'multiplication') {
              expected = String(Array.from({ length: a }, () => b).reduce((sum, n) => sum + n, 0));
              expect(a).toBeLessThanOrEqual(12);
              expect(b).toBeLessThanOrEqual(12);
            } else if (q.topic === 'percentages') {
              const hundredths = BigInt(a) * BigInt(b);
              expect(hundredths % 100n).toBe(0n);
              expected = String(hundredths / 100n);
              expect(b).toBeLessThanOrEqual(400);
            } else {
              expect(q.topic).toBe('geometry');
              expected = String(c === 1 ? a * b : a + b + a + b);
              expect(q.unit).toBe(c === 1 ? 'cm²' : 'cm');
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

  it('versioned identities distinguish action tiers, difficulty and encounter keys', () => {
    const q = makeActionQuestion('quick', 'explorer', 42, 'first');
    expect(q.id).toMatch(/^action-v1:/);
    expect(q.id).not.toBe(makeActionQuestion('focus', 'explorer', 42, 'first').id);
    expect(q.id).not.toBe(makeActionQuestion('quick', 'adventurer', 42, 'first').id);
    expect(q.id).not.toBe(makeActionQuestion('quick', 'explorer', 42, 'second').id);
  });

  it('teaches focus percentages using familiar fractions and whole-number steps', () => {
    const covered = new Set<number>();
    for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
      for (let seed = 0; seed < 100; seed++) {
        const q = makeActionQuestion('focus', difficulty, seed, 'teaching');
        if (q.topic !== 'percentages') continue;
        covered.add(q.operands[0]);
        expect(q.explanation).not.toContain('1%');
        expect(q.explanation).not.toMatch(/\d+\.\d+/);
        expect(q.explanation).toMatch(/one (tenth|quarter|half)/);
        expect(q.hint).toMatch(/(tenth|quarter|half)/);
        expect(q.explanation.endsWith(`= ${q.answer}.`)).toBe(true);
        if (difficulty === 'explorer') expect(q.explanation.match(/÷/g)).toHaveLength(1);
      }
    }
    expect(covered).toEqual(new Set([10, 20, 25, 50, 75]));
  });

  it('rejects malformed numerical input without loose parsing', () => {
    const q = makeActionQuestion('ritual', 'pathfinder', 12, 'input');
    for (const value of ['', `${q.answer}cats`, `${q.answer}e0`, 'Infinity', 'NaN']) {
      expect(isActionCorrect(q, value)).toBe(false);
    }
    expect(isActionCorrect(q, `${q.answer}.0`)).toBe(true);
  });
});

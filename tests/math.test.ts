import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, isCorrect, makeQuestion, TOPICS } from '../src/game/math';
import type { Difficulty, Topic } from '../src/game/math';

describe('original maths generators', () => {
  for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[])
    for (const topic of Object.keys(TOPICS) as Topic[]) {
      it(`${difficulty} ${topic}: 500 seeded problems match independent arithmetic`, () => {
        for (let seed = 0; seed < 500; seed++) {
          const q = makeQuestion(topic, difficulty, seed, 'test'),
            [a, b, c] = q.operands;
          let expected: string;
          switch (topic) {
            case 'fractions': {
              expect(a / b).not.toBe(c / 100);
              expected = a / b > c / 100 ? `${a}/${b}` : `${c}%`;
              expect(new Set(q.choices).size).toBe(2);
              expect(q.choices).toContain(expected);
              break;
            }
            case 'multiplication':
              expected = String(Array.from({ length: a }, () => b).reduce((sum, n) => sum + n, 0));
              break;
            case 'division':
              expected = String(a / b);
              expect(a % b).toBe(0);
              break;
            case 'geometry':
              expected = String(c === 1 ? a * b : a + b + a + b);
              break;
            case 'percentages': {
              const hundredths = BigInt(a) * BigInt(b);
              expect(hundredths % 100n).toBe(0n);
              expected = String(hundredths / 100n);
              break;
            }
          }
          expect(Number.isFinite(Number(q.answer)) || !!q.choices).toBe(true);
          expect(q.answer).toBe(expected);
          expect(isCorrect(q, ` ${expected} `)).toBe(true);
          expect(q.explanation.length).toBeGreaterThan(10);
          expect(q).toEqual(makeQuestion(topic, difficulty, seed, 'test'));
        }
      });
    }
  it('rejects malformed numeric input rather than using parseFloat', () => {
    const q = makeQuestion('multiplication', 'adventurer', 12, 'input');
    for (const bad of [
      '',
      ' ',
      `${q.answer}cats`,
      `${q.answer}e0`,
      'Infinity',
      'NaN',
      `<script>${q.answer}</script>`,
      '0x10',
    ])
      expect(isCorrect(q, bad)).toBe(false);
    expect(isCorrect(q, `${q.answer}.0`)).toBe(true);
  });
  it('changes questions across keys, with both sides represented in fraction choices', () => {
    const questions = Array.from({ length: 100 }, (_, seed) =>
      makeQuestion('fractions', 'pathfinder', seed, 'different'),
    );
    expect(questions.some((q) => q.answer === q.choices![0])).toBe(true);
    expect(questions.some((q) => q.answer === q.choices![1])).toBe(true);
    expect(new Set(questions.map((q) => q.id)).size).toBe(100);
  });
});

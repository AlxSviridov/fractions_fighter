import { hash, isCorrect, random } from './math';
import type { Difficulty, Question, Topic } from './math';

export type ActionTier = 'quick' | 'focus' | 'ritual';
export type ActionQuestion = Question & {
  tier: ActionTier;
  /** Suggested falling-card duration only. The UI may disable it; never time focus or ritual. */
  timeLimitMs: number | null;
};

/** Pure, reproducible action questions. Difficulty never turns a quick action into long arithmetic. */
export function makeActionQuestion(
  tier: ActionTier,
  difficulty: Difficulty,
  seed: number,
  key: string,
): ActionQuestion {
  const rng = random(hash(`action-v1:${seed}:${key}:${tier}:${difficulty}`));
  const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const pick = <T>(values: readonly T[]): T => values[int(0, values.length - 1)];
  const band = ['explorer', 'adventurer', 'pathfinder'].indexOf(difficulty);
  const base = {
    id: `action-v1:${seed}:${key}:${tier}:${difficulty}`,
    tier,
    difficulty,
    timeLimitMs: tier === 'quick' ? 12000 : null,
  };

  if (tier === 'quick') {
    const denominator = pick(band === 0 ? [2, 4] : [2, 4, 5, 10]);
    const numerator = int(1, denominator - 1);
    const percentage = band > 0 && rng() < 0.6;
    const rightDenominator = percentage ? 100 : denominator;
    const equal = rng() < 1 / 3;
    const rightNumerator = equal
      ? (numerator * rightDenominator) / denominator
      : percentage
        ? pick(band === 1 ? [0, 25, 50, 75, 100] : [0, 10, 20, 25, 50, 75, 80, 90, 100])
        : int(0, denominator);
    const difference = numerator * rightDenominator - rightNumerator * denominator;
    const answer = difference < 0 ? '<' : difference > 0 ? '>' : '=';
    const left = `${numerator}/${denominator}`;
    const right = percentage ? `${rightNumerator}%` : `${rightNumerator}/${denominator}`;
    return {
      ...base,
      topic: 'fractions',
      prompt: `${left} ◇ ${right}`,
      choices: ['<', '=', '>'],
      answer,
      operands: [numerator, denominator, rightNumerator, rightDenominator],
      hint: percentage
        ? 'Think of familiar amounts: a half is 50%, a quarter is 25%, a fifth is 20%.'
        : 'Both fractions have the same size pieces. Compare how many pieces there are.',
      explanation: percentage
        ? `${left} is ${(numerator * 100) / denominator}%. So ${left} ${answer} ${right}.`
        : `The denominators match. Compare ${numerator} with ${rightNumerator}: ${left} ${answer} ${right}.`,
    };
  }

  if (tier === 'ritual') {
    const divisor = int([2, 3, 12][band], [5, 12, 24][band]);
    const quotient = int([12, 24, 40][band], [30, 80, 180][band]);
    const dividend = divisor * quotient;
    const chunks = [
      Math.floor(quotient / 100) * 100,
      Math.floor((quotient % 100) / 10) * 10,
      quotient % 10,
    ].filter(Boolean);
    return {
      ...base,
      topic: 'division',
      prompt: `${dividend} ÷ ${divisor} = ?`,
      answer: String(quotient),
      operands: [dividend, divisor],
      hint: `Take your time. Split ${dividend} into easy multiples of ${divisor}, then add the groups.`,
      explanation: `${chunks.map((chunk) => `${chunk * divisor} ÷ ${divisor} = ${chunk}`).join('; ')}. Add ${chunks.join(' + ')} = ${quotient}. Check: ${quotient} × ${divisor} = ${dividend}.`,
    };
  }

  const topic = pick<Topic>(['multiplication', 'percentages', 'geometry']);
  if (topic === 'multiplication') {
    const a = int(2, [5, 10, 12][band]);
    const b = int(2, [5, 10, 12][band]);
    return {
      ...base,
      topic,
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
      operands: [a, b],
      hint: `Think of ${a} groups of ${b}. Split the groups if that helps.`,
      explanation: `${a} × ${b} = ${a * b}. For example, ${a - 1} × ${b} + ${b} = ${(a - 1) * b} + ${b} = ${a * b}.`,
    };
  }
  if (topic === 'percentages') {
    const percentage = pick(band === 0 ? [10, 50] : [10, 20, 25, 50, 75]);
    const total = int(2, [5, 10, 20][band]) * 20;
    const strategies: Record<number, { hint: string; explanation: string }> = {
      10: {
        hint: '10% is one tenth. Divide the whole amount by 10.',
        explanation: `10% is one tenth: ${total} ÷ 10 = ${total / 10}.`,
      },
      20: {
        hint: '20% is two tenths. Find 10% first, then double it.',
        explanation: `10% is one tenth: ${total} ÷ 10 = ${total / 10}. Double it for 20%: ${total / 10} × 2 = ${total / 5}.`,
      },
      25: {
        hint: '25% is one quarter. Divide the whole amount by 4.',
        explanation: `25% is one quarter: ${total} ÷ 4 = ${total / 4}.`,
      },
      50: {
        hint: '50% is one half. Divide the whole amount by 2.',
        explanation: `50% is one half: ${total} ÷ 2 = ${total / 2}.`,
      },
      75: {
        hint: '75% is three quarters. Find one quarter, then multiply it by 3.',
        explanation: `25% is one quarter: ${total} ÷ 4 = ${total / 4}. Take three quarters for 75%: ${total / 4} × 3 = ${(total / 4) * 3}.`,
      },
    };
    return {
      ...base,
      topic,
      prompt: `What is ${percentage}% of ${total}?`,
      answer: String((percentage * total) / 100),
      operands: [percentage, total],
      ...strategies[percentage],
    };
  }
  const width = int(2, [5, 8, 12][band]);
  const height = int(2, [5, 8, 12][band]);
  const area = rng() < 0.5;
  return {
    ...base,
    topic: 'geometry',
    prompt: `A rectangle is ${width} cm long and ${height} cm wide. What is its ${area ? 'area' : 'perimeter'}?`,
    answer: String(area ? width * height : 2 * (width + height)),
    operands: [width, height, area ? 1 : 0],
    unit: area ? 'cm²' : 'cm',
    hint: area
      ? 'Count the squares inside: length × width.'
      : 'Walk around all four sides: length + width + length + width.',
    explanation: area
      ? `${width} × ${height} = ${width * height} cm².`
      : `${width} + ${height} + ${width} + ${height} = ${2 * (width + height)} cm.`,
  };
}

/** Existing answer validation already handles symbolic choices exactly. */
export const isActionCorrect = (question: ActionQuestion, input: string): boolean =>
  isCorrect(question, input);

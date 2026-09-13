import { hash, isCorrect, random } from './math';
import type { Difficulty, Question, Topic } from './math';

export type ActionTier = 'quick' | 'focus' | 'ritual';
export type ActionQuestion = Question & {
  tier: ActionTier;
  /** Suggested falling-card duration only. The UI may disable it; never time focus or ritual. */
  timeLimitMs: number | null;
};

type Fraction = readonly [numerator: number, denominator: number];
type QuickComparison = { fraction: Fraction; other: Fraction | number; relation: '<' | '=' | '>' };

/** The lower bands leave longer room to think; the timer remains optional in the UI. */
const QUICK_TIMES: Record<Difficulty, number> = {
  explorer: 25000,
  adventurer: 20000,
  pathfinder: 15000,
};

/* Non-equal pairs use unlike denominators and close exact values. Equality is only an
 * intentionally equivalent representation, never an accidental duplicate. */
const QUICK_COMPARISONS: Record<
  Difficulty,
  { fractions: readonly QuickComparison[]; percentages: readonly QuickComparison[] }
> = {
  explorer: {
    fractions: [
      { fraction: [2, 5], other: [3, 7], relation: '<' },
      { fraction: [3, 5], other: [4, 7], relation: '>' },
      { fraction: [1, 3], other: [2, 7], relation: '>' },
      { fraction: [1, 2], other: [2, 4], relation: '=' },
      { fraction: [2, 3], other: [4, 6], relation: '=' },
    ],
    percentages: [
      { fraction: [2, 5], other: 45, relation: '<' },
      { fraction: [3, 5], other: 55, relation: '>' },
      { fraction: [1, 4], other: 25, relation: '=' },
      { fraction: [1, 2], other: 50, relation: '=' },
    ],
  },
  adventurer: {
    fractions: [
      { fraction: [3, 7], other: [2, 5], relation: '>' },
      { fraction: [4, 7], other: [3, 5], relation: '<' },
      { fraction: [5, 8], other: [3, 5], relation: '>' },
      { fraction: [5, 9], other: [4, 7], relation: '<' },
      { fraction: [2, 3], other: [4, 6], relation: '=' },
      { fraction: [3, 5], other: [6, 10], relation: '=' },
    ],
    percentages: [
      { fraction: [3, 5], other: 62, relation: '<' },
      { fraction: [5, 8], other: 60, relation: '>' },
      { fraction: [2, 3], other: 65, relation: '>' },
      { fraction: [3, 4], other: 75, relation: '=' },
      { fraction: [1, 4], other: 25, relation: '=' },
    ],
  },
  pathfinder: {
    fractions: [
      { fraction: [4, 7], other: [5, 9], relation: '>' },
      { fraction: [5, 8], other: [7, 11], relation: '<' },
      { fraction: [5, 9], other: [6, 11], relation: '>' },
      { fraction: [7, 12], other: [3, 5], relation: '<' },
      { fraction: [3, 4], other: [9, 12], relation: '=' },
      { fraction: [5, 8], other: [10, 16], relation: '=' },
    ],
    percentages: [
      { fraction: [4, 7], other: 58, relation: '<' },
      { fraction: [5, 8], other: 61, relation: '>' },
      { fraction: [7, 12], other: 59, relation: '<' },
      { fraction: [7, 20], other: 35, relation: '=' },
      { fraction: [3, 4], other: 75, relation: '=' },
    ],
  },
};

const FOCUS_MULTIPLICATION: Record<Difficulty, readonly (readonly [number, number])[]> = {
  explorer: [
    [12, 14],
    [13, 16],
    [15, 12],
    [16, 15],
  ],
  adventurer: [
    [16, 22],
    [18, 24],
    [19, 16],
    [22, 18],
  ],
  pathfinder: [
    [22, 26],
    [24, 32],
    [28, 25],
    [31, 24],
  ],
};
const FOCUS_RECTANGLES: Record<Difficulty, readonly (readonly [number, number])[]> = {
  explorer: [
    [12, 8],
    [14, 9],
    [16, 7],
  ],
  adventurer: [
    [18, 12],
    [22, 15],
    [24, 18],
  ],
  pathfinder: [
    [26, 18],
    [32, 24],
    [35, 16],
  ],
};
const RITUAL_DIVISIONS: Record<Difficulty, readonly (readonly [number, number])[]> = {
  explorer: [
    [6, 24],
    [8, 36],
    [9, 42],
    [12, 35],
  ],
  adventurer: [
    [12, 48],
    [15, 64],
    [18, 72],
    [24, 84],
  ],
  pathfinder: [
    [18, 75],
    [24, 96],
    [27, 108],
    [32, 144],
    [36, 125],
  ],
};
const FOCUS_TOTALS: Record<Difficulty, readonly number[]> = {
  explorer: [120, 160, 200, 240],
  adventurer: [180, 240, 320, 360, 480],
  pathfinder: [240, 360, 480, 640, 720],
};
const FOCUS_PERCENTAGES: Record<Difficulty, readonly number[]> = {
  explorer: [10, 20, 25, 50],
  adventurer: [10, 20, 25, 50, 75],
  pathfinder: [15, 20, 25, 35, 40, 50, 75],
};

function percentageMethod(percentage: number, total: number) {
  const tenth = total / 10;
  const quarter = total / 4;
  const methods: Record<number, { hint: string; explanation: string }> = {
    10: {
      hint: '10% is one tenth. Divide the whole amount by 10.',
      explanation: `10% is one tenth: ${total} ÷ 10 = ${tenth}.`,
    },
    15: {
      hint: 'Find 10%, then add half of that amount for 5%.',
      explanation: `10% of ${total} is ${tenth}; 5% is half of that, ${tenth} ÷ 2 = ${tenth / 2}. Add them: ${tenth} + ${tenth / 2} = ${(percentage * total) / 100}.`,
    },
    20: {
      hint: '20% is two tenths. Find 10% first, then double it.',
      explanation: `10% is ${tenth}. Double it for 20%: ${tenth} × 2 = ${(percentage * total) / 100}.`,
    },
    25: {
      hint: '25% is one quarter. Divide the whole amount by 4.',
      explanation: `25% is one quarter: ${total} ÷ 4 = ${quarter}.`,
    },
    35: {
      hint: 'Build 35% from 25% and 10%.',
      explanation: `25% is one quarter: ${total} ÷ 4 = ${quarter}. 10% is ${tenth}. Add them: ${quarter} + ${tenth} = ${(percentage * total) / 100}.`,
    },
    40: {
      hint: '40% is four tenths. Find 10% first, then multiply by 4.',
      explanation: `10% is ${tenth}. Four tenths is ${tenth} × 4 = ${(percentage * total) / 100}.`,
    },
    50: {
      hint: '50% is one half. Divide the whole amount by 2.',
      explanation: `50% is one half: ${total} ÷ 2 = ${total / 2}.`,
    },
    75: {
      hint: '75% is three quarters. Find one quarter, then multiply it by 3.',
      explanation: `25% is one quarter: ${total} ÷ 4 = ${quarter}. Take three quarters: ${quarter} × 3 = ${(percentage * total) / 100}.`,
    },
  };
  return methods[percentage];
}

/** Pure, reproducible action questions. Quick comparisons are exact; larger work is untimed. */
export function makeActionQuestion(
  tier: ActionTier,
  difficulty: Difficulty,
  seed: number,
  key: string,
): ActionQuestion {
  const rng = random(hash(`action-v2:${seed}:${key}:${tier}:${difficulty}`));
  const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const pick = <T>(values: readonly T[]): T => values[int(0, values.length - 1)];
  const base = {
    id: `action-v2:${seed}:${key}:${tier}:${difficulty}`,
    tier,
    difficulty,
    timeLimitMs: tier === 'quick' ? QUICK_TIMES[difficulty] : null,
  };

  if (tier === 'quick') {
    const type = rng() < 0.5 ? 'fractions' : 'percentages';
    const desiredRelation = pick(['<', '=', '>'] as const);
    const comparison = pick(
      QUICK_COMPARISONS[difficulty][type].filter((item) => item.relation === desiredRelation),
    );
    const [numerator, denominator] = comparison.fraction;
    const percentage = typeof comparison.other === 'number';
    const [rightNumerator, rightDenominator] =
      typeof comparison.other === 'number' ? [comparison.other, 100] : comparison.other;
    const left = `${numerator}/${denominator}`;
    const right = percentage ? `${rightNumerator}%` : `${rightNumerator}/${rightDenominator}`;
    const leftCrossProduct = numerator * rightDenominator;
    const rightCrossProduct = rightNumerator * denominator;
    return {
      ...base,
      topic: 'fractions',
      prompt: `${left} ◇ ${right}`,
      choices: ['<', '=', '>'],
      answer: comparison.relation,
      operands: [numerator, denominator, rightNumerator, rightDenominator],
      hint: percentage
        ? `Treat ${right} as ${rightNumerator}/100, then compare by cross-multiplying.`
        : 'The pieces are different sizes. Compare by cross-multiplying rather than only counting pieces.',
      explanation: percentage
        ? `${right} is exactly ${rightNumerator}/100. Compare ${numerator} × 100 = ${leftCrossProduct} with ${rightNumerator} × ${denominator} = ${rightCrossProduct}. Therefore ${left} ${comparison.relation} ${right}.`
        : `Compare ${numerator} × ${rightDenominator} = ${leftCrossProduct} with ${rightNumerator} × ${denominator} = ${rightCrossProduct}. Therefore ${left} ${comparison.relation} ${right}.`,
    };
  }

  if (tier === 'ritual') {
    const [divisor, quotient] = pick(RITUAL_DIVISIONS[difficulty]);
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
    const [a, b] = pick(FOCUS_MULTIPLICATION[difficulty]);
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;
    return {
      ...base,
      topic,
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
      operands: [a, b],
      hint: `Split ${b} into ${tens} and ${ones}, then add the two products.`,
      explanation: `${a} × ${b} = (${a} × ${tens}) + (${a} × ${ones}) = ${a * tens} + ${a * ones} = ${a * b}.`,
    };
  }
  if (topic === 'percentages') {
    const percentage = pick(FOCUS_PERCENTAGES[difficulty]);
    const total = pick(
      FOCUS_TOTALS[difficulty].filter((value) => (percentage * value) % 100 === 0),
    );
    return {
      ...base,
      topic,
      prompt: `What is ${percentage}% of ${total}?`,
      answer: String((percentage * total) / 100),
      operands: [percentage, total],
      ...percentageMethod(percentage, total),
    };
  }
  const [width, height] = pick(FOCUS_RECTANGLES[difficulty]);
  const area = rng() < 0.5;
  return {
    ...base,
    topic: 'geometry',
    prompt: `A rectangle is ${width} cm long and ${height} cm wide. What is its ${area ? 'area' : 'perimeter'}?`,
    answer: String(area ? width * height : 2 * (width + height)),
    operands: [width, height, area ? 1 : 0],
    unit: area ? 'cm²' : 'cm',
    hint: area
      ? 'Find the rows of squares: length × width.'
      : 'Add one length and one width, then double that total for all four sides.',
    explanation: area
      ? `${width} × ${height} = ${width * height} cm².`
      : `(${width} + ${height}) × 2 = ${width + height} × 2 = ${2 * (width + height)} cm.`,
  };
}

/** Existing answer validation already handles symbolic choices exactly. */
export const isActionCorrect = (question: ActionQuestion, input: string): boolean =>
  isCorrect(question, input);

export type Difficulty = 'explorer' | 'adventurer' | 'pathfinder';
export type Topic = 'fractions' | 'multiplication' | 'percentages' | 'geometry' | 'division';
export const TOPICS: Record<Topic, string> = {
  fractions: 'Fractions & comparisons',
  multiplication: 'Multiplication',
  percentages: 'Percentages',
  geometry: 'Geometry',
  division: 'Division',
};
export const DIFFICULTIES: Record<Difficulty, { label: string; description: string }> = {
  explorer: { label: 'Explorer', description: 'Small numbers. Room to find your feet.' },
  adventurer: { label: 'Adventurer', description: 'Two-digit calculations and new connections.' },
  pathfinder: { label: 'Pathfinder', description: 'Larger numbers. Deeper thinking.' },
};
export type Question = {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  prompt: string;
  choices?: string[];
  answer: string;
  hint: string;
  explanation: string;
  operands: number[];
  unit?: string;
};
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function makeQuestion(
  topic: Topic,
  difficulty: Difficulty,
  seed: number,
  key: string,
): Question {
  const rng = random(hash(`${seed}:${key}:${topic}:${difficulty}`));
  const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const band = ['explorer', 'adventurer', 'pathfinder'].indexOf(difficulty);
  const base = { id: `v1:${seed}:${key}:${topic}:${difficulty}`, topic, difficulty };
  if (topic === 'fractions') {
    const denominators =
      band === 0 ? [2, 4, 5, 10] : band === 1 ? [3, 4, 5, 8, 10, 12] : [7, 9, 11, 12, 16];
    const d = denominators[int(0, denominators.length - 1)],
      n = int(1, d - 1);
    let p = int(1, 19) * 5;
    if (n * 100 === p * d) p = p === 95 ? 90 : p + 5;
    const options = [`${n}/${d}`, `${p}%`];
    if (rng() > 0.5) options.reverse();
    return {
      ...base,
      prompt: 'Which value is greater?',
      choices: options,
      answer: n * 100 > p * d ? `${n}/${d}` : `${p}%`,
      operands: [n, d, p],
      hint: 'A percentage is a fraction out of 100. Compare by cross-multiplying.',
      explanation: `${p}% = ${p}/100. Compare ${n} × 100 = ${n * 100} with ${p} × ${d} = ${p * d}. The larger product points to the larger fraction.`,
    };
  }
  if (topic === 'multiplication') {
    const a = int(band === 0 ? 2 : 12, band === 0 ? 12 : band === 1 ? 25 : 49);
    const b = int(band === 0 ? 2 : 11, band === 0 ? 10 : band === 1 ? 19 : 29);
    const tens = Math.floor(b / 10) * 10,
      ones = b % 10;
    return {
      ...base,
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
      operands: [a, b],
      hint: 'Split one number into tens and ones, then add the two products.',
      explanation: tens
        ? `${a} × ${b} = (${a} × ${tens}) + (${a} × ${ones}) = ${a * tens} + ${a * ones} = ${a * b}.`
        : `${a} groups of ${b} make ${a * b}. You can count in steps of ${b}.`,
    };
  }
  if (topic === 'percentages') {
    const p = (band === 0 ? [10, 50] : band === 1 ? [10, 20, 25, 50, 75] : [15, 35, 45, 65, 85])[
      int(0, band === 0 ? 1 : 4)
    ];
    const total = int(2, band === 0 ? 8 : band === 1 ? 20 : 60) * 20;
    return {
      ...base,
      prompt: `What is ${p}% of ${total}?`,
      answer: String((p * total) / 100),
      operands: [p, total],
      hint: 'Find 1% by dividing the whole amount by 100. Then multiply by the percentage.',
      explanation: `1% of ${total} is ${total / 100}. So ${p}% is ${total / 100} × ${p} = ${(p * total) / 100}.`,
    };
  }
  if (topic === 'geometry') {
    const w = int(3, band === 0 ? 8 : band === 1 ? 16 : 25),
      h = int(2, band === 0 ? 6 : band === 1 ? 12 : 19);
    const area = rng() > 0.5;
    return {
      ...base,
      prompt: `A rectangle is ${w} cm long and ${h} cm wide. What is its ${area ? 'area' : 'perimeter'}?`,
      answer: String(area ? w * h : 2 * (w + h)),
      unit: area ? 'cm²' : 'cm',
      operands: [w, h, area ? 1 : 0],
      hint: area
        ? 'Area counts the squares inside: length × width.'
        : 'Perimeter is the distance all the way around: add all four sides.',
      explanation: area
        ? `${w} × ${h} = ${w * h} cm².`
        : `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm.`,
    };
  }
  const divisor = int(band === 0 ? 2 : band === 1 ? 3 : 12, band === 0 ? 9 : band === 1 ? 12 : 24);
  const quotient = int(
    band === 0 ? 3 : band === 1 ? 12 : 25,
    band === 0 ? 12 : band === 1 ? 80 : 180,
  );
  const dividend = divisor * quotient;
  const hundreds = Math.floor(quotient / 100) * 100,
    tens = Math.floor((quotient % 100) / 10) * 10,
    ones = quotient % 10;
  const chunks = [hundreds, tens, ones].filter(Boolean);
  return {
    ...base,
    prompt: `${dividend} ÷ ${divisor} = ?`,
    answer: String(quotient),
    operands: [dividend, divisor],
    hint: `Break ${dividend} into easy multiples of ${divisor}. Add how many groups each part makes.`,
    explanation: `${chunks.map((c) => `${divisor * c} ÷ ${divisor} = ${c}`).join('; ')}. Add the groups: ${chunks.join(' + ')} = ${quotient}. Check: ${quotient} × ${divisor} = ${dividend}.`,
  };
}
export function isCorrect(question: Question, input: string): boolean {
  const clean = input.trim();
  if (question.choices) return clean === question.answer;
  return /^\d+(?:\.\d+)?$/.test(clean) && Number(clean) === Number(question.answer);
}

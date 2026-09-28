/**
 * Chapter I task repository.
 *
 * Every world puzzle (bridge winch, code lock, rune seals, puzzle chests) draws
 * from an authored pool here instead of a random generator, so each task can
 * be written for its place in the story, reviewed by a person and tested
 * against an independent oracle expression. All tasks are untimed.
 *
 * Pools × bands × variants: 7 × 3 × 3 = 63 tasks. Add new tasks by appending
 * to TASK_BANK; tests enforce coverage, unique IDs, integer answers and that
 * the oracle agrees with the authored answer. See docs/TASK_BANK.md.
 */
import { hash } from './math';
import type { Difficulty, Topic } from './math';
import type { ActionQuestion } from './actionMath';

export type TaskPoolId =
  | 'bridge-winch'
  | 'mossy-cache'
  | 'stockade-lock'
  | 'seal-shapes'
  | 'seal-parts'
  | 'seal-sharing'
  | 'sunken-cache';

export type BankTask = {
  id: string;
  pool: TaskPoolId;
  band: Difficulty;
  topic: Topic;
  prompt: string;
  answer: number;
  unit?: string;
  hint: string;
  explanation: string;
  /**
   * Independent arithmetic restatement using only + − × ÷ and brackets
   * (written as + - * /). Tests evaluate it with exact rationals.
   */
  oracle: string;
};

export const TASK_POOLS: Record<
  TaskPoolId,
  { title: string; skill: string; topic: Topic; steps: 'one' | 'two' | 'multi' }
> = {
  'bridge-winch': {
    title: 'Bridge Winch',
    skill: 'Multiplication in measures',
    topic: 'multiplication',
    steps: 'one',
  },
  'mossy-cache': {
    title: 'Moss-Lock Cache',
    skill: 'Fractions of an amount',
    topic: 'fractions',
    steps: 'two',
  },
  'stockade-lock': {
    title: 'Corsair Code Lock',
    skill: 'Percentages of an amount',
    topic: 'percentages',
    steps: 'two',
  },
  'seal-shapes': {
    title: 'Seal of Shapes',
    skill: 'Area, perimeter and missing sides',
    topic: 'geometry',
    steps: 'two',
  },
  'seal-parts': {
    title: 'Seal of Parts',
    skill: 'Combining and comparing fractions of amounts',
    topic: 'fractions',
    steps: 'two',
  },
  'seal-sharing': {
    title: 'Seal of Sharing',
    skill: 'Division, including two-step sharing',
    topic: 'division',
    steps: 'two',
  },
  'sunken-cache': {
    title: 'Drowned Chest',
    skill: 'Long multi-step mixed reasoning',
    topic: 'percentages',
    steps: 'multi',
  },
};

type Draft = Omit<BankTask, 'id' | 'pool' | 'band'>;
const pool = (id: TaskPoolId, bands: Record<Difficulty, Draft[]>): BankTask[] =>
  (Object.keys(bands) as Difficulty[]).flatMap((band) =>
    bands[band].map((task, i) => ({ ...task, id: `${id}:${band}:${i + 1}`, pool: id, band })),
  );

export const TASK_BANK: BankTask[] = [
  ...pool('bridge-winch', {
    explorer: [
      {
        topic: 'multiplication',
        prompt:
          'Each turn of the winch lowers the bridge 14 cm. It needs 6 full turns. How many centimetres does the bridge drop?',
        answer: 84,
        unit: 'cm',
        hint: '6 turns of 14 cm is 6 × 14. Try 6 × 10 and 6 × 4.',
        explanation: '6 × 14 = 6 × 10 + 6 × 4 = 60 + 24 = 84 cm.',
        oracle: '6*14',
      },
      {
        topic: 'multiplication',
        prompt:
          'The bridge has 8 planks. Each plank needs 12 nails. How many nails hold the bridge together?',
        answer: 96,
        hint: '8 groups of 12. Try 8 × 10, then add 8 × 2.',
        explanation: '8 × 12 = 80 + 16 = 96 nails.',
        oracle: '8*12',
      },
      {
        topic: 'multiplication',
        prompt:
          'The rope wraps 9 times round the winch drum. Each wrap uses 15 cm of rope. How much rope is on the drum?',
        answer: 135,
        unit: 'cm',
        hint: '9 × 15 is the same as 10 × 15 take away one 15.',
        explanation: '10 × 15 = 150, and 150 − 15 = 135 cm.',
        oracle: '9*15',
      },
    ],
    adventurer: [
      {
        topic: 'multiplication',
        prompt:
          'The bridge has 23 planks. Each plank needs 16 nails. How many nails do you need to fix the whole bridge?',
        answer: 368,
        hint: 'Split 23 into 20 and 3. Multiply each by 16, then add.',
        explanation: '20 × 16 = 320 and 3 × 16 = 48. 320 + 48 = 368 nails.',
        oracle: '23*16',
      },
      {
        topic: 'multiplication',
        prompt:
          'Each winch turn lowers the bridge 27 cm. You need 14 turns. How far does the bridge drop?',
        answer: 378,
        unit: 'cm',
        hint: 'Work out 10 × 27 and 4 × 27, then add them.',
        explanation: '10 × 27 = 270 and 4 × 27 = 108. 270 + 108 = 378 cm.',
        oracle: '14*27',
      },
      {
        topic: 'multiplication',
        prompt:
          'The bridge rope is made of 18 knotted lengths, each 45 cm long. How long is the whole rope?',
        answer: 810,
        unit: 'cm',
        hint: '18 × 45: try 18 × 40 and 18 × 5, or double 9 × 45.',
        explanation: '18 × 40 = 720 and 18 × 5 = 90. 720 + 90 = 810 cm.',
        oracle: '18*45',
      },
    ],
    pathfinder: [
      {
        topic: 'multiplication',
        prompt:
          'Each span of the bridge needs 124 cm of rope. The bridge has 23 spans. How many centimetres of rope are needed?',
        answer: 2852,
        unit: 'cm',
        hint: 'Split 23 into 20 and 3: 124 × 20 and 124 × 3.',
        explanation: '124 × 20 = 2,480 and 124 × 3 = 372. 2,480 + 372 = 2,852 cm.',
        oracle: '124*23',
      },
      {
        topic: 'multiplication',
        prompt:
          'Each winch turn lowers the bridge 136 mm. It takes 24 turns. How many millimetres does the bridge drop?',
        answer: 3264,
        unit: 'mm',
        hint: 'Work out 136 × 20 and 136 × 4, then add.',
        explanation: '136 × 20 = 2,720 and 136 × 4 = 544. 2,720 + 544 = 3,264 mm.',
        oracle: '136*24',
      },
      {
        topic: 'multiplication',
        prompt:
          'A crate holds 215 bridge nails. The corsairs hid 18 crates by the winch. How many nails did they hide?',
        answer: 3870,
        hint: '215 × 18 = 215 × 10 + 215 × 8.',
        explanation: '215 × 10 = 2,150 and 215 × 8 = 1,720. 2,150 + 1,720 = 3,870 nails.',
        oracle: '215*18',
      },
    ],
  }),
  ...pool('mossy-cache', {
    explorer: [
      {
        topic: 'fractions',
        prompt:
          'The lock has 24 moss stones. Three quarters of them must glow. How many stones must glow?',
        answer: 18,
        hint: 'Find one quarter first (divide by 4), then take three of them.',
        explanation: '24 ÷ 4 = 6, so one quarter is 6. Three quarters is 6 × 3 = 18 stones.',
        oracle: '24/4*3',
      },
      {
        topic: 'fractions',
        prompt: 'There are 30 moss stones. Two fifths of them are cracked. How many are cracked?',
        answer: 12,
        hint: 'One fifth of 30 is 30 ÷ 5. Two fifths is double that.',
        explanation: '30 ÷ 5 = 6. Two fifths is 6 × 2 = 12 stones.',
        oracle: '30/5*2',
      },
      {
        topic: 'fractions',
        prompt: 'The chest lid has 18 runes. Two thirds of them are lit. How many runes are lit?',
        answer: 12,
        hint: 'Find one third (divide by 3), then take two of them.',
        explanation: '18 ÷ 3 = 6. Two thirds is 6 × 2 = 12 runes.',
        oracle: '18/3*2',
      },
    ],
    adventurer: [
      {
        topic: 'fractions',
        prompt:
          'The lock has 56 stones. Three eighths are green and the rest are gold. How many stones are gold?',
        answer: 35,
        hint: 'If 3/8 are green, then 5/8 are gold. Find one eighth first.',
        explanation: '56 ÷ 8 = 7. Gold is 5/8, so 7 × 5 = 35 stones.',
        oracle: '56-56/8*3',
      },
      {
        topic: 'fractions',
        prompt: 'The cache holds 45 beads. Four ninths of them are jade. How many beads are jade?',
        answer: 20,
        hint: 'One ninth of 45 is 45 ÷ 9.',
        explanation: '45 ÷ 9 = 5. Four ninths is 5 × 4 = 20 beads.',
        oracle: '45/9*4',
      },
      {
        topic: 'fractions',
        prompt: 'There are 72 moss stones. Five sixths of them glow. How many do NOT glow?',
        answer: 12,
        hint: 'If 5/6 glow, only 1/6 does not.',
        explanation: 'The stones that do not glow are 1/6 of 72. 72 ÷ 6 = 12 stones.',
        oracle: '72-72/6*5',
      },
    ],
    pathfinder: [
      {
        topic: 'fractions',
        prompt:
          'The cache holds 96 gems. Five eighths are emeralds. A quarter of the emeralds are cracked. How many emeralds are NOT cracked?',
        answer: 45,
        hint: 'First find the emeralds (5/8 of 96). Then 3/4 of those are not cracked.',
        explanation:
          '96 ÷ 8 = 12, so there are 12 × 5 = 60 emeralds. A quarter is 15, so 60 − 15 = 45 are not cracked.',
        oracle: '96/8*5-96/8*5/4',
      },
      {
        topic: 'fractions',
        prompt:
          'The lock has 84 stones. Three sevenths glow green and one quarter glow gold. How many stones do not glow at all?',
        answer: 27,
        hint: 'Work out 3/7 of 84 and 1/4 of 84 separately. Subtract both from 84.',
        explanation: '3/7 of 84 = 12 × 3 = 36. 1/4 of 84 = 21. 84 − 36 − 21 = 27 stones.',
        oracle: '84-84/7*3-84/4',
      },
      {
        topic: 'fractions',
        prompt:
          'There are 108 runes. Two ninths are broken. Half of the unbroken runes are lit. How many runes are lit?',
        answer: 42,
        hint: 'Find the broken runes, take them away, then halve what is left.',
        explanation: '108 ÷ 9 = 12, so 24 are broken. 108 − 24 = 84 unbroken. Half of 84 is 42.',
        oracle: '(108-108/9*2)/2',
      },
    ],
  }),
  ...pool('stockade-lock', {
    explorer: [
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 50% of 86.” What is the code?',
        answer: 43,
        hint: '50% means one half.',
        explanation: '50% is a half. 86 ÷ 2 = 43.',
        oracle: '86*50/100',
      },
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 10% of the crew’s 230 barrels.” What is the code?',
        answer: 23,
        hint: '10% is one tenth. Divide by 10.',
        explanation: '10% is one tenth. 230 ÷ 10 = 23.',
        oracle: '230*10/100',
      },
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 25% of 64 cannonballs.” What is the code?',
        answer: 16,
        hint: '25% is one quarter. Halve, then halve again.',
        explanation: '25% is a quarter. 64 ÷ 4 = 16.',
        oracle: '64*25/100',
      },
    ],
    adventurer: [
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 75% of 120 barrels.” What is the code?',
        answer: 90,
        hint: 'Find 25% (a quarter) first, then take three of them.',
        explanation: '25% of 120 is 30. 75% is 30 × 3 = 90.',
        oracle: '120*75/100',
      },
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 20% of 185 ropes.” What is the code?',
        answer: 37,
        hint: '20% is one fifth. Divide by 5.',
        explanation: '20% is one fifth. 185 ÷ 5 = 37.',
        oracle: '185*20/100',
      },
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 30% of 260 coins.” What is the code?',
        answer: 78,
        hint: 'Find 10% of 260, then multiply by 3.',
        explanation: '10% of 260 is 26. 30% is 26 × 3 = 78.',
        oracle: '260*30/100',
      },
    ],
    pathfinder: [
      {
        topic: 'percentages',
        prompt: 'The dial says: “The code is 35% of 260 coins.” What is the code?',
        answer: 91,
        hint: 'Build 35% from 25% and 10%.',
        explanation: '25% of 260 is 65. 10% is 26. 65 + 26 = 91.',
        oracle: '260*35/100',
      },
      {
        topic: 'percentages',
        prompt:
          'Redsail has 480 coins. 15% go to the lookout. Then 25% of what is left goes to the cook. The code is the cook’s share. What is it?',
        answer: 102,
        hint: 'Find 15% of 480 and subtract it. Then find a quarter of what remains.',
        explanation:
          '10% of 480 is 48 and 5% is 24, so 15% is 72. 480 − 72 = 408. A quarter of 408 is 102.',
        oracle: '(480-480*15/100)*25/100',
      },
      {
        topic: 'percentages',
        prompt:
          'The tide was 360 cm high. It fell by 45%. The code is the new height in centimetres. What is it?',
        answer: 198,
        unit: 'cm',
        hint: 'Find 45% of 360 (try 50% − 5%), then subtract it from 360.',
        explanation: '50% of 360 is 180 and 5% is 18, so 45% is 162. 360 − 162 = 198 cm.',
        oracle: '360-360*45/100',
      },
    ],
  }),
  ...pool('seal-shapes', {
    explorer: [
      {
        topic: 'geometry',
        prompt: 'The seal is a rectangle 9 cm long and 6 cm wide. What is its area?',
        answer: 54,
        unit: 'cm²',
        hint: 'Area of a rectangle = length × width.',
        explanation: '9 × 6 = 54 cm².',
        oracle: '9*6',
      },
      {
        topic: 'geometry',
        prompt: 'The seal is a rectangle 12 cm long and 5 cm wide. What is its perimeter?',
        answer: 34,
        unit: 'cm',
        hint: 'Perimeter is all four sides: add length and width, then double.',
        explanation: '12 + 5 = 17. 17 × 2 = 34 cm.',
        oracle: '2*(12+5)',
      },
      {
        topic: 'geometry',
        prompt: 'A square rune has sides of 7 cm. What is its perimeter?',
        answer: 28,
        unit: 'cm',
        hint: 'A square has four equal sides.',
        explanation: '4 × 7 = 28 cm.',
        oracle: '4*7',
      },
    ],
    adventurer: [
      {
        topic: 'geometry',
        prompt: 'A rectangular rune has an area of 96 cm². It is 12 cm long. How wide is it?',
        answer: 8,
        unit: 'cm',
        hint: 'Length × width = area, so width = area ÷ length.',
        explanation: '96 ÷ 12 = 8 cm. Check: 12 × 8 = 96 cm².',
        oracle: '96/12',
      },
      {
        topic: 'geometry',
        prompt:
          'An L-shaped rune is a 10 cm by 6 cm rectangle with a 4 cm by 3 cm rectangle cut from one corner. What is its area?',
        answer: 48,
        unit: 'cm²',
        hint: 'Find the big rectangle’s area, then subtract the missing corner.',
        explanation: '10 × 6 = 60 cm². The corner is 4 × 3 = 12 cm². 60 − 12 = 48 cm².',
        oracle: '10*6-4*3',
      },
      {
        topic: 'geometry',
        prompt:
          'The seal’s border is a rectangle 15 cm by 9 cm. A glowing spark travels round the border twice. How far does it travel?',
        answer: 96,
        unit: 'cm',
        hint: 'Find the perimeter first, then double it.',
        explanation: 'Perimeter: (15 + 9) × 2 = 48 cm. Twice round: 48 × 2 = 96 cm.',
        oracle: '2*(15+9)*2',
      },
    ],
    pathfinder: [
      {
        topic: 'geometry',
        prompt:
          'A rectangular seal has a perimeter of 54 cm. Its length is 16 cm. What is its area?',
        answer: 176,
        unit: 'cm²',
        hint: 'Half the perimeter is length + width. Use it to find the width first.',
        explanation: '54 ÷ 2 = 27, so the width is 27 − 16 = 11 cm. Area: 16 × 11 = 176 cm².',
        oracle: '16*(54/2-16)',
      },
      {
        topic: 'geometry',
        prompt:
          'A seal is an 18 cm by 14 cm rectangle with a 6 cm by 5 cm notch cut out of one edge. What is the area that remains?',
        answer: 222,
        unit: 'cm²',
        hint: 'Whole rectangle area minus the notch area.',
        explanation: '18 × 14 = 252 cm². The notch is 6 × 5 = 30 cm². 252 − 30 = 222 cm².',
        oracle: '18*14-6*5',
      },
      {
        topic: 'geometry',
        prompt:
          'Each square rune tile has an area of 144 cm². Four tiles are placed side by side in a straight row. What is the perimeter of the whole row?',
        answer: 120,
        unit: 'cm',
        hint: 'Which number times itself makes 144? That is the side. Then sketch the row.',
        explanation:
          '12 × 12 = 144, so each side is 12 cm. The row is 48 cm long and 12 cm wide. (48 + 12) × 2 = 120 cm.',
        oracle: '2*(4*12+12)',
      },
    ],
  }),
  ...pool('seal-parts', {
    explorer: [
      {
        topic: 'fractions',
        prompt:
          'The seal has 12 equal slices. One third are red and one quarter are blue. How many slices are neither red nor blue?',
        answer: 5,
        hint: 'Find 1/3 of 12 and 1/4 of 12. Take both away from 12.',
        explanation: '1/3 of 12 = 4 and 1/4 of 12 = 3. 12 − 4 − 3 = 5 slices.',
        oracle: '12-12/3-12/4',
      },
      {
        topic: 'fractions',
        prompt:
          'The seal has 20 slices. One half are dark and one fifth are bright. How many slices are dark or bright?',
        answer: 14,
        hint: 'Find each fraction of 20, then add.',
        explanation: '1/2 of 20 = 10 and 1/5 of 20 = 4. 10 + 4 = 14 slices.',
        oracle: '20/2+20/5',
      },
      {
        topic: 'fractions',
        prompt:
          'The seal has 24 slices. Is 3/8 of them or 1/3 of them more? Enter the larger number of slices.',
        answer: 9,
        hint: 'Work out 3/8 of 24 and 1/3 of 24, then compare.',
        explanation: '3/8 of 24 = 3 × 3 = 9. 1/3 of 24 = 8. 9 is larger.',
        oracle: '24/8*3',
      },
    ],
    adventurer: [
      {
        topic: 'fractions',
        prompt:
          'The seal has 36 slices. Five twelfths are cracked and one third are glowing. How many slices are neither?',
        answer: 9,
        hint: 'One twelfth of 36 is 3. One third of 36 is 12.',
        explanation: '5/12 of 36 = 15. 1/3 of 36 = 12. 36 − 15 − 12 = 9 slices.',
        oracle: '36-36/12*5-36/3',
      },
      {
        topic: 'fractions',
        prompt:
          'The seal has 40 slices. Three eighths are green and two fifths are gold. How many more gold slices than green slices are there?',
        answer: 1,
        hint: 'Work out both amounts exactly. They are close!',
        explanation: '3/8 of 40 = 15. 2/5 of 40 = 16. 16 − 15 = 1 more gold slice.',
        oracle: '40/5*2-40/8*3',
      },
      {
        topic: 'fractions',
        prompt:
          'Three quarters of the seal’s 48 slices glow. Two thirds of the glowing slices pulse. How many slices pulse?',
        answer: 24,
        hint: 'Find the glowing slices first, then take two thirds of those.',
        explanation: '3/4 of 48 = 36 glowing. 2/3 of 36 = 24 pulsing slices.',
        oracle: '48/4*3/3*2',
      },
    ],
    pathfinder: [
      {
        topic: 'fractions',
        prompt:
          'The seal has 72 slices. Five eighths are lit. Then one third of the lit slices go dark. How many slices are still lit?',
        answer: 30,
        hint: 'Find 5/8 of 72. Then remove one third of that amount.',
        explanation: '72 ÷ 8 = 9, so 45 are lit. One third of 45 is 15. 45 − 15 = 30 slices.',
        oracle: '72/8*5-72/8*5/3',
      },
      {
        topic: 'fractions',
        prompt:
          'The seal has 60 slices. Seven twelfths are cracked and three tenths are scorched. The rest are whole. How many are whole?',
        answer: 7,
        hint: 'Find 7/12 of 60 and 3/10 of 60, then subtract both from 60.',
        explanation: '7/12 of 60 = 35. 3/10 of 60 = 18. 60 − 35 − 18 = 7 whole slices.',
        oracle: '60-60/12*7-60/10*3',
      },
      {
        topic: 'fractions',
        prompt:
          'To break the seal, 5/6 of its 90 runes must be lit. You have lit 3/5 of them so far. How many more runes must you light?',
        answer: 21,
        hint: 'Work out 5/6 of 90 and 3/5 of 90. The difference is what is left.',
        explanation: '5/6 of 90 = 75. 3/5 of 90 = 54. 75 − 54 = 21 more runes.',
        oracle: '90/6*5-90/5*3',
      },
    ],
  }),
  ...pool('seal-sharing', {
    explorer: [
      {
        topic: 'division',
        prompt:
          'The seal holds 252 crystals. They must be shared equally between 6 lanterns. How many crystals does each lantern get?',
        answer: 42,
        hint: 'Split 252 into 240 and 12. Divide each part by 6.',
        explanation: '240 ÷ 6 = 40 and 12 ÷ 6 = 2. 40 + 2 = 42 crystals.',
        oracle: '252/6',
      },
      {
        topic: 'division',
        prompt: '344 sparks must be split equally between 8 torches. How many sparks per torch?',
        answer: 43,
        hint: 'Split 344 into 320 and 24.',
        explanation: '320 ÷ 8 = 40 and 24 ÷ 8 = 3. 40 + 3 = 43 sparks.',
        oracle: '344/8',
      },
      {
        topic: 'division',
        prompt: '396 rune chips are shared equally between 9 pillars. How many chips per pillar?',
        answer: 44,
        hint: 'Split 396 into 360 and 36.',
        explanation: '360 ÷ 9 = 40 and 36 ÷ 9 = 4. 40 + 4 = 44 chips.',
        oracle: '396/9',
      },
    ],
    adventurer: [
      {
        topic: 'division',
        prompt: '672 runes are shared equally between 16 pillars. How many runes per pillar?',
        answer: 42,
        hint: '16 × 40 = 640. How many more sixteens fit into what is left?',
        explanation: '16 × 40 = 640. 672 − 640 = 32 = 16 × 2. So 40 + 2 = 42 runes.',
        oracle: '672/16',
      },
      {
        topic: 'division',
        prompt:
          '1,125 grains of sand are poured equally into 15 hourglasses. How many grains go in each?',
        answer: 75,
        hint: '15 × 70 = 1,050. What is left over?',
        explanation: '15 × 70 = 1,050. 1,125 − 1,050 = 75 = 15 × 5. So 70 + 5 = 75 grains.',
        oracle: '1125/15',
      },
      {
        topic: 'division',
        prompt: '936 sparks are shared equally between 24 torches. How many sparks per torch?',
        answer: 39,
        hint: '24 × 40 = 960, which is a little too many.',
        explanation:
          '24 × 40 = 960, which is 24 too many. So 40 − 1 = 39 sparks. Check: 24 × 39 = 936.',
        oracle: '936/24',
      },
    ],
    pathfinder: [
      {
        topic: 'division',
        prompt: '8,748 crystals are shared equally between 27 lanterns. How many per lantern?',
        answer: 324,
        hint: '27 × 300 = 8,100. Keep chunking what is left.',
        explanation:
          '27 × 300 = 8,100. 8,748 − 8,100 = 648. 27 × 24 = 648. So 300 + 24 = 324 crystals.',
        oracle: '8748/27',
      },
      {
        topic: 'division',
        prompt:
          '3,456 runes are split equally into 18 rings. Each ring is then shared equally between 4 guardians. How many runes does each guardian get?',
        answer: 48,
        hint: 'Divide by 18 first, then by 4. Or divide by 18 × 4 = 72 in one go.',
        explanation: '3,456 ÷ 18 = 192 runes per ring. 192 ÷ 4 = 48 runes each.',
        oracle: '3456/18/4',
      },
      {
        topic: 'division',
        prompt:
          '1,680 sparks were shared between 35 torches. Then 7 torches blew out, and all the sparks were shared equally between the torches still lit. How many sparks does each lit torch have now?',
        answer: 60,
        hint: 'How many torches are still lit? Share all 1,680 sparks between them.',
        explanation: '35 − 7 = 28 torches. 1,680 ÷ 28 = 60 sparks each.',
        oracle: '1680/(35-7)',
      },
    ],
  }),
  ...pool('sunken-cache', {
    explorer: [
      {
        topic: 'multiplication',
        prompt:
          'The drowned chest has four dials. Dial 1 is 7 × 8. Dial 2 is half of dial 1. Dial 3 is dial 2 minus 9. Dial 4 is dial 3 × 3. What is dial 4?',
        answer: 57,
        hint: 'Work one dial at a time and write each result down.',
        explanation: 'Dial 1: 56. Dial 2: 28. Dial 3: 28 − 9 = 19. Dial 4: 19 × 3 = 57.',
        oracle: '(7*8/2-9)*3',
      },
      {
        topic: 'fractions',
        prompt:
          'A crab carries 3 pearls on each trip. It makes 12 trips. Then it gives one quarter of its pearls to the tide. How many pearls does it keep?',
        answer: 27,
        hint: 'Count all the pearls first, then take away a quarter.',
        explanation: '3 × 12 = 36 pearls. A quarter of 36 is 9. 36 − 9 = 27 pearls.',
        oracle: '3*12-3*12/4',
      },
      {
        topic: 'multiplication',
        prompt:
          'The tide rose 15 cm every hour for 6 hours. Then it fell by one third of that rise. How much higher is it now than at the start?',
        answer: 60,
        unit: 'cm',
        hint: 'Find the total rise, then take away one third of it.',
        explanation: '15 × 6 = 90 cm. One third of 90 is 30. 90 − 30 = 60 cm.',
        oracle: '15*6-15*6/3',
      },
    ],
    adventurer: [
      {
        topic: 'percentages',
        prompt:
          'The chest holds 240 pearls. 25% are black. The other pearls are shared equally between the 9 tide dials. How many pearls go on each dial?',
        answer: 20,
        hint: 'Remove the black pearls first. Then divide what remains by 9.',
        explanation: '25% of 240 = 60 black. 240 − 60 = 180. 180 ÷ 9 = 20 pearls per dial.',
        oracle: '(240-240*25/100)/9',
      },
      {
        topic: 'geometry',
        prompt:
          'A tide pool is a rectangle 14 m by 9 m. A crab walks round its edge 3 times, then walks back one sixth of that distance. How far does it walk altogether?',
        answer: 161,
        unit: 'm',
        hint: 'Perimeter first. Then 3 laps. Then add one sixth of the 3 laps.',
        explanation:
          'Perimeter: (14 + 9) × 2 = 46 m. Three laps: 138 m. One sixth of 138 is 23. 138 + 23 = 161 m.',
        oracle: '2*(14+9)*3+2*(14+9)*3/6',
      },
      {
        topic: 'fractions',
        prompt:
          'The chest holds 18 bags with 24 coins in each. Two thirds of all the coins are silver. How many silver coins are there?',
        answer: 288,
        hint: 'Count the coins (18 × 24), then take two thirds.',
        explanation: '18 × 24 = 432 coins. One third is 144. Two thirds is 288 silver coins.',
        oracle: '18*24/3*2',
      },
    ],
    pathfinder: [
      {
        topic: 'percentages',
        prompt:
          'Four tide dials. Dial 1 is 125 × 16. Dial 2 is 35% of dial 1. Dial 3 is dial 2 ÷ 14. What number opens the chest (dial 3)?',
        answer: 50,
        hint: 'Write each dial down. 35% = 25% + 10%.',
        explanation:
          'Dial 1: 125 × 16 = 2,000. Dial 2: 25% is 500 and 10% is 200, so 700. Dial 3: 700 ÷ 14 = 50.',
        oracle: '125*16*35/100/14',
      },
      {
        topic: 'percentages',
        prompt:
          'A hoard of 1,440 coins. 3/8 go to the captain. 20% of what is left goes to the cook. The rest is shared equally between 12 sailors. How many coins does each sailor get?',
        answer: 60,
        hint: 'Captain first, then the cook takes 20% of the remainder, then share by 12.',
        explanation:
          '1,440 ÷ 8 × 3 = 540 to the captain. 900 left. 20% of 900 = 180 to the cook. 720 left. 720 ÷ 12 = 60 coins each.',
        oracle: '(1440-1440/8*3)*(100-20)/100/12',
      },
      {
        topic: 'geometry',
        prompt:
          'A rectangular tide pool is 24 m long with an area of 480 m². A rope goes all the way round it. 25% of the rope is cut away. How many metres of rope remain?',
        answer: 66,
        unit: 'm',
        hint: 'Find the width from the area, then the perimeter, then remove a quarter.',
        explanation:
          '480 ÷ 24 = 20 m wide. Perimeter: (24 + 20) × 2 = 88 m. 25% of 88 = 22. 88 − 22 = 66 m.',
        oracle: '2*(24+480/24)*(100-25)/100',
      },
    ],
  }),
];

export const tasksFor = (id: TaskPoolId, band: Difficulty) =>
  TASK_BANK.filter((task) => task.pool === id && task.band === band);

/**
 * Deterministic choice that rotates variants between expeditions, so a replay
 * meets a different task while a retry within one expedition stays stable.
 */
export function drawTask(
  id: TaskPoolId,
  band: Difficulty,
  seed: number,
  expedition: number,
): BankTask {
  const options = tasksFor(id, band);
  return options[(hash(`${seed}:${id}`) + expedition - 1) % options.length];
}

/** `context` (for example seed and expedition) keeps each encounter's hint/attempt record distinct. */
export function taskQuestion(
  task: BankTask,
  tier: 'focus' | 'ritual',
  context: string,
): ActionQuestion {
  return {
    id: `task:${task.id}:${context}`,
    tier,
    timeLimitMs: null,
    topic: task.topic,
    difficulty: task.band,
    prompt: task.prompt,
    answer: String(task.answer),
    unit: task.unit,
    hint: task.hint,
    explanation: task.explanation,
    operands: [task.answer],
  };
}

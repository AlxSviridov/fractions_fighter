import type { RpgState } from './rpg';
import { hash, isCorrect, makeQuestion, TOPICS } from './math';
import type { Difficulty, Question, Topic } from './math';
export type Profile = { name: string; skin: number; hair: number; outfit: number };
export type Attempt = {
  questionId: string;
  topic: Topic;
  difficulty: Difficulty;
  answer: string;
  correct: boolean;
  hinted: boolean;
  durationMs: number;
  at: string;
};
export type Save = {
  version: 1;
  rpg?: RpgState;
  slotId?: string;
  quickTimer?: boolean;
  profile: Profile;
  settings: { difficulty: Difficulty; sound: boolean; reducedMotion: boolean };
  seed: number;
  expedition: number;
  completed: string[];
  guardianStage: number;
  xp: number;
  attempts: Attempt[];
  hintedQuestions: string[];
  unlockedOutfits: number[];
  started: boolean;
  won: boolean;
};
export type Landmark = {
  id: string;
  name: string;
  subtitle: string;
  topic: Topic;
  x: number;
  z: number;
  kind: 'seal' | 'cache' | 'boss';
};
export const LANDMARKS: Landmark[] = [
  {
    id: 'tide',
    name: 'The Tide Waystone',
    subtitle: 'AWAKEN THE FIRST SEAL',
    topic: 'fractions',
    x: -6,
    z: 3,
    kind: 'seal',
  },
  {
    id: 'ember',
    name: 'The Ember Ward',
    subtitle: 'AWAKEN THE SECOND SEAL',
    topic: 'multiplication',
    x: 6,
    z: 2,
    kind: 'seal',
  },
  {
    id: 'root',
    name: 'The Root Shrine',
    subtitle: 'AWAKEN THE THIRD SEAL',
    topic: 'geometry',
    x: -5,
    z: -5,
    kind: 'seal',
  },
  {
    id: 'cache',
    name: 'The Sunken Cache',
    subtitle: 'A LITTLE DETOUR. A LITTLE TREASURE.',
    topic: 'percentages',
    x: 7,
    z: -5,
    kind: 'cache',
  },
  {
    id: 'guardian',
    name: 'The Jade Guardian',
    subtitle: 'RECLAIM THE LOST COMPASS',
    topic: 'division',
    x: 0,
    z: -9,
    kind: 'boss',
  },
];
export const SEALS = LANDMARKS.filter((l) => l.kind === 'seal');
export function freshSave(seed = Math.floor(Math.random() * 2 ** 31)): Save {
  return {
    version: 1,
    profile: { name: 'Rowan', skin: 1, hair: 0, outfit: 0 },
    settings: { difficulty: 'adventurer', sound: false, reducedMotion: false },
    seed,
    expedition: 1,
    completed: [],
    guardianStage: 0,
    xp: 0,
    attempts: [],
    hintedQuestions: [],
    unlockedOutfits: [0, 1, 2],
    started: false,
    won: false,
  };
}
export function sealCount(s: Save) {
  return SEALS.filter((l) => s.completed.includes(l.id)).length;
}
export function canEnter(s: Save, landmark: Landmark) {
  return !s.completed.includes(landmark.id) && (landmark.kind !== 'boss' || sealCount(s) === 3);
}
export function questionFor(s: Save, landmark: Landmark): Question {
  const topic =
    landmark.kind === 'boss'
      ? ((['percentages', 'multiplication', 'division'] as Topic[])[s.guardianStage] ?? 'division')
      : landmark.topic;
  return makeQuestion(
    topic,
    s.settings.difficulty,
    hash(`${s.seed}:${s.expedition}`),
    `${landmark.id}:${s.guardianStage && landmark.kind === 'boss' ? s.guardianStage : 0}`,
  );
}
export function resolveAnswer(s: Save, landmark: Landmark, q: Question, attempt: Attempt): Save {
  if (!canEnter(s, landmark) || q.id !== questionFor(s, landmark).id || attempt.questionId !== q.id)
    return s;
  const checked = {
    ...attempt,
    correct: isCorrect(questionFor(s, landmark), attempt.answer),
    hinted: attempt.hinted || s.hintedQuestions.includes(q.id),
  };
  const next = { ...s, attempts: [...s.attempts, checked].slice(-10000) };
  if (!checked.correct) return next;
  if (landmark.kind === 'boss' && s.guardianStage < 2)
    return { ...next, guardianStage: s.guardianStage + 1, xp: s.xp + 50 };
  const won = landmark.kind === 'boss';
  return {
    ...next,
    completed: [...s.completed, landmark.id],
    xp: s.xp + (won ? 150 : landmark.kind === 'cache' ? 35 : 50),
    guardianStage: won ? 3 : s.guardianStage,
    won: won || s.won,
    unlockedOutfits: won ? [...new Set([...s.unlockedOutfits, 3])] : s.unlockedOutfits,
  };
}
export function nextExpedition(s: Save): Save {
  if (!s.won) return s;
  return {
    ...s,
    expedition: s.expedition + 1,
    seed: hash(`${s.seed}:next`),
    completed: [],
    guardianStage: 0,
    won: false,
  };
}
export type TopicReport = {
  topic: Topic;
  name: string;
  questions: number;
  independent: number;
  assisted: number;
  completed: number;
  accuracy: number | null;
};
export function topicReports(attempts: Attempt[]): TopicReport[] {
  return (Object.keys(TOPICS) as Topic[]).map((topic) => {
    const grouped = new Map<string, Attempt[]>();
    for (const a of attempts.filter((a) => a.topic === topic))
      grouped.set(a.questionId, [...(grouped.get(a.questionId) ?? []), a]);
    const questions = grouped.size;
    let independent = 0,
      assisted = 0,
      completed = 0;
    for (const group of grouped.values()) {
      if (group[0].correct && !group[0].hinted) independent++;
      if (group.some((a) => a.correct)) {
        completed++;
        if (!group[0].correct || group.some((a) => a.hinted)) assisted++;
      }
    }
    return {
      topic,
      name: TOPICS[topic],
      questions,
      independent,
      assisted,
      completed,
      accuracy: questions ? Math.round((independent / questions) * 100) : null,
    };
  });
}

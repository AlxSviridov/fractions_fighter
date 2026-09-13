import { describe, expect, it } from 'vitest';
import {
  canEnter,
  freshSave,
  LANDMARKS,
  nextExpedition,
  questionFor,
  resolveAnswer,
  sealCount,
  topicReports,
} from '../src/game/state';
import type { Attempt, Landmark, Save } from '../src/game/state';
const boss = LANDMARKS.find((l) => l.kind === 'boss')!;
function attempt(s: Save, l: Landmark, answer?: string, hinted = false): Attempt {
  const q = questionFor(s, l);
  return {
    questionId: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    answer: answer ?? q.answer,
    correct: answer === undefined,
    hinted,
    durationMs: 1000,
    at: '2026-09-12T12:00:00Z',
  };
}
function solve(s: Save, l: Landmark) {
  return resolveAnswer(s, l, questionFor(s, l), attempt(s, l));
}
describe('expedition progression', () => {
  it('gates guardian, preserves failure, awards once, unlocks outfit and retains progress on replay', () => {
    let s = freshSave(123);
    expect(canEnter(s, boss)).toBe(false);
    expect(solve(s, boss)).toBe(s);
    expect(nextExpedition(s)).toBe(s);
    const first = LANDMARKS[0],
      q = questionFor(s, first);
    s = resolveAnswer(s, first, q, attempt(s, first, 'wrong'));
    expect(s.xp).toBe(0);
    expect(s.completed).toEqual([]);
    expect(s.attempts).toHaveLength(1);
    for (const l of LANDMARKS.filter((l) => l.kind !== 'boss')) {
      s = solve(s, l);
      const duplicate = solve(s, l);
      expect(duplicate).toBe(s);
    }
    expect(sealCount(s)).toBe(3);
    expect(canEnter(s, boss)).toBe(true);
    for (let stage = 1; stage <= 3; stage++) {
      const old = s,
        oldQ = questionFor(s, boss);
      s = solve(s, boss);
      expect(s.guardianStage).toBe(stage);
      expect(s.won).toBe(stage === 3);
      expect(resolveAnswer(s, boss, oldQ, attempt(old, boss))).toBe(s);
    }
    expect(s.xp).toBe(435);
    expect(s.unlockedOutfits).toContain(3);
    const n = nextExpedition(s);
    expect(n.xp).toBe(s.xp);
    expect(n.attempts).toEqual(s.attempts);
    expect(n.completed).toEqual([]);
    expect(n.expedition).toBe(2);
    expect(n.won).toBe(false);
    expect(n.seed).not.toBe(s.seed);
  });
  it('derives correctness instead of trusting a supplied correct flag', () => {
    const s = freshSave(8),
      l = LANDMARKS[1],
      q = questionFor(s, l);
    const n = resolveAnswer(s, l, q, { ...attempt(s, l, '9999999'), correct: true });
    expect(n.xp).toBe(0);
    expect(n.attempts[0].correct).toBe(false);
  });
  it('counts retries and hint history separately from independent first tries', () => {
    let s = freshSave(7);
    const l = LANDMARKS[0];
    s = resolveAnswer(s, l, questionFor(s, l), attempt(s, l, 'incorrect'));
    s = solve(s, l);
    const report = topicReports(s.attempts).find((r) => r.topic === 'fractions')!;
    expect(report).toMatchObject({
      questions: 1,
      independent: 0,
      assisted: 1,
      completed: 1,
      accuracy: 0,
    });
    const other = LANDMARKS[1],
      q = questionFor(s, other);
    s = { ...s, hintedQuestions: [q.id] };
    s = solve(s, other);
    expect(topicReports(s.attempts).find((r) => r.topic === 'multiplication')).toMatchObject({
      independent: 0,
      assisted: 1,
    });
    expect(topicReports([]).every((r) => r.accuracy === null)).toBe(true);
  });
});

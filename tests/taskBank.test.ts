import { describe, expect, it } from 'vitest';
import { TASK_BANK, TASK_POOLS, drawTask, taskQuestion, tasksFor } from '../src/game/taskBank';
import type { TaskPoolId } from '../src/game/taskBank';
import { isActionCorrect } from '../src/game/actionMath';
import { LEVEL_OBJECTS } from '../src/game/level';
import type { Difficulty } from '../src/game/math';

/**
 * Independent exact oracle: a tiny recursive-descent evaluator over BigInt
 * rationals. It shares no code with the task bank and never rounds.
 */
type Q = [bigint, bigint];
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const norm = ([n, d]: Q): Q => {
  if (d === 0n) throw new Error('division by zero');
  const g = gcd(n, d) || 1n;
  const sign = d < 0n ? -1n : 1n;
  return [(sign * n) / g, (sign * d) / g];
};
function evaluate(expression: string): Q {
  const tokens = expression.match(/\d+|[-+*/()]/g)!;
  expect(tokens.join('')).toBe(expression.replace(/\s/g, ''));
  let i = 0;
  const primary = (): Q => {
    const t = tokens[i++];
    if (t === '(') {
      const v = sum();
      expect(tokens[i++]).toBe(')');
      return v;
    }
    expect(t).toMatch(/^\d+$/);
    return [BigInt(t), 1n];
  };
  const product = (): Q => {
    let v = primary();
    while (tokens[i] === '*' || tokens[i] === '/') {
      const op = tokens[i++];
      const [n, d] = primary();
      v = norm(op === '*' ? [v[0] * n, v[1] * d] : [v[0] * d, v[1] * n]);
    }
    return v;
  };
  const sum = (): Q => {
    let v = product();
    while (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i++];
      const [n, d] = product();
      v = norm([v[0] * d + (op === '+' ? n : -n) * v[1], v[1] * d]);
    }
    return v;
  };
  const value = sum();
  expect(i).toBe(tokens.length);
  return value;
}

const BANDS: Difficulty[] = ['explorer', 'adventurer', 'pathfinder'];
const POOLS = Object.keys(TASK_POOLS) as TaskPoolId[];

describe('Chapter I task repository', () => {
  it('covers every pool and band with three distinct variants', () => {
    expect(TASK_BANK).toHaveLength(POOLS.length * BANDS.length * 3);
    for (const pool of POOLS)
      for (const band of BANDS) {
        const tasks = tasksFor(pool, band);
        expect(tasks, `${pool}/${band}`).toHaveLength(3);
        expect(new Set(tasks.map((t) => t.prompt)).size).toBe(3);
      }
    expect(new Set(TASK_BANK.map((t) => t.id)).size).toBe(TASK_BANK.length);
    expect(new Set(TASK_BANK.map((t) => t.prompt)).size).toBe(TASK_BANK.length);
  });

  it('every authored answer agrees with an independent exact oracle', () => {
    for (const task of TASK_BANK) {
      const [n, d] = evaluate(task.oracle);
      expect(d, `${task.id} oracle is not a whole number`).toBe(1n);
      expect(Number(n), task.id).toBe(task.answer);
      expect(Number.isInteger(task.answer) && task.answer > 0, task.id).toBe(true);
    }
  });

  it('explanations reach the stated answer and prompts never reveal it', () => {
    for (const task of TASK_BANK) {
      const digits = (text: string) => text.replace(/(\d),(\d{3})/g, '$1$2');
      expect(digits(task.explanation), task.id).toContain(String(task.answer));
      const numbersInPrompt = digits(task.prompt).match(/\d+/g) ?? [];
      // A prompt may coincidentally contain the answer only when it is a
      // comparison of two computed quantities; none currently do.
      expect(numbersInPrompt, task.id).not.toContain(String(task.answer));
      expect(task.hint.length, task.id).toBeGreaterThan(10);
      if (/what is (its|the) area|area that remains/i.test(task.prompt))
        expect(task.unit, task.id).toBe('cm²');
    }
  });

  it('pathfinder bridge tasks use three-digit × two-digit multiplication', () => {
    for (const task of tasksFor('bridge-winch', 'pathfinder'))
      expect(task.oracle, task.id).toMatch(/^\d{3}\*\d{2}$/);
  });

  it('rotates variants between expeditions and stays stable within one', () => {
    for (const pool of POOLS) {
      const seen = new Set([1, 2, 3].map((e) => drawTask(pool, 'adventurer', 42, e).id));
      expect(seen.size, pool).toBe(3);
      expect(drawTask(pool, 'adventurer', 42, 1)).toBe(drawTask(pool, 'adventurer', 42, 1));
      expect(drawTask(pool, 'adventurer', 42, 4)).toBe(drawTask(pool, 'adventurer', 42, 1));
    }
  });

  it('bank questions are untimed and accept exact answers, including 2,852 style input', () => {
    const task = tasksFor('bridge-winch', 'pathfinder')[0];
    const question = taskQuestion(task, 'focus', 'slot:1:1');
    expect(question.timeLimitMs).toBeNull();
    expect(question.id).toBe(`task:${task.id}:slot:1:1`);
    expect(isActionCorrect(question, '2852')).toBe(true);
    expect(isActionCorrect(question, '2,852')).toBe(true);
    expect(isActionCorrect(question, ' 2852 ')).toBe(true);
    expect(isActionCorrect(question, '2,85,2')).toBe(false);
    expect(isActionCorrect(question, '2853')).toBe(false);
  });

  it('every pool is used by the level and every level puzzle names a real pool', () => {
    const used = new Set(LEVEL_OBJECTS.flatMap((o) => (o.task ? [o.task.pool] : [])));
    expect([...used].sort()).toEqual([...POOLS].sort());
  });
});

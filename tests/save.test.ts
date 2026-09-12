import { describe, expect, it } from 'vitest';
import { validateSave } from '../src/game/save';
import { freshSave } from '../src/game/state';
describe('portable save validation', () => {
  it('round trips a valid save and strips unexpected top-level fields', () => { const s = freshSave(42); expect(validateSave(JSON.parse(JSON.stringify({ ...s, unexpected: 'ignored' })))).toEqual(s); });
  it('rejects malformed and inconsistent records', () => {
    const s = freshSave(42);
    for (const data of [null, [], {}, { ...s, version: 2 }, { ...s, xp: -1 }, { ...s, seed: NaN }, { ...s, completed: ['unknown'] }, { ...s, completed: ['tide', 'tide'] }, { ...s, guardianStage: 3 }, { ...s, won: true }, { ...s, profile: { ...s.profile, outfit: 3 } }, { ...s, settings: { ...s.settings, difficulty: 'constructor' } }, { ...s, attempts: [{}] }, { ...s, hintedQuestions: [23] }]) expect(() => validateSave(data)).toThrow();
  });
});

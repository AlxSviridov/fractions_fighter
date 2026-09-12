import { DIFFICULTIES, TOPICS } from './math';
import { freshSave, LANDMARKS, sealCount } from './state';
import type { Save } from './state';
export const SAVE_KEY = 'verdant.save.v1';
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
export function validateSave(value: unknown): Save {
  if (!object(value) || value.version !== 1) throw new Error('This file is not a supported Verdant save (version 1).');
  const p = value.profile, settings = value.settings;
  if (!object(p) || typeof p.name !== 'string' || p.name.trim().length < 1 || p.name.length > 24 || !integer(p.skin, 0, 3) || !integer(p.hair, 0, 2) || !integer(p.outfit, 0, 3)) throw new Error('Explorer details are invalid.');
  if (!object(settings) || typeof settings.difficulty !== 'string' || !Object.hasOwn(DIFFICULTIES, settings.difficulty) || typeof settings.sound !== 'boolean' || typeof settings.reducedMotion !== 'boolean') throw new Error('Settings are invalid.');
  if (!integer(value.seed, 0, 2 ** 32 - 1) || !integer(value.expedition, 1, 1000000) || !integer(value.xp, 0, 1000000000) || !integer(value.guardianStage, 0, 3) || typeof value.started !== 'boolean' || typeof value.won !== 'boolean') throw new Error('Adventure progress is invalid.');
  if (!Array.isArray(value.completed) || new Set(value.completed).size !== value.completed.length || value.completed.some(id => !LANDMARKS.some(l => l.id === id))) throw new Error('Unknown or duplicate landmarks in save.');
  if (!Array.isArray(value.unlockedOutfits) || !value.unlockedOutfits.length || value.unlockedOutfits.some(o => !integer(o, 0, 3)) || !value.unlockedOutfits.includes(p.outfit)) throw new Error('Outfit collection is invalid.');
  if (!Array.isArray(value.attempts) || value.attempts.length > 10000 || value.attempts.some(a => !object(a) || typeof a.questionId !== 'string' || a.questionId.length > 200 || typeof a.topic !== 'string' || !Object.hasOwn(TOPICS, a.topic) || typeof a.difficulty !== 'string' || !Object.hasOwn(DIFFICULTIES, a.difficulty) || typeof a.answer !== 'string' || a.answer.length > 100 || typeof a.correct !== 'boolean' || typeof a.hinted !== 'boolean' || !integer(a.durationMs, 0, 86400000) || typeof a.at !== 'string' || !Number.isFinite(Date.parse(a.at)))) throw new Error('Learning records are invalid or too large.');
  if (!Array.isArray(value.hintedQuestions) || value.hintedQuestions.length > 10000 || value.hintedQuestions.some(q => typeof q !== 'string' || q.length > 200)) throw new Error('Hint history is invalid.');
  const s = value as unknown as Save;
  if ((s.guardianStage > 0 && sealCount(s) !== 3) || s.won !== (s.guardianStage === 3) || s.won !== s.completed.includes('guardian')) throw new Error('Guardian progress is inconsistent.');
  // Return only the known schema, stripping any unrecognised import fields.
  return { version: 1, profile: { name: p.name, skin: p.skin as number, hair: p.hair as number, outfit: p.outfit as number }, settings: { difficulty: settings.difficulty as Save['settings']['difficulty'], sound: settings.sound, reducedMotion: settings.reducedMotion }, seed: s.seed, expedition: s.expedition, completed: [...s.completed], guardianStage: s.guardianStage, xp: s.xp, hintedQuestions: [...s.hintedQuestions], attempts: s.attempts.map(a => ({ questionId: a.questionId, topic: a.topic, difficulty: a.difficulty, answer: a.answer, correct: a.correct, hinted: a.hinted, durationMs: a.durationMs, at: a.at })), unlockedOutfits: [...s.unlockedOutfits], started: s.started, won: s.won };
}
export function loadSave(): { save: Save; error?: string } {
  try { const raw = localStorage.getItem(SAVE_KEY); return { save: raw ? validateSave(JSON.parse(raw)) : freshSave() }; }
  catch { return { save: freshSave(), error: 'Your existing save could not be read. It has been kept untouched. Export a backup before starting a new save.' }; }
}
export function writeSave(save: Save) { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
export function importSave(raw: string): Save {
  if (raw.length > 5000000) throw new Error('That save file is too large.');
  const save = validateSave(JSON.parse(raw));
  const previous = localStorage.getItem(SAVE_KEY);
  if (previous) localStorage.setItem(`${SAVE_KEY}.backup`, previous);
  writeSave(save);
  return save;
}

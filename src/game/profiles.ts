import type { Save } from './state';
import { SAVE_KEY, validateSave } from './save';
export const LIBRARY_KEY = 'fractions-fighter.heroes.v1';
export type SavedHero = { id: string; updated: string; save: Save };
const heroId = (save: Save) => save.slotId || 'original-explorer';
const archiveError = () =>
  new Error('Hero archive could not be read. Existing heroes have been preserved.');
export function readHeroes(): SavedHero[] {
  const raw = localStorage.getItem(LIBRARY_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || data.length > 50) throw archiveError();
  const ids = new Set<string>();
  return data.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw archiveError();
    const v = value as Record<string, unknown>;
    if (
      typeof v.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(v.id) ||
      ids.has(v.id) ||
      typeof v.updated !== 'string' ||
      !Number.isFinite(Date.parse(v.updated)) ||
      new Date(v.updated).toISOString() !== v.updated
    )
      throw archiveError();
    const save = validateSave(v.save);
    if (!save.started || v.id !== heroId(save)) throw archiveError();
    ids.add(v.id);
    return { id: v.id, updated: v.updated, save };
  });
}
function nextLibrary(save: Save): SavedHero[] {
  const heroes = readHeroes();
  if (!save.started) return heroes;
  const id = heroId(save);
  if (heroes.length >= 50 && !heroes.some((h) => h.id === id))
    throw new Error('Your hero archive is full. Existing heroes have been preserved.');
  return [{ id, updated: new Date().toISOString(), save }, ...heroes.filter((h) => h.id !== id)];
}
/** Archive one hero without switching the currently active campaign. */
export function archiveHero(save: Save) {
  if (!save.started) return;
  const checked = validateSave(save);
  const heroes = nextLibrary(checked);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(heroes));
}
/**
 * Preflight both records, archive first, then switch the active campaign.
 * Synchronous storage failures restore the previous archive. localStorage has
 * no multi-key transaction: a browser crash between writes can leave a newer
 * archive and an older active record, but does not erase the prior active hero.
 */
export function persistHero(save: Save) {
  const checked = validateSave(save);
  const heroes = nextLibrary(checked);
  const libraryBefore = localStorage.getItem(LIBRARY_KEY);
  const activeJson = JSON.stringify(checked);
  const libraryJson = JSON.stringify(heroes);
  localStorage.setItem(LIBRARY_KEY, libraryJson);
  try {
    localStorage.setItem(SAVE_KEY, activeJson);
  } catch (error) {
    try {
      if (libraryBefore === null) localStorage.removeItem(LIBRARY_KEY);
      else localStorage.setItem(LIBRARY_KEY, libraryBefore);
    } catch {
      throw new Error(
        'The active hero was not replaced, but its archive could not be restored. Export the current hero before continuing.',
      );
    }
    throw error;
  }
}

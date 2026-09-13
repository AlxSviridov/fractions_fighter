import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveHero, LIBRARY_KEY, persistHero, readHeroes } from '../src/game/profiles';
import { SAVE_KEY } from '../src/game/save';
import { freshSave } from '../src/game/state';
import { attackEnemy, enterZone, equipItem, freshRpg } from '../src/game/rpg';

const hero = (id: string) => ({
  ...freshSave(42),
  slotId: id,
  started: true,
  rpg: freshRpg('ranger', '12'),
});
let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('per-hero campaign archives', () => {
  it('preserves two distinct heroes and updates only the played hero', () => {
    const first = hero('first');
    archiveHero(first);
    archiveHero(hero('second'));
    const wilds = enterZone(first.rpg, 'wilds');
    const won = attackEnemy(wilds, wilds.enemies[0].id, 'power', true);
    const equipped = equipItem(won, won.inventory[1].id);
    archiveHero({ ...first, rpg: equipped, xp: equipped.xp });
    const archived = readHeroes();
    expect(archived.map((h) => h.id)).toEqual(['first', 'second']);
    expect(archived[0].save.rpg).toEqual(equipped);
    expect(archived[1].save).toEqual(hero('second'));
    expect(archived[0].save.rpg?.inventory).toHaveLength(2);
    expect(archived[0].save.rpg?.equipment.weapon).toBe(won.inventory[1].id);
  });
  it('never archives an uncreated hero and preserves legacy save identity', () => {
    archiveHero(freshSave());
    expect(readHeroes()).toEqual([]);
    const legacy = { ...freshSave(7), started: true };
    archiveHero(legacy);
    archiveHero({ ...legacy, xp: 35 });
    expect(readHeroes()).toHaveLength(1);
    expect(readHeroes()[0].id).toBe('original-explorer');
    expect(readHeroes()[0].save.xp).toBe(35);
  });
  it('refuses an extra slot without changing a full archive but permits updating an existing hero', () => {
    for (let i = 0; i < 50; i++) archiveHero(hero(`hero-${i}`));
    const before = storage.get(LIBRARY_KEY);
    expect(() => archiveHero(hero('overflow'))).toThrow();
    expect(storage.get(LIBRARY_KEY)).toBe(before);
    archiveHero({ ...hero('hero-0'), profile: { ...hero('hero-0').profile, name: 'Renamed' } });
    expect(readHeroes()).toHaveLength(50);
    expect(readHeroes()[0].save.profile.name).toBe('Renamed');
  });
  it('preserves corrupt library bytes when reading or archiving fails', () => {
    storage.set(LIBRARY_KEY, '{ broken data');
    expect(() => readHeroes()).toThrow();
    expect(() => archiveHero(hero('new'))).toThrow();
    expect(storage.get(LIBRARY_KEY)).toBe('{ broken data');
  });
});

describe('safe paired persistence', () => {
  it('rejects duplicate or mismatched wrappers and malformed dates', () => {
    const entry = { id: 'first', updated: new Date().toISOString(), save: hero('first') };
    for (const invalid of [
      [entry, entry],
      [{ ...entry, id: 'second' }],
      [{ ...entry, updated: 'today' }],
      [{ ...entry, id: null }],
      [null],
    ]) {
      storage.set(LIBRARY_KEY, JSON.stringify(invalid));
      expect(() => readHeroes()).toThrow();
    }
  });
  it('preflights capacity before replacing the active hero', () => {
    for (let i = 0; i < 50; i++) archiveHero(hero(`hero-${i}`));
    storage.set(SAVE_KEY, JSON.stringify(hero('hero-0')));
    const before = new Map(storage);
    expect(() => persistHero(hero('extra'))).toThrow();
    expect(storage).toEqual(before);
  });
  it('restores the exact archive bytes when the active write fails', () => {
    persistHero(hero('first'));
    const before = new Map(storage);
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === SAVE_KEY) throw new Error('Simulated storage quota failure');
      storage.set(key, String(value));
    });
    expect(() => persistHero(hero('second'))).toThrow('quota');
    expect(storage).toEqual(before);
  });
  it('removes a newly created archive if the first active write fails', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === SAVE_KEY) throw new Error('Simulated storage quota failure');
      storage.set(key, String(value));
    });
    expect(() => persistHero(hero('first'))).toThrow('quota');
    expect(storage.size).toBe(0);
  });
  it('does not replace the active hero when the archive write fails', () => {
    persistHero(hero('first'));
    const before = new Map(storage);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(() => persistHero(hero('second'))).toThrow();
    expect(storage).toEqual(before);
  });
  it('switches heroes while keeping both independently loadable', () => {
    persistHero(hero('first'));
    persistHero(hero('second'));
    expect(JSON.parse(storage.get(SAVE_KEY)!).slotId).toBe('second');
    expect(readHeroes().map((h) => h.id)).toEqual(['second', 'first']);
  });
});

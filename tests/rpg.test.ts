import { describe, expect, it } from 'vitest';
import {
  attackEnemy,
  claimQuest,
  combatStats,
  enterZone,
  equipItem,
  freshRpg,
  interactObject,
  lootFor,
  questProgress,
  usePotion,
  validateRpg,
} from '../src/game/rpg';
import type { RpgState } from '../src/game/rpg';
const start = () => enterZone(freshRpg(), 'wilds');
const byKey = (s: RpgState, key: string) => s.enemies.find((e) => e.key === key)!;
/** Open every gate by playing the critical path, so any encounter is in reach. */
const openTrail = (s: RpgState) => {
  let n = ['bridge-winch', 'stockade-lock'].reduce((m, id) => interactObject(m, id), s);
  while (byKey(n, 'captain').hp > 0) n = attackEnemy(n, byKey(n, 'captain').id, 'ritual', true);
  return ['seal-west', 'seal-east', 'seal-heart'].reduce((m, id) => interactObject(m, id), n);
};
const clear = (s: RpgState) =>
  openTrail(s).enemies.reduce((n, e) => {
    while (n.enemies.find((candidate) => candidate.id === e.id)!.hp > 0)
      n = attackEnemy(n, e.id, 'ritual', true);
    return n;
  }, openTrail(s));
describe('Fractions Fighter campaign', () => {
  it('starts with a real class, equipment, safe village and a nine-encounter trail', () => {
    const s = freshRpg('ranger', 'portrait-1');
    expect(s.zone).toBe('village');
    expect(s.avatarId).toBe('portrait-1');
    expect(s.enemies).toHaveLength(9);
    expect(s.enemies.map((e) => e.rank)).toEqual([
      'minion',
      'minion',
      'elite',
      'minion',
      'minion',
      'minion',
      'elite',
      'elite',
      'boss',
    ]);
    expect(combatStats(s).attack).toBe(14);
    expect(attackEnemy(s, s.enemies[0].id, 'strike', true)).toBe(s);
  });
  it('minions take 1–3 quick strikes; the guardian is a real two-ritual boss fight', () => {
    const open = openTrail(start());
    for (const enemy of open.enemies.filter((e) => e.rank === 'minion')) {
      let s = open;
      let hits = 0;
      while (s.enemies.find((e) => e.id === enemy.id)!.hp > 0) {
        s = attackEnemy(s, enemy.id, 'strike', true);
        hits++;
      }
      expect(hits, enemy.name).toBeLessThanOrEqual(3);
    }
    const guardian = byKey(open, 'guardian');
    const once = attackEnemy(open, guardian.id, 'ritual', true);
    expect(byKey(once, 'guardian').hp).toBeGreaterThan(0);
    expect(byKey(attackEnemy(once, guardian.id, 'ritual', true), 'guardian').hp).toBe(0);
  });
  it('awards deterministic treasure once and equipping changes real stats', () => {
    const s = start();
    const n = attackEnemy(s, s.enemies[0].id, 'power', true);
    expect(s.enemies[0].hp).toBe(16);
    expect(n.xp).toBe(25);
    expect(n.gold).toBe(8);
    expect(n.inventory[1]).toEqual(lootFor(1, 0));
    expect(attackEnemy(n, n.enemies[0].id, 'power', true)).toBe(n);
    expect(combatStats(equipItem(n, n.inventory[1].id)).attack).toBe(14);
    expect(equipItem(n, 'nonexistent')).toBe(n);
  });
  it('mistakes preserve rewards, healing works, and defeat returns safely', () => {
    const s = start();
    const n = attackEnemy(s, s.enemies[0].id, 'strike', false);
    expect(n.xp).toBe(0);
    expect(n.enemies).toEqual(s.enemies);
    expect(n.hp).toBe(99);
    expect(usePotion(n).hp).toBe(100);
    expect(usePotion(n).potions).toBe(2);
    expect(usePotion(s)).toBe(s);
    const rescued = attackEnemy({ ...n, hp: 1, gold: 20 }, n.enemies[0].id, 'strike', false);
    expect(rescued.zone).toBe('village');
    expect(rescued.gold).toBe(20);
    expect(rescued.hp).toBe(100);
  });
  it('village returns retain enemy wounds and prevent reward farming', () => {
    const s = start();
    const hurt = attackEnemy(s, s.enemies[0].id, 'strike', true);
    expect(enterZone(enterZone(hurt, 'village'), 'wilds').enemies).toEqual(hurt.enemies);
    expect(claimQuest(enterZone(hurt, 'village'))).toEqual(enterZone(hurt, 'village'));
  });
  it('completes a quest, levels up, and starts a fresh expedition with existing equipment', () => {
    const s = clear(start());
    expect(questProgress(s).ready).toBe(true);
    expect(claimQuest(s)).toBe(s);
    const home = enterZone(s, 'village');
    const rewarded = claimQuest(home);
    expect(rewarded.gold).toBe(home.gold + 80);
    expect(rewarded.xp).toBe(home.xp + 100);
    expect(combatStats(rewarded).level).toBeGreaterThan(combatStats(start()).level);
    expect(claimQuest(rewarded)).toBe(rewarded);
    const next = enterZone(rewarded, 'wilds');
    expect(next.expedition).toBe(2);
    expect(next.inventory).toEqual(s.inventory);
    expect(next.enemies.every((e) => e.hp === e.maxHp)).toBe(true);
    // Bridge and stockade stay open: two of five objectives carry over.
    expect(questProgress(next).current).toBe(2);
    expect(lootFor(2, 0).topic).not.toBe(lootFor(1, 0).topic);
  });
  it('round-trips progression and rejects malformed or inconsistent imports', () => {
    const s = claimQuest(enterZone(clear(start()), 'village'));
    expect(validateRpg(JSON.parse(JSON.stringify(s)))).toEqual(s);
    for (const invalid of [
      null,
      { ...s, hp: NaN },
      { ...s, inventory: [...s.inventory, s.inventory[0]] },
      { ...s, equipment: { ...s.equipment, armour: s.inventory[0].id } },
      { ...freshRpg(), questClaimed: true },
      { ...s, enemies: [{ ...s.enemies[0], hp: -1 }, ...s.enemies.slice(1)] },
      { ...s, enemies: s.enemies.slice(1) },
    ])
      expect(() => validateRpg(invalid)).toThrow();
  });
  it('a full pack converts drops to gold without losing equipment', () => {
    const base = start();
    const s = {
      ...base,
      inventory: Array.from({ length: 200 }, (_, i) => ({
        ...base.inventory[0],
        id: i === 0 ? 'starter-weapon' : `extra-${i}`,
      })),
    };
    const next = attackEnemy(s, s.enemies[0].id, 'power', true);
    expect(next.inventory).toHaveLength(200);
    expect(next.gold).toBe(33);
    expect(next.lastReward).toContain('25 gold');
  });
});

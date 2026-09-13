import { describe, expect, it } from 'vitest';
import {
  attackEnemy,
  claimQuest,
  combatStats,
  enterZone,
  equipItem,
  freshRpg,
  lootFor,
  questProgress,
  usePotion,
  validateRpg,
} from '../src/game/rpg';
import type { RpgState } from '../src/game/rpg';
const start = () => enterZone(freshRpg(), 'wilds');
const clear = (s: RpgState) =>
  s.enemies.reduce((n, e) => {
    while (n.enemies.find((candidate) => candidate.id === e.id)!.hp > 0)
      n = attackEnemy(n, e.id, 'ritual', true);
    return n;
  }, s);
describe('Fractions Fighter campaign', () => {
  it('starts with a real class, equipment, safe village and five immediate threats', () => {
    const s = freshRpg('ranger', 'portrait-1');
    expect(s.zone).toBe('village');
    expect(s.avatarId).toBe('portrait-1');
    expect(s.enemies).toHaveLength(5);
    expect(combatStats(s).attack).toBe(14);
    expect(attackEnemy(s, s.enemies[0].id, 'strike', true)).toBe(s);
  });
  it('ordinary enemies take 1–3 short answers and hard rituals defeat the first boss outright', () => {
    for (const enemy of start().enemies.slice(0, 4)) {
      let s = start();
      let hits = 0;
      while (s.enemies.find((e) => e.id === enemy.id)!.hp > 0) {
        s = attackEnemy(s, enemy.id, 'strike', true);
        hits++;
      }
      expect(hits).toBeLessThanOrEqual(3);
    }
    const s = start();
    expect(attackEnemy(s, s.enemies[4].id, 'ritual', true).enemies[4].hp).toBe(0);
  });
  it('awards deterministic treasure once and equipping changes real stats', () => {
    const s = start();
    const n = attackEnemy(s, s.enemies[0].id, 'power', true);
    expect(s.enemies[0].hp).toBe(20);
    expect(n.xp).toBe(35);
    expect(n.gold).toBe(12);
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
    expect(n.hp).toBe(98);
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
    const rewarded = claimQuest(enterZone(s, 'village'));
    expect(rewarded.gold).toBe(197);
    expect(rewarded.xp).toBe(360);
    expect(combatStats(rewarded).level).toBe(4);
    expect(claimQuest(rewarded)).toBe(rewarded);
    const next = enterZone(rewarded, 'wilds');
    expect(next.expedition).toBe(2);
    expect(next.inventory).toEqual(s.inventory);
    expect(next.enemies.every((e) => e.hp === e.maxHp)).toBe(true);
    expect(questProgress(next).current).toBe(0);
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
    expect(next.gold).toBe(37);
    expect(next.lastReward).toContain('25 gold');
  });
});

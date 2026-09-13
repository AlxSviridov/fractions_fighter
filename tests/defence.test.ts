import { describe, expect, it } from 'vitest';
import { defencePreview, resolveDefence } from '../src/game/defence';
import { enterZone, equipItem, freshRpg, lootFor } from '../src/game/rpg';

const wilds = () => enterZone(freshRpg(), 'wilds');
const guardianId = 'e1-4';

describe('enemy defence', () => {
  it('shows armour absorption and lowers the damage from a hit', () => {
    const unarmoured = wilds();
    const armour = lootFor(1, 1);
    const armoured = equipItem(
      { ...unarmoured, inventory: [...unarmoured.inventory, armour] },
      armour.id,
    );

    expect(defencePreview(unarmoured, guardianId)).toEqual({ incoming: 11, armour: 3, damage: 8 });
    expect(defencePreview(armoured, guardianId)).toEqual({ incoming: 11, armour: 7, damage: 4 });
  });

  it('treats a block as an idempotent no-reward outcome', () => {
    const state = wilds();
    const blocked = resolveDefence(state, guardianId, 'blocked');

    expect(blocked).toBe(state);
    expect(resolveDefence(blocked, guardianId, 'blocked')).toBe(state);
    expect(blocked).toMatchObject({
      hp: state.hp,
      xp: state.xp,
      gold: state.gold,
      defeated: state.defeated,
    });
  });

  it('rescues a fighter whose health reaches zero without granting combat rewards', () => {
    const state = { ...wilds(), hp: 8, potions: 0 };
    const rescued = resolveDefence(state, guardianId, 'hit');

    expect(rescued).toMatchObject({
      zone: 'village',
      hp: 100,
      potions: 3,
      xp: state.xp,
      gold: state.gold,
      defeated: state.defeated,
    });
  });

  it('ignores village, missing, and defeated enemies', () => {
    const village = freshRpg();
    const wild = wilds();
    const defeated = {
      ...wild,
      enemies: wild.enemies.map((enemy) => (enemy.id === guardianId ? { ...enemy, hp: 0 } : enemy)),
    };

    expect(resolveDefence(village, guardianId, 'hit')).toBe(village);
    expect(resolveDefence(wild, 'not-an-enemy', 'hit')).toBe(wild);
    expect(resolveDefence(defeated, guardianId, 'hit')).toBe(defeated);
  });
});

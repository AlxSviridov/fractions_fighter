import { describe, expect, it } from 'vitest';
import { freshSave } from '../src/game/state';
import { validateSave } from '../src/game/save';
import {
  attackEnemy,
  enterZone,
  equipItem,
  freshRpg,
  unequipItem,
  validateRpg,
} from '../src/game/rpg';

function legacyCollection() {
  const state = freshRpg();
  const { inventoryLayout: _layout, ...legacy } = state;
  return {
    ...legacy,
    inventory: [
      state.inventory[0],
      ...Array.from({ length: 60 }, (_, i) => ({
        ...state.inventory[0],
        id: `legacy-armour-${i}`,
        slot: 'armour' as const,
      })),
    ],
  };
}

describe('spatial inventory save integration', () => {
  it('migrates legacy collections without losing overflow or changing combat progress', () => {
    const legacy = legacyCollection();
    const migrated = validateRpg(legacy);
    const stored = [
      ...Object.keys(migrated.inventoryLayout.pack),
      ...migrated.inventoryLayout.stash,
    ];
    expect(migrated.inventory.map((i) => i.id)).toEqual(legacy.inventory.map((i) => i.id));
    expect(stored).toHaveLength(60);
    expect(new Set(stored).size).toBe(60);
    expect(stored).not.toContain('starter-weapon');
    // A 2×3 armour footprint permits only one row of five items in 10×4 cells.
    expect(Object.keys(migrated.inventoryLayout.pack)).toHaveLength(5);
    expect(migrated.inventoryLayout.stash).toHaveLength(55);
    expect(migrated.enemies).toEqual(legacy.enemies);
    expect(migrated.gold).toBe(legacy.gold);
    expect(validateRpg(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });

  it('migrates through the public save validator and rejects corrupted layouts', () => {
    const save = { ...freshSave(42), rpg: legacyCollection() };
    const migrated = validateSave(save);
    expect(validateSave(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
    expect(() =>
      validateSave({
        ...migrated,
        rpg: { ...migrated.rpg, inventoryLayout: { version: 2, pack: {}, stash: [] } },
      }),
    ).toThrow();
    expect(() =>
      validateSave({
        ...migrated,
        rpg: { ...migrated.rpg, inventoryLayout: { version: 1, pack: {}, stash: [] } },
      }),
    ).toThrow();
  });

  it('keeps layout valid after combat rewards, equipment swaps and unequipping', () => {
    const initial = enterZone(freshRpg(), 'wilds');
    const rewarded = attackEnemy(initial, initial.enemies[0].id, 'power', true);
    expect(Object.keys(rewarded.inventoryLayout.pack)).toEqual(['loot-1-0']);
    const equipped = equipItem(rewarded, 'loot-1-0');
    expect(Object.keys(equipped.inventoryLayout.pack)).toEqual(['starter-weapon']);
    const stored = unequipItem(equipped, 'weapon');
    expect(Object.keys(stored.inventoryLayout.pack).sort()).toEqual(['loot-1-0', 'starter-weapon']);
    for (const state of [initial, rewarded, equipped, stored]) {
      expect(validateRpg(JSON.parse(JSON.stringify(state)))).toEqual(state);
    }
    expect(stored.inventory).toEqual(rewarded.inventory);
  });
});

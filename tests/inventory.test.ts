import { describe, expect, it } from 'vitest';
import {
  combatStats,
  equipmentPreview,
  equipItem,
  freshRpg,
  lootFor,
  statBreakdown,
  unequipItem,
} from '../src/game/rpg';

describe('character equipment sheet', () => {
  it('breaks live combat statistics into base, level and equipment contributions', () => {
    const state = { ...freshRpg('warden'), xp: 250 };

    expect(statBreakdown(state)).toMatchObject({
      level: 3,
      xpIntoLevel: 10,
      xpForNextLevel: 120,
      attack: { base: 10, level: 4, equipment: 2, total: 16 },
      defence: { base: 3, equipment: 0, total: 3 },
      maxHp: 116,
    });
    expect(combatStats(state)).toEqual({ level: 3, attack: 16, defence: 3, maxHp: 116 });
  });

  it('previews every real stat affected by a replacement without mutating the campaign', () => {
    const state = freshRpg();
    const weapon = lootFor(1, 0);
    const preview = equipmentPreview(
      { ...state, inventory: [...state.inventory, weapon] },
      weapon.id,
    );

    expect(preview).toMatchObject({
      item: weapon,
      replaced: state.inventory[0],
      current: { attack: 12, defence: 3, maxHp: 100 },
      next: { attack: 14, defence: 3, maxHp: 100 },
    });
    expect(state.equipment.weapon).toBe('starter-weapon');
  });

  it('shows both sides of an equipment tradeoff and caps the XP bar', () => {
    const state = freshRpg();
    const hybrid = { ...state.inventory[0], id: 'guard-blade', attack: 1, defence: 5 };
    const preview = equipmentPreview(
      { ...state, inventory: [...state.inventory, hybrid] },
      hybrid.id,
    );
    expect(preview?.next).toEqual({ level: 1, attack: 11, defence: 8, maxHp: 100 });
    expect(equipmentPreview(state, 'missing')).toBeNull();
    expect(statBreakdown({ ...state, xp: 1e9 })).toMatchObject({
      level: 100,
      xpIntoLevel: 120,
      xpForNextLevel: 0,
    });
  });

  it('equips and unequips without deleting either the equipped item or its replacement', () => {
    const state = freshRpg();
    const weapon = lootFor(1, 0);
    const carried = { ...state, inventory: [...state.inventory, weapon] };
    const equipped = equipItem(carried, weapon.id);
    const unequipped = unequipItem(equipped, 'weapon');

    expect(equipped.equipment.weapon).toBe(weapon.id);
    expect(equipped.inventory.map((item) => item.id)).toEqual(['starter-weapon', weapon.id]);
    expect(unequipped.equipment.weapon).toBeNull();
    expect(unequipped.inventory.map((item) => item.id)).toEqual(['starter-weapon', weapon.id]);
    expect(combatStats(unequipped)).toMatchObject({ attack: 10, defence: 3 });
    expect(unequipItem(unequipped, 'weapon')).toBe(unequipped);
  });
});

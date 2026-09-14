import { describe, expect, it } from 'vitest';
import {
  itemSize,
  moveInventoryItem,
  reconcileInventory,
  validateInventoryLayout,
} from '../src/game/inventory';
import type { Item, ItemSlot } from '../src/game/rpg';

const equipment = (overrides: Partial<Record<ItemSlot, string | null>> = {}) => ({
  weapon: null,
  armour: null,
  relic: null,
  ...overrides,
});
const item = (id: string, slot: ItemSlot = 'relic'): Item => ({
  id,
  name: id,
  slot,
  rarity: 'common',
  attack: 0,
  defence: 0,
  topic: 'fractions',
  description: id,
});

describe('spatial inventory domain', () => {
  it('uses stable item footprints', () => {
    expect(itemSize(item('blade', 'weapon'))).toEqual({ width: 1, height: 3 });
    expect(itemSize(item('mail', 'armour'))).toEqual({ width: 2, height: 3 });
    expect(itemSize(item('charm'))).toEqual({ width: 1, height: 1 });
  });

  it('reconciles legacy ownership without loss and keeps existing stash entries in the stash', () => {
    const blade = item('blade', 'weapon');
    const mail = item('mail', 'armour');
    const charm = item('charm');
    const layout = reconcileInventory([blade, mail, charm], equipment({ weapon: 'blade' }), {
      version: 1,
      pack: { mail: { x: 8, y: 0 }, blade: { x: 0, y: 0 } },
      stash: ['charm'],
    });

    expect(layout).toEqual({ version: 1, pack: { mail: { x: 8, y: 0 } }, stash: ['charm'] });
    expect(
      reconcileInventory([blade, mail, charm], equipment({ weapon: 'blade' }), layout),
    ).toEqual(layout);
  });

  it('uses first fit then stashes legacy overflow instead of deleting it', () => {
    const inventory = Array.from({ length: 41 }, (_, index) => item(`relic-${index}`));
    const layout = reconcileInventory(inventory, equipment());

    expect(Object.keys(layout.pack)).toHaveLength(40);
    expect(layout.stash).toEqual(['relic-40']);
    expect(new Set([...Object.keys(layout.pack), ...layout.stash])).toEqual(
      new Set(inventory.map((candidate) => candidate.id)),
    );
  });

  it('rejects hostile layouts with missing, equipped, out-of-bounds, duplicate, or overlapping IDs', () => {
    const blade = item('blade', 'weapon');
    const mail = item('mail', 'armour');
    const charm = item('charm');
    const inventory = [blade, mail, charm];

    const invalid = [
      { version: 1, pack: { blade: { x: 0, y: 2 }, mail: { x: 2, y: 0 } }, stash: ['charm'] },
      { version: 1, pack: { blade: { x: 0, y: 0 }, mail: { x: 0, y: 0 } }, stash: ['charm'] },
      {
        version: 1,
        pack: { blade: { x: 0, y: 0 }, mail: { x: 2, y: 0 } },
        stash: ['blade', 'charm'],
      },
      { version: 1, pack: { blade: { x: 0, y: 0 }, mail: { x: 2, y: 0 } }, stash: [] },
      { version: 2, pack: {}, stash: [] },
    ];
    for (const candidate of invalid)
      expect(() => validateInventoryLayout(candidate, inventory, equipment())).toThrow(
        'Inventory layout is invalid.',
      );
    expect(() =>
      validateInventoryLayout(
        { version: 1, pack: { blade: { x: 0, y: 0 }, mail: { x: 2, y: 0 } }, stash: ['charm'] },
        inventory,
        equipment({ weapon: 'blade' }),
      ),
    ).toThrow('Inventory layout is invalid.');
  });

  it('moves to pack or stash atomically and swaps only when the reverse placement fits', () => {
    const first = item('first');
    const second = item('second');
    const layout = {
      version: 1 as const,
      pack: { first: { x: 0, y: 0 }, second: { x: 1, y: 0 } },
      stash: [],
    };
    const swapped = moveInventoryItem(layout, [first, second], equipment(), 'first', {
      kind: 'pack',
      x: 1,
      y: 0,
    });
    expect(swapped).toEqual({
      version: 1,
      pack: { second: { x: 0, y: 0 }, first: { x: 1, y: 0 } },
      stash: [],
    });
    expect(layout.pack).toEqual({ first: { x: 0, y: 0 }, second: { x: 1, y: 0 } });
    expect(
      moveInventoryItem(swapped, [first, second], equipment(), 'first', { kind: 'stash' }),
    ).toEqual({ version: 1, pack: { second: { x: 0, y: 0 } }, stash: ['first'] });

    const blade = item('blade', 'weapon');
    const mail = item('mail', 'armour');
    const noReverseFit = {
      version: 1 as const,
      pack: { blade: { x: 9, y: 0 }, mail: { x: 7, y: 0 } },
      stash: [],
    };
    expect(
      moveInventoryItem(noReverseFit, [blade, mail], equipment(), 'blade', {
        kind: 'pack',
        x: 7,
        y: 0,
      }),
    ).toBe(noReverseFit);

    const reverseOverlap = {
      version: 1 as const,
      pack: { blade: { x: 0, y: 0 }, mail: { x: 1, y: 0 } },
      stash: [],
    };
    expect(
      moveInventoryItem(reverseOverlap, [blade, mail], equipment(), 'blade', {
        kind: 'pack',
        x: 1,
        y: 0,
      }),
    ).toBe(reverseOverlap);
  });

  it('rejects invalid commands with the original layout and can place a stashed item in free space', () => {
    const charm = item('charm');
    const layout = { version: 1 as const, pack: {}, stash: ['charm'] };
    expect(
      moveInventoryItem(layout, [charm], equipment(), 'charm', { kind: 'pack', x: 0, y: 0 }),
    ).toEqual({ version: 1, pack: { charm: { x: 0, y: 0 } }, stash: [] });
    expect(
      moveInventoryItem(layout, [charm], equipment({ relic: 'charm' }), 'charm', {
        kind: 'pack',
        x: 0,
        y: 0,
      }),
    ).toBe(layout);
    expect(
      moveInventoryItem(layout, [charm], equipment(), 'charm', { kind: 'pack', x: 10, y: 0 }),
    ).toBe(layout);
  });

  it('preserves hostile-but-valid item IDs as ordinary owned entries', () => {
    const hostile = item('__proto__');
    const layout = reconcileInventory([hostile], equipment());

    expect(Object.hasOwn(layout.pack, '__proto__')).toBe(true);
    expect(validateInventoryLayout(layout, [hostile], equipment())).toEqual(layout);
    expect(
      moveInventoryItem(layout, [hostile], equipment(), '__proto__', { kind: 'stash' }),
    ).toEqual({ version: 1, pack: {}, stash: ['__proto__'] });

    const inheritedName = item('constructor');
    const stashed = { version: 1 as const, pack: {}, stash: ['constructor'] };
    expect(
      moveInventoryItem(stashed, [inheritedName], equipment(), 'constructor', {
        kind: 'pack',
        x: 0,
        y: 0,
      }),
    ).toEqual({ version: 1, pack: { constructor: { x: 0, y: 0 } }, stash: [] });
  });
});

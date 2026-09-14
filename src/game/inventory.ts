/** Pure 10 × 4 backpack placement rules. Item ownership remains in the RPG inventory list. */
import type { Item, ItemSlot } from './rpg';

export const PACK_WIDTH = 10;
export const PACK_HEIGHT = 4;

export type PackPosition = { x: number; y: number };
export type InventoryLayout = {
  version: 1;
  pack: Record<string, PackPosition>;
  stash: string[];
};
export type InventoryDestination = { kind: 'pack'; x: number; y: number } | { kind: 'stash' };

export function itemSize(item: Item) {
  switch (item.slot) {
    case 'weapon':
      return { width: 1, height: 3 };
    case 'armour':
      return { width: 2, height: 3 };
    case 'relic':
      return { width: 1, height: 1 };
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const isPosition = (value: unknown): value is PackPosition =>
  isObject(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
/** Item IDs are save data and may be names such as `__proto__`; never assign them to `{}`. */
const emptyPack = (): Record<string, PackPosition> =>
  Object.create(null) as Record<string, PackPosition>;
const copyPack = (pack: Record<string, PackPosition>) =>
  Object.fromEntries(
    Object.entries(pack).map(([id, position]) => [id, { x: position.x, y: position.y }]),
  ) as Record<string, PackPosition>;
const withoutPackItem = (pack: Record<string, PackPosition>, itemId: string) =>
  Object.fromEntries(Object.entries(pack).filter(([id]) => id !== itemId)) as Record<
    string,
    PackPosition
  >;
const withPackItem = (pack: Record<string, PackPosition>, itemId: string, position: PackPosition) =>
  Object.fromEntries([
    ...Object.entries(pack).filter(([id]) => id !== itemId),
    [itemId, { x: position.x, y: position.y }],
  ]) as Record<string, PackPosition>;
const idAt = (equipment: Record<ItemSlot, string | null>) => new Set(Object.values(equipment));
const storedItems = (inventory: Item[], equipment: Record<ItemSlot, string | null>) => {
  const equipped = idAt(equipment);
  return inventory.filter((item) => !equipped.has(item.id));
};
const fitsBounds = (item: Item, position: PackPosition) => {
  const size = itemSize(item);
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.width <= PACK_WIDTH &&
    position.y + size.height <= PACK_HEIGHT
  );
};
const overlaps = (a: Item, aPosition: PackPosition, b: Item, bPosition: PackPosition) => {
  const aSize = itemSize(a);
  const bSize = itemSize(b);
  return (
    aPosition.x < bPosition.x + bSize.width &&
    aPosition.x + aSize.width > bPosition.x &&
    aPosition.y < bPosition.y + bSize.height &&
    aPosition.y + aSize.height > bPosition.y
  );
};
const firstFit = (item: Item, pack: Record<string, PackPosition>, itemsById: Map<string, Item>) => {
  for (let y = 0; y < PACK_HEIGHT; y += 1) {
    for (let x = 0; x < PACK_WIDTH; x += 1) {
      const position = { x, y };
      if (
        fitsBounds(item, position) &&
        !Object.entries(pack).some(([id, occupied]) =>
          overlaps(item, position, itemsById.get(id)!, occupied),
        )
      )
        return position;
    }
  }
  return null;
};

/**
 * Converts legacy list ownership into a deterministic spatial layout without dropping IDs.
 * Stash entries have priority so an existing Haven overflow collection never jumps into the pack.
 */
export function reconcileInventory(
  inventory: Item[],
  equipment: Record<ItemSlot, string | null>,
  previous?: InventoryLayout,
): InventoryLayout {
  const items = storedItems(inventory, equipment);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const stash: string[] = [];
  const seen = new Set<string>();
  const priorStash = Array.isArray(previous?.stash) ? previous.stash : [];

  for (const id of priorStash) {
    if (typeof id === 'string' && itemsById.has(id) && !seen.has(id)) {
      stash.push(id);
      seen.add(id);
    }
  }

  const pack = emptyPack();
  const priorPack = isObject(previous?.pack) ? previous.pack : {};
  for (const [id, position] of Object.entries(priorPack)) {
    const item = itemsById.get(id);
    if (
      item &&
      !seen.has(id) &&
      isPosition(position) &&
      fitsBounds(item, position) &&
      !Object.entries(pack).some(([otherId, otherPosition]) =>
        overlaps(item, position, itemsById.get(otherId)!, otherPosition),
      )
    ) {
      pack[id] = { x: position.x, y: position.y };
      seen.add(id);
    }
  }

  for (const item of items) {
    if (seen.has(item.id)) continue;
    const position = firstFit(item, pack, itemsById);
    if (position) pack[item.id] = position;
    else stash.push(item.id);
    seen.add(item.id);
  }
  return { version: 1, pack: copyPack(pack), stash };
}

/** Reject malformed layouts rather than allowing a save to overlap or lose a stored item. */
export function validateInventoryLayout(
  raw: unknown,
  inventory: Item[],
  equipment: Record<ItemSlot, string | null>,
): InventoryLayout {
  const fail = (): never => {
    throw new Error('Inventory layout is invalid.');
  };
  if (!isObject(raw) || raw.version !== 1 || !isObject(raw.pack) || !Array.isArray(raw.stash))
    return fail();

  const items = storedItems(inventory, equipment);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  if (itemsById.size !== items.length) return fail();
  const pack = emptyPack();
  const seen = new Set<string>();

  for (const [id, position] of Object.entries(raw.pack)) {
    const item = itemsById.get(id);
    if (!item || seen.has(id) || !isPosition(position) || !fitsBounds(item, position))
      return fail();
    if (
      Object.entries(pack).some(([otherId, otherPosition]) =>
        overlaps(item, position, itemsById.get(otherId)!, otherPosition),
      )
    )
      return fail();
    pack[id] = { x: position.x, y: position.y };
    seen.add(id);
  }

  const stash: string[] = [];
  for (const id of raw.stash) {
    if (typeof id !== 'string' || !itemsById.has(id) || seen.has(id)) return fail();
    stash.push(id);
    seen.add(id);
  }
  if (seen.size !== items.length) return fail();
  return { version: 1, pack: copyPack(pack), stash };
}

/**
 * Applies a single validated placement. A pack drop may swap exactly one item when the old
 * position can hold it; no state changes until this command is accepted, so cancel is a no-op.
 */
export function moveInventoryItem(
  layout: InventoryLayout,
  inventory: Item[],
  equipment: Record<ItemSlot, string | null>,
  itemId: string,
  destination: InventoryDestination,
): InventoryLayout {
  let valid: InventoryLayout;
  try {
    valid = validateInventoryLayout(layout, inventory, equipment);
  } catch {
    return layout;
  }
  const itemsById = new Map(storedItems(inventory, equipment).map((item) => [item.id, item]));
  const item = itemsById.get(itemId);
  if (!item) return layout;
  const origin = Object.hasOwn(valid.pack, itemId) ? valid.pack[itemId] : undefined;
  const inStash = valid.stash.includes(itemId);
  if (!origin && !inStash) return layout;

  if (destination.kind === 'stash') {
    if (inStash) return layout;
    const pack = withoutPackItem(valid.pack, itemId);
    return { version: 1, pack, stash: [...valid.stash, itemId] };
  }
  if (!isPosition(destination) || !fitsBounds(item, destination)) return layout;
  if (origin?.x === destination.x && origin.y === destination.y) return layout;

  let pack = withoutPackItem(valid.pack, itemId);
  const collided = Object.entries(pack).filter(([id, position]) =>
    overlaps(item, destination, itemsById.get(id)!, position),
  );
  if (collided.length > 1) return layout;
  if (collided.length === 1) {
    if (!origin) return layout;
    const [otherId] = collided[0];
    const other = itemsById.get(otherId)!;
    pack = withoutPackItem(pack, otherId);
    if (
      !fitsBounds(other, origin) ||
      overlaps(item, destination, other, origin) ||
      Object.entries(pack).some(([id, position]) =>
        overlaps(other, origin, itemsById.get(id)!, position),
      )
    )
      return layout;
    pack = withPackItem(pack, otherId, origin);
  }
  pack = withPackItem(pack, itemId, destination);
  return {
    version: 1,
    pack,
    stash: inStash ? valid.stash.filter((id) => id !== itemId) : valid.stash,
  };
}

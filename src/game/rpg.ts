/** Fractions Fighter: serialisable, renderer-independent adventure rules. */
import type { Topic } from './math';
import { moveInventoryItem, reconcileInventory, validateInventoryLayout } from './inventory';
import type { InventoryDestination, InventoryLayout } from './inventory';
import {
  ENEMY_DEFINITIONS,
  GATES,
  OBJECTIVES,
  enemyAccessible,
  makeLoot,
  objectAvailable,
  objectById,
  openGates,
} from './level';
import type { EnemyKey, GateId, LevelView, RegionId } from './level';
export { ENEMY_DEFINITIONS } from './level';

export type ClassId = 'warden' | 'ranger' | 'arcanist';
export type Zone = 'village' | 'wilds';
export type CombatAction = 'strike' | 'power' | 'ritual';
export type ItemSlot = 'weapon' | 'armour' | 'relic';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type Item = {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  attack: number;
  defence: number;
  topic: Topic;
  description: string;
};
export type Enemy = {
  id: string;
  /** Stable level-design identity; `id` also carries the expedition. */
  key: EnemyKey;
  region: RegionId;
  rank: 'minion' | 'elite' | 'boss';
  /** Readable wind-up line shown when this enemy telegraphs an attack. */
  tell: string;
  name: string;
  kind: 'beast' | 'pirate' | 'guardian' | 'spirit';
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  attack: number;
  xp: number;
  gold: number;
  topic: Topic;
};
export type RpgState = {
  version: 1;
  classId: ClassId;
  avatarId: string;
  zone: Zone;
  expedition: number;
  hp: number;
  xp: number;
  gold: number;
  potions: number;
  inventory: Item[];
  inventoryLayout: InventoryLayout;
  equipment: Record<ItemSlot, string | null>;
  enemies: Enemy[];
  defeated: number;
  /** Level objects (chests, locks, seals, lore) resolved; see level.ts persistence rules. */
  resolved: string[];
  questClaimed: boolean;
  lastReward: string;
};
export const CLASSES: Record<
  ClassId,
  {
    name: string;
    title: string;
    description: string;
    weapon: string;
    attack: number;
    defence: number;
    maxHp: number;
    colour: string;
  }
> = {
  warden: {
    name: 'Warden',
    title: 'The shield of the expedition',
    description: 'A fearless guardian with a broad blade, heavy armour and a protective ward.',
    weapon: 'Wayfarer blade',
    attack: 10,
    defence: 3,
    maxHp: 100,
    colour: '#d5ad68',
  },
  ranger: {
    name: 'Ranger',
    title: 'The arrow in the canopy',
    description: 'A swift pathfinder with a jungle bow, hooded cloak and keen instincts.',
    weapon: 'Canopy bow',
    attack: 12,
    defence: 1,
    maxHp: 85,
    colour: '#84bd93',
  },
  arcanist: {
    name: 'Arcanist',
    title: 'The keeper of lost patterns',
    description: 'A relic wielder with a crystal staff, flowing robes and ancient magic.',
    weapon: 'Pattern staff',
    attack: 11,
    defence: 2,
    maxHp: 90,
    colour: '#92adf1',
  },
};
export const ACTIONS: Record<
  CombatAction,
  { name: string; multiplier: number; description: string }
> = {
  strike: {
    name: 'Quick strike',
    multiplier: 1,
    description: 'An easy comparison powers one fast attack.',
  },
  power: {
    name: 'Power skill',
    multiplier: 3,
    description: 'A calculation unleashes three times your attack.',
  },
  ritual: {
    name: 'Ancient ritual',
    multiplier: 7,
    description: 'A demanding problem unleashes seven times your attack. Take your time.',
  },
};
export const STORY =
  'The world compass has shattered into fractions. Following a mysterious map, you reach Haven, the last safe village beyond the waterfall. Become a Fractions Fighter: master the lost patterns, reclaim the compass pieces, and unite the hidden world.';
export const QUEST = {
  name: 'The Broken Compass',
  giver: 'Scout Mira',
  description:
    'Follow the Emerald Trail north. Lower the rope bridge, break into Captain Redsail’s stockade, unseal the ancient sanctum and overcome the Shard Guardian. Bring the compass fragment back to Mira in Haven.',
  gold: 80,
  xp: 100,
};
const TOPICS: Topic[] = ['fractions', 'multiplication', 'geometry', 'percentages', 'division'];
const makeEnemies = (expedition: number): Enemy[] =>
  ENEMY_DEFINITIONS.map(({ loot: _loot, ...e }, i) => {
    const scale = Math.min(expedition - 1, 20);
    const maxHp = e.maxHp + scale * 3;
    return {
      ...e,
      id: `e${expedition}-${i}`,
      maxHp,
      hp: maxHp,
      attack: e.attack + Math.floor(scale / 3),
    };
  });
/** Level progress view: resolved objects and defeated enemy keys. */
export const levelView = (s: Pick<RpgState, 'resolved' | 'enemies'>): LevelView => ({
  resolved: s.resolved,
  defeated: s.enemies.filter((e) => e.hp === 0).map((e) => e.key),
});
/** Character class and portrait are selected before creating the campaign. */
export function freshRpg(classId: ClassId = 'warden', avatarId = '7'): RpgState {
  const starter: Item = {
    id: 'starter-weapon',
    name: CLASSES[classId].weapon,
    slot: 'weapon',
    rarity: 'common',
    attack: 2,
    defence: 0,
    topic: 'fractions',
    description: 'A trusted first weapon. All classes can equip every treasure.',
  };
  return {
    version: 1,
    classId,
    avatarId,
    zone: 'village',
    expedition: 1,
    hp: CLASSES[classId].maxHp,
    xp: 0,
    gold: 0,
    potions: 3,
    inventory: [starter],
    inventoryLayout: { version: 1, pack: {}, stash: [] },
    equipment: { weapon: starter.id, armour: null, relic: null },
    enemies: makeEnemies(1),
    defeated: 0,
    resolved: [],
    questClaimed: false,
    lastReward: 'Welcome to Haven. Scout Mira has a mission for you.',
  };
}
export function combatStats(s: RpgState) {
  const breakdown = statBreakdown(s);
  return {
    level: breakdown.level,
    attack: breakdown.attack.total,
    defence: breakdown.defence.total,
    maxHp: breakdown.maxHp,
  };
}
export type StatBreakdown = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  attack: { base: number; level: number; equipment: number; total: number };
  defence: { base: number; equipment: number; total: number };
  maxHp: number;
};
/** All displayed character-sheet values derive from rules that combat actually uses. */
export function statBreakdown(s: RpgState): StatBreakdown {
  const level = Math.min(100, 1 + Math.floor(s.xp / 120));
  const equipped = s.inventory.filter((i) => s.equipment[i.slot] === i.id);
  const baseAttack = CLASSES[s.classId].attack;
  const levelAttack = (level - 1) * 2;
  const equipmentAttack = equipped.reduce((n, i) => n + i.attack, 0);
  const baseDefence = CLASSES[s.classId].defence;
  const equipmentDefence = equipped.reduce((n, i) => n + i.defence, 0);
  return {
    level,
    xpIntoLevel: level === 100 ? 120 : s.xp % 120,
    xpForNextLevel: level === 100 ? 0 : 120,
    attack: {
      base: baseAttack,
      level: levelAttack,
      equipment: equipmentAttack,
      total: baseAttack + levelAttack + equipmentAttack,
    },
    defence: {
      base: baseDefence,
      equipment: equipmentDefence,
      total: baseDefence + equipmentDefence,
    },
    maxHp: CLASSES[s.classId].maxHp + (level - 1) * 8,
  };
}
export type EquipmentPreview = {
  item: Item;
  replaced: Item | null;
  current: ReturnType<typeof combatStats>;
  next: ReturnType<typeof combatStats>;
};
/** Preview uses the same atomic equipment transition as the eventual equip action. */
export function equipmentPreview(s: RpgState, itemId: string): EquipmentPreview | null {
  const item = s.inventory.find((candidate) => candidate.id === itemId);
  if (!item) return null;
  const replacedId = s.equipment[item.slot];
  return {
    item,
    replaced: s.inventory.find((candidate) => candidate.id === replacedId) ?? null,
    current: combatStats(s),
    next: combatStats({ ...s, equipment: { ...s.equipment, [item.slot]: item.id } }),
  };
}
/** The quest is complete when the guardian falls; optional threats and treasure stay optional. */
export function questProgress(s: RpgState) {
  const view = levelView(s);
  const current = OBJECTIVES.filter((o) => o.done(view)).length;
  const guardian = s.enemies.find((e) => e.rank === 'boss');
  return {
    current,
    target: OBJECTIVES.length,
    ready: !!guardian && guardian.hp === 0 && !s.questClaimed,
    claimed: s.questClaimed,
  };
}
/** Loot is guaranteed, reproducible and rotates topic affinity between expeditions. */
export function lootFor(expedition: number, enemyIndex: number): Item {
  const spec = ENEMY_DEFINITIONS[enemyIndex].loot;
  const topic = TOPICS[(enemyIndex + expedition - 1) % TOPICS.length];
  return makeLoot({ ...spec, topic }, `trail-${expedition}-${enemyIndex}`, expedition);
}
/** Item id for a chest reward; story objects never repeat so they need no expedition. */
export const objectLootId = (expedition: number, objectId: string) =>
  `cache-${expedition}-${objectId}`;
const MAX_ITEMS = 200;
function grantItem(s: RpgState, item: Item): { state: RpgState; note: string } {
  if (s.inventory.some((i) => i.id === item.id)) return { state: s, note: '' };
  if (s.inventory.length >= MAX_ITEMS)
    return {
      state: { ...s, gold: Math.min(1e9, s.gold + 25) },
      note: 'Pack full: treasure exchanged for 25 gold',
    };
  const inventory = [...s.inventory, item];
  return {
    state: {
      ...s,
      inventory,
      inventoryLayout: reconcileInventory(inventory, s.equipment, s.inventoryLayout),
    },
    note: `${item.name} found`,
  };
}
function newlyOpened(before: Set<GateId>, after: Set<GateId>) {
  return GATES.filter((g) => after.has(g.id) && !before.has(g.id));
}
function withLevelUp(before: RpgState, next: RpgState): RpgState {
  if (combatStats(next).level <= combatStats(before).level) return next;
  return {
    ...next,
    hp: combatStats(next).maxHp,
    lastReward: `${next.lastReward} LEVEL UP — ${combatStats(next).level}! Health restored.`,
  };
}
export type ObjectCheck =
  | { ok: true }
  | { ok: false; reason: 'unknown' | 'village' | 'resolved' | 'locked'; message: string };
/** Why an object can or cannot be used right now; the UI shows the message verbatim. */
export function objectStatus(s: RpgState, objectId: string): ObjectCheck {
  const object = objectById(objectId);
  if (!object) return { ok: false, reason: 'unknown', message: 'Nothing to do here.' };
  if (s.zone !== 'wilds')
    return { ok: false, reason: 'village', message: 'That is out on the trail.' };
  if (s.resolved.includes(object.id))
    return {
      ok: false,
      reason: 'resolved',
      message: object.kind === 'lore' ? 'You have already read this.' : 'Already done.',
    };
  if (!objectAvailable(object, levelView(s)))
    return {
      ok: false,
      reason: 'locked',
      message: object.lockedHint ?? 'You cannot reach that yet.',
    };
  return { ok: true };
}
/**
 * Resolve a level object once. The caller verifies any maths; a failed answer
 * never costs health or spends the object, so the player can retry freely.
 */
export function interactObject(s: RpgState, objectId: string, success = true): RpgState {
  const object = objectById(objectId);
  if (!object || !objectStatus(s, objectId).ok) return s;
  if (!success)
    return {
      ...s,
      lastReward: `${object.name} stays shut. Nothing is lost — check your working or use a hint.`,
    };
  const before = openGates(levelView(s));
  const reward = object.reward;
  let next: RpgState = {
    ...s,
    resolved: [...s.resolved, object.id],
    xp: Math.min(1e9, s.xp + reward.xp),
    gold: Math.min(1e9, s.gold + reward.gold),
    potions: Math.min(1000, s.potions + (reward.potions ?? 0)),
    hp: reward.heal ? combatStats(s).maxHp : s.hp,
  };
  const notes = [object.successText];
  if (reward.xp) notes.push(`+${reward.xp} XP`);
  if (reward.gold) notes.push(`+${reward.gold} gold`);
  if (reward.potions) notes.push(`+${reward.potions} draught`);
  if (reward.loot) {
    const granted = grantItem(
      next,
      makeLoot(reward.loot, objectLootId(s.expedition, object.id), s.expedition),
    );
    next = granted.state;
    if (granted.note) notes.push(granted.note);
  }
  for (const gate of newlyOpened(before, openGates(levelView(next)))) notes.push(gate.openedText);
  return withLevelUp(s, { ...next, lastReward: notes.join(' · ') });
}
/** Caller verifies the maths; unsuccessful answers never award or erase loot/XP. */
export function attackEnemy(
  s: RpgState,
  id: string,
  action: CombatAction,
  success: boolean,
): RpgState {
  const index = s.enemies.findIndex((e) => e.id === id);
  if (
    s.zone !== 'wilds' ||
    index < 0 ||
    s.enemies[index].hp === 0 ||
    !Object.hasOwn(ACTIONS, action) ||
    !enemyAccessible(s.enemies[index].key, levelView(s))
  )
    return s;
  const enemy = s.enemies[index];
  const stats = combatStats(s);
  if (!success) {
    const damage = Math.max(1, enemy.attack - stats.defence);
    if (s.hp <= damage)
      return {
        ...s,
        zone: 'village',
        hp: stats.maxHp,
        potions: Math.max(3, s.potions),
        lastReward:
          'Mira brought you safely back to Haven. Your loot and progress are safe; the trail remembers your victories.',
      };
    return {
      ...s,
      hp: s.hp - damage,
      lastReward: `Your ward absorbed most of the blow. −${damage} health. Try again or use a hint.`,
    };
  }
  const damage = stats.attack * ACTIONS[action].multiplier;
  const hp = Math.max(0, enemy.hp - damage);
  const enemies = s.enemies.map((e) => (e.id === id ? { ...e, hp } : e));
  if (hp > 0)
    return {
      ...s,
      enemies,
      lastReward: `${ACTIONS[action].name}: ${damage} damage! ${enemy.name} has ${hp} health left.`,
    };
  const before = openGates(levelView(s));
  const granted = grantItem(
    {
      ...s,
      enemies,
      xp: Math.min(1e9, s.xp + enemy.xp),
      gold: Math.min(1e9, s.gold + enemy.gold),
      defeated: Math.min(1e9, s.defeated + 1),
    },
    lootFor(s.expedition, index),
  );
  const gates = newlyOpened(before, openGates(levelView(granted.state))).map((g) => g.openedText);
  const next: RpgState = {
    ...granted.state,
    lastReward: [
      `${enemy.name} ${enemy.kind === 'beast' ? 'retreats' : 'defeated'}! +${enemy.xp} XP · +${enemy.gold} gold · ${granted.note}.`,
      ...gates,
    ].join(' '),
  };
  return withLevelUp(s, next);
}
export function equipItem(s: RpgState, itemId: string): RpgState {
  const item = s.inventory.find((i) => i.id === itemId);
  if (
    !item ||
    s.equipment[item.slot] === item.id ||
    (s.zone !== 'village' && s.inventoryLayout.stash.includes(item.id))
  )
    return s;
  return {
    ...s,
    equipment: { ...s.equipment, [item.slot]: item.id },
    inventoryLayout: reconcileInventory(
      s.inventory,
      { ...s.equipment, [item.slot]: item.id },
      s.inventoryLayout,
    ),
    lastReward: `${item.name} equipped.`,
  };
}
/** Unequipping only clears a slot: the item remains in the carried legacy inventory. */
export function unequipItem(s: RpgState, slot: ItemSlot): RpgState {
  const itemId = s.equipment[slot];
  if (!itemId) return s;
  const item = s.inventory.find((candidate) => candidate.id === itemId);
  if (!item) return s;
  return {
    ...s,
    equipment: { ...s.equipment, [slot]: null },
    inventoryLayout: reconcileInventory(
      s.inventory,
      { ...s.equipment, [slot]: null },
      s.inventoryLayout,
    ),
    lastReward: `${item.name} returned to your pack.`,
  };
}
/** Moves an owned, unequipped item between the spatial pack and Haven stash. */
export function moveStoredItem(
  s: RpgState,
  itemId: string,
  destination: InventoryDestination,
): RpgState {
  if (
    s.zone !== 'village' &&
    (destination.kind === 'stash' || s.inventoryLayout.stash.includes(itemId))
  )
    return s;
  const inventoryLayout = moveInventoryItem(
    s.inventoryLayout,
    s.inventory,
    s.equipment,
    itemId,
    destination,
  );
  return inventoryLayout === s.inventoryLayout ? s : { ...s, inventoryLayout };
}
export function usePotion(s: RpgState): RpgState {
  const maxHp = combatStats(s).maxHp;
  if (s.potions <= 0 || s.hp >= maxHp) return s;
  const hp = Math.min(maxHp, s.hp + Math.ceil(maxHp * 0.5));
  return { ...s, hp, potions: s.potions - 1, lastReward: `Healing draught: +${hp - s.hp} health.` };
}
/** Returning to Haven is free; completed trails refresh only after claiming the quest. */
export function enterZone(s: RpgState, zone: Zone): RpgState {
  if (zone === s.zone || !['village', 'wilds'].includes(zone)) return s;
  if (zone === 'village')
    return {
      ...s,
      zone,
      hp: combatStats(s).maxHp,
      potions: Math.max(3, s.potions),
      lastReward: 'Haven welcomes you. Health restored and healing draughts replenished.',
    };
  if (s.questClaimed && s.expedition < 1000000)
    return {
      ...s,
      zone,
      expedition: s.expedition + 1,
      enemies: makeEnemies(s.expedition + 1),
      // Story shortcuts (bridge, stockade lock, lore) persist; chests, shrine and seals reset.
      resolved: s.resolved.filter((id) => objectById(id)?.persistence === 'story'),
      questClaimed: false,
      lastReward:
        'A new compass fragment calls from the wilds. A fresh trail and new treasures await.',
    };
  return {
    ...s,
    zone,
    lastReward: 'Waterfall Landing. Follow Mira’s trail marks north — click the ground to move.',
  };
}
export function claimQuest(s: RpgState): RpgState {
  if (s.zone !== 'village' || !questProgress(s).ready) return s;
  const next = {
    ...s,
    questClaimed: true,
    xp: Math.min(1e9, s.xp + QUEST.xp),
    gold: Math.min(1e9, s.gold + QUEST.gold),
    lastReward: `Mira: “Another fraction of the compass is whole. You are a true Fractions Fighter!” +${QUEST.xp} XP · +${QUEST.gold} gold. Your next expedition awaits.`,
  };
  return { ...next, hp: combatStats(next).maxHp };
}

/** Validate imported campaign data and copy only the known schema. */
export function validateRpg(value: unknown): RpgState {
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v);
  const int = (v: unknown, min: number, max: number) =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
  const fail = (): never => {
    throw new Error('Adventure inventory or campaign progress is invalid.');
  };
  if (
    !object(value) ||
    value.version !== 1 ||
    typeof value.classId !== 'string' ||
    !Object.hasOwn(CLASSES, value.classId) ||
    typeof value.avatarId !== 'string' ||
    value.avatarId.length > 120 ||
    !value.avatarId.length ||
    !['village', 'wilds'].includes(value.zone as string) ||
    !int(value.expedition, 1, 1000000) ||
    !int(value.hp, 1, 10000) ||
    !int(value.xp, 0, 1e9) ||
    !int(value.gold, 0, 1e9) ||
    !int(value.potions, 0, 1000) ||
    !int(value.defeated, 0, 1e9) ||
    typeof value.questClaimed !== 'boolean' ||
    typeof value.lastReward !== 'string' ||
    value.lastReward.length > 1000 ||
    !Array.isArray(value.inventory) ||
    value.inventory.length < 1 ||
    value.inventory.length > 200 ||
    !object(value.equipment) ||
    !Array.isArray(value.enemies) ||
    (value.resolved !== undefined &&
      (!Array.isArray(value.resolved) ||
        value.resolved.some((id) => typeof id !== 'string' || !objectById(id)) ||
        new Set(value.resolved).size !== value.resolved.length))
  )
    return fail();
  const inventory: Item[] = value.inventory.map((raw) => {
    if (
      !object(raw) ||
      typeof raw.id !== 'string' ||
      !raw.id.length ||
      raw.id.length > 100 ||
      typeof raw.name !== 'string' ||
      !raw.name.length ||
      raw.name.length > 100 ||
      !['weapon', 'armour', 'relic'].includes(raw.slot as string) ||
      !['common', 'uncommon', 'rare', 'legendary'].includes(raw.rarity as string) ||
      !int(raw.attack, 0, 100) ||
      !int(raw.defence, 0, 100) ||
      !TOPICS.includes(raw.topic as Topic) ||
      typeof raw.description !== 'string' ||
      raw.description.length > 500
    )
      return fail();
    return {
      id: raw.id,
      name: raw.name,
      slot: raw.slot as ItemSlot,
      rarity: raw.rarity as Rarity,
      attack: raw.attack as number,
      defence: raw.defence as number,
      topic: raw.topic as Topic,
      description: raw.description,
    };
  });
  if (new Set(inventory.map((i) => i.id)).size !== inventory.length) return fail();
  const equipment = {} as RpgState['equipment'];
  for (const slot of ['weapon', 'armour', 'relic'] as ItemSlot[]) {
    const id = value.equipment[slot];
    if (
      id !== null &&
      (typeof id !== 'string' || !inventory.some((i) => i.id === id && i.slot === slot))
    )
      return fail();
    equipment[slot] = id as string | null;
  }
  const inventoryLayout =
    value.inventoryLayout === undefined
      ? reconcileInventory(inventory, equipment)
      : validateInventoryLayout(value.inventoryLayout, inventory, equipment);
  const expected = makeEnemies(value.expedition as number);
  // Saves from before the Emerald Trail level had five keyless enemies. Keep a
  // finished trail finished (so a ready quest stays claimable); otherwise the
  // new, longer trail starts fresh. Items, XP and gold are untouched.
  const legacyLayout =
    value.enemies.length === 5 &&
    value.enemies.every((raw) => object(raw) && raw.key === undefined && int(raw.hp, 0, 10000));
  const legacyCleared =
    legacyLayout && value.enemies.every((raw) => (raw as Record<string, unknown>).hp === 0);
  if (!legacyLayout && value.enemies.length !== ENEMY_DEFINITIONS.length) return fail();
  const enemies = legacyLayout
    ? expected.map((e) => ({ ...e, hp: legacyCleared ? 0 : e.maxHp }))
    : value.enemies.map((raw, i) => {
        const e = expected[i];
        if (
          !object(raw) ||
          !int(raw.hp, 0, e.maxHp) ||
          Object.keys(e).some((k) => k !== 'hp' && raw[k] !== e[k as keyof Enemy])
        )
          return fail();
        return { ...e, hp: raw.hp as number };
      });
  const resolved = legacyLayout ? [] : ((value.resolved as string[] | undefined) ?? []);
  const state: RpgState = {
    version: 1,
    classId: value.classId as ClassId,
    avatarId: value.avatarId,
    zone: value.zone as Zone,
    expedition: value.expedition as number,
    hp: value.hp as number,
    xp: value.xp as number,
    gold: value.gold as number,
    potions: value.potions as number,
    inventory,
    inventoryLayout,
    equipment,
    enemies,
    defeated: legacyCleared
      ? Math.max(value.defeated as number, enemies.length)
      : (value.defeated as number),
    resolved: [...resolved],
    questClaimed: value.questClaimed,
    lastReward: value.lastReward,
  };
  if (
    state.hp > combatStats(state).maxHp ||
    (state.questClaimed && !enemies.some((e) => e.rank === 'boss' && e.hp === 0)) ||
    state.defeated < enemies.filter((e) => e.hp === 0).length
  )
    return fail();
  return state;
}

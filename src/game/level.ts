/**
 * Chapter I level design: "The Emerald Trail".
 *
 * Pure, serialisable level data plus the navigation and progression rules that
 * both the renderer and the RPG state use. Nothing here touches Three.js or
 * React, so reachability, gates and objectives are unit-testable.
 *
 * Coordinates are world units. North is −z: the hero enters from Haven at the
 * south (z ≈ 15) and pushes north to the Shard Sanctuary (z ≈ −46).
 * See docs/LEVEL_DESIGN.md for the intent behind every beat.
 */
import type { Enemy, Item, ItemSlot, Rarity } from './rpg';
import type { Topic } from './math';
import type { TaskPoolId } from './taskBank';

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Point = { x: number; z: number };

export type RegionId =
  'landing' | 'hollow' | 'grotto' | 'ford' | 'stockade' | 'cove' | 'antechamber' | 'sanctum';
export type GateId = 'bridge' | 'stockade' | 'barricade' | 'sanctum';
export type EnemyKey =
  | 'prowler'
  | 'stalker'
  | 'boar'
  | 'raider'
  | 'cutter'
  | 'lookout'
  | 'captain'
  | 'sentinel'
  | 'guardian';

export type Region = {
  id: RegionId;
  name: string;
  subtitle: string;
  /** One sentence shown when the hero first steps in. */
  intro: string;
  rects: Rect[];
  /** Gates that must be open before any part of this region is reachable. */
  gates: GateId[];
  ground: string;
};

export type Gate = {
  id: GateId;
  name: string;
  /** Walkable only while open. It overlaps the two regions it joins. */
  rect: Rect;
  objects: string[];
  enemies: EnemyKey[];
  closedHint: string;
  openedText: string;
};

export type LevelObjectKind = 'chest' | 'puzzle' | 'lore' | 'shrine' | 'mechanism' | 'seal';
export type LootSpec = {
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  power: number;
  topic: Topic;
  description: string;
};
export type LevelObject = {
  id: string;
  kind: LevelObjectKind;
  name: string;
  region: RegionId;
  x: number;
  z: number;
  /** What the object looks like and why the player should care. */
  description: string;
  /** Untimed task pool from the reviewed task bank; absent means no maths. */
  task?: { pool: TaskPoolId; tier: 'focus' | 'ritual' };
  requires?: { enemies?: EnemyKey[]; objects?: string[] };
  lockedHint?: string;
  reward: { xp: number; gold: number; potions?: number; heal?: boolean; loot?: LootSpec };
  /** Story objects stay resolved across expeditions; expedition objects reset. */
  persistence: 'story' | 'expedition';
  successText: string;
};

export type EnemyDefinition = Omit<Enemy, 'id' | 'hp'> & { loot: LootSpec };

export const LEVEL_NAME = 'The Emerald Trail';
export const LEVEL_BOUNDS: Rect = { minX: -16, maxX: 16, minZ: -51, maxZ: 18 };
export const SPAWN: Point = { x: 0, z: 15 };
/** River band crossed only by the rope bridge. Purely visual; walkability comes from rects. */
export const RIVER: Rect = { minX: -40, maxX: 40, minZ: -12.9, maxZ: -8.1 };
export const INTERACT_RANGE = 1.9;
export const THREAT_RADIUS = 6;

const r = (minX: number, maxX: number, minZ: number, maxZ: number): Rect => ({
  minX,
  maxX,
  minZ,
  maxZ,
});

export const REGIONS: Region[] = [
  {
    id: 'landing',
    name: 'Waterfall Landing',
    subtitle: 'WHERE THE MAP BEGINS',
    intro: 'Spray from the falls. Mira’s trail marks lead north into the ferns.',
    rects: [r(-7, 7, 5, 17), r(-2.5, 2.5, 1.5, 5.5)],
    gates: [],
    ground: '#62754f',
  },
  {
    id: 'hollow',
    name: 'Fern Hollow',
    subtitle: 'THE RIVER BLOCKS THE WAY',
    intro: 'Something big has been rooting here. The rope bridge is raised.',
    rects: [r(-11, 6, -8, 2)],
    gates: [],
    ground: '#566c48',
  },
  {
    id: 'grotto',
    name: 'Mossy Grotto',
    subtitle: 'A HIDDEN DETOUR',
    intro: 'A cave mouth, half-swallowed by moss. Someone hid a cache here.',
    rects: [r(-15.5, -10.5, -6.5, -1.5)],
    gates: [],
    ground: '#4d6545',
  },
  {
    id: 'ford',
    name: 'Tide Ford',
    subtitle: 'CORSAIR TERRITORY',
    intro: 'Rope-cut trees and boot prints. The corsairs guard their side of the river.',
    rects: [r(-10, 10, -21, -13), r(-2, 2, -22.5, -20.5)],
    gates: ['bridge'],
    ground: '#5f7550',
  },
  {
    id: 'stockade',
    name: 'Corsair Stockade',
    subtitle: 'CAPTAIN REDSAIL’S CAMP',
    intro: 'Sharpened logs, red sails, and a captain who wants the compass for himself.',
    rects: [r(-9, 9, -33, -24.5)],
    gates: ['bridge', 'stockade'],
    ground: '#6b6a4c',
  },
  {
    id: 'cove',
    name: 'Sunken Cove',
    subtitle: 'OPTIONAL · A HARD-WON TREASURE',
    intro: 'Tide pools and a drowned chest. The lock is the hardest in the jungle.',
    rects: [r(8.5, 15.5, -31, -26)],
    gates: ['bridge', 'stockade'],
    ground: '#557260',
  },
  {
    id: 'antechamber',
    name: 'Sealed Antechamber',
    subtitle: 'THREE SEALS, ONE DOOR',
    intro: 'Ancient stones hum. Three seals hold the sanctum door shut.',
    rects: [r(-8, 8, -41, -33.5)],
    gates: ['bridge', 'stockade', 'barricade'],
    ground: '#7a7f63',
  },
  {
    id: 'sanctum',
    name: 'Shard Sanctuary',
    subtitle: 'THE COMPASS FRAGMENT',
    intro: 'The guardian wakes. The compass fragment burns in its chest.',
    rects: [r(-7, 7, -50, -41.5)],
    gates: ['bridge', 'stockade', 'barricade', 'sanctum'],
    ground: '#737a60',
  },
];

export const GATES: Gate[] = [
  {
    id: 'bridge',
    name: 'Rope Bridge',
    rect: r(-1.75, 1.75, -13.5, -7.5),
    objects: ['bridge-winch'],
    enemies: [],
    closedHint: 'The rope bridge is raised. Work the bridge winch on the east bank of Fern Hollow.',
    openedText: 'The rope bridge drops across the river with a thunderous clack!',
  },
  {
    id: 'stockade',
    name: 'Stockade Gate',
    rect: r(-2, 2, -25, -22),
    objects: ['stockade-lock'],
    enemies: [],
    closedHint: 'The stockade gate is locked. Crack the corsair code lock beside it.',
    openedText: 'The corsair lock clicks. The stockade gate swings inwards.',
  },
  {
    id: 'barricade',
    name: 'Captain’s Barricade',
    rect: r(-2, 2, -34, -32.5),
    objects: [],
    enemies: ['captain'],
    closedHint: 'Captain Redsail’s barricade blocks the ruins. Defeat the captain to lower it.',
    openedText: 'Redsail’s crew flee and the barricade to the ruins falls.',
  },
  {
    id: 'sanctum',
    name: 'Sanctum Door',
    rect: r(-2, 2, -42, -40.5),
    objects: ['seal-west', 'seal-east', 'seal-heart'],
    enemies: [],
    closedHint: 'The sanctum door is sealed. Break all three rune seals in the antechamber.',
    openedText: 'The third seal shatters. The sanctum door grinds open.',
  },
];

const topicLoot = (
  name: string,
  slot: ItemSlot,
  rarity: Rarity,
  power: number,
  topic: Topic,
  description: string,
): LootSpec => ({ name, slot, rarity, power, topic, description });

/** Encounter order follows the critical path; indices form enemy IDs `e{expedition}-{index}`. */
export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  {
    key: 'prowler',
    region: 'landing',
    rank: 'minion',
    name: 'Bramble Prowler',
    kind: 'beast',
    x: 3,
    z: 8.5,
    maxHp: 16,
    attack: 4,
    xp: 25,
    gold: 8,
    topic: 'fractions',
    tell: 'The prowler flattens its ears and crouches to pounce.',
    loot: topicLoot(
      'Tidefang',
      'weapon',
      'uncommon',
      4,
      'fractions',
      'A serrated jade blade forged where the two rivers meet.',
    ),
  },
  {
    key: 'stalker',
    region: 'hollow',
    rank: 'minion',
    name: 'Fern Stalker',
    kind: 'beast',
    x: 3,
    z: -1,
    maxHp: 22,
    attack: 5,
    xp: 30,
    gold: 10,
    topic: 'multiplication',
    tell: 'Ferns rustle in a circle around you. The stalker is flanking.',
    loot: topicLoot(
      'Fernweave Wraps',
      'armour',
      'uncommon',
      3,
      'multiplication',
      'Tough woven fronds that soak up claws and thorns.',
    ),
  },
  {
    key: 'boar',
    region: 'hollow',
    rank: 'elite',
    name: 'Thornback Boar',
    kind: 'beast',
    x: -7,
    z: -4,
    maxHp: 34,
    attack: 8,
    xp: 45,
    gold: 18,
    topic: 'geometry',
    tell: 'The boar paws the ground and lowers its tusks. A charge is coming!',
    loot: topicLoot(
      'Thornback Tusk-Axe',
      'weapon',
      'rare',
      7,
      'geometry',
      'A heavy axe edged with a boar’s shed tusk.',
    ),
  },
  {
    key: 'raider',
    region: 'ford',
    rank: 'minion',
    name: 'Canopy Raider',
    kind: 'pirate',
    x: 5,
    z: -16.5,
    maxHp: 30,
    attack: 7,
    xp: 40,
    gold: 16,
    topic: 'percentages',
    tell: 'The raider swings down on a vine, cutlass high.',
    loot: topicLoot(
      'Canopy Mantle',
      'armour',
      'rare',
      5,
      'percentages',
      'Layered leaves and bronze scales turn aside thorn and arrow.',
    ),
  },
  {
    key: 'cutter',
    region: 'ford',
    rank: 'minion',
    name: 'Rope Cutter',
    kind: 'pirate',
    x: -4,
    z: -18.5,
    maxHp: 30,
    attack: 7,
    xp: 40,
    gold: 16,
    topic: 'division',
    tell: 'The rope cutter twirls a hooked blade and edges closer.',
    loot: topicLoot(
      'Ember Prism',
      'relic',
      'rare',
      6,
      'division',
      'A warm prism that gathers the patterns of a forgotten fire.',
    ),
  },
  {
    key: 'lookout',
    region: 'stockade',
    rank: 'minion',
    name: 'Corsair Lookout',
    kind: 'pirate',
    x: -5.5,
    z: -27.5,
    maxHp: 36,
    attack: 8,
    xp: 45,
    gold: 20,
    topic: 'percentages',
    tell: 'A whistle from the watchtower: the lookout has you in sight.',
    loot: topicLoot(
      'Corsair Runeblade',
      'weapon',
      'rare',
      9,
      'percentages',
      'A captured blade etched with the marks of distant islands.',
    ),
  },
  {
    key: 'captain',
    region: 'stockade',
    rank: 'elite',
    name: 'Captain Redsail',
    kind: 'pirate',
    x: 3,
    z: -30,
    maxHp: 62,
    attack: 10,
    xp: 80,
    gold: 40,
    topic: 'multiplication',
    tell: 'Redsail roars an order and brings both cutlasses round!',
    loot: topicLoot(
      'Redsail Greatcoat',
      'armour',
      'rare',
      7,
      'multiplication',
      'A captain’s coat, crimson and stiff with sea salt and brass.',
    ),
  },
  {
    key: 'sentinel',
    region: 'antechamber',
    rank: 'elite',
    name: 'Moss Sentinel',
    kind: 'spirit',
    x: 0,
    z: -36.5,
    maxHp: 48,
    attack: 9,
    xp: 55,
    gold: 22,
    topic: 'geometry',
    tell: 'Crystals in the sentinel’s shoulders flare green. It is gathering force.',
    loot: topicLoot(
      'Mossheart Charm',
      'relic',
      'rare',
      8,
      'geometry',
      'A living green stone that beats slowly, like a heart.',
    ),
  },
  {
    key: 'guardian',
    region: 'sanctum',
    rank: 'boss',
    name: 'Shard Guardian',
    kind: 'guardian',
    x: 0,
    z: -46,
    maxHp: 110,
    attack: 12,
    xp: 120,
    gold: 60,
    topic: 'division',
    tell: 'The guardian raises both fists. The floor runes blaze!',
    loot: topicLoot(
      'Compass of Unity',
      'relic',
      'legendary',
      12,
      'division',
      'A legendary compass fragment. Its light grows with your understanding.',
    ),
  },
];

export const LEVEL_OBJECTS: LevelObject[] = [
  {
    id: 'trail-chest',
    kind: 'chest',
    name: 'Mira’s Supply Chest',
    region: 'landing',
    x: -4.5,
    z: 9.5,
    description: 'A travel chest with Mira’s compass mark scratched on the lid. It isn’t locked.',
    reward: {
      xp: 10,
      gold: 5,
      potions: 1,
      loot: topicLoot(
        'Explorer’s Hide Vest',
        'armour',
        'common',
        2,
        'fractions',
        'Mira’s spare vest. Patched, but it has survived worse than you.',
      ),
    },
    persistence: 'expedition',
    successText: 'Mira left you a vest and a healing draught. “Don’t get eaten,” says the note.',
  },
  {
    id: 'lore-landing',
    kind: 'lore',
    name: 'Trail Mark Stone',
    region: 'landing',
    x: 4.5,
    z: 13.5,
    description:
      '“Fighter — the map’s compass broke into fractions when the guardian woke. One piece glows in the sanctuary to the north. The corsairs want it too. Cross the river, get past their stockade, and break the seals. — M.”',
    reward: { xp: 10, gold: 0 },
    persistence: 'story',
    successText: 'You learned the route north: river, stockade, seals, sanctuary.',
  },
  {
    id: 'lore-hollow',
    kind: 'lore',
    name: 'Lost Explorer’s Satchel',
    region: 'hollow',
    x: -2.5,
    z: 0.8,
    description:
      'A torn satchel. Inside, a notebook: “The corsairs raised the bridge from the east bank winch. It needs the right rope length — measure twice, winch once.”',
    reward: { xp: 10, gold: 6 },
    persistence: 'story',
    successText: 'The notebook explains the bridge winch. You pocket 6 gold coins.',
  },
  {
    id: 'mossy-cache',
    kind: 'puzzle',
    name: 'Moss-Lock Cache',
    region: 'grotto',
    x: -13.8,
    z: -4,
    description:
      'A stone chest sealed with glowing moss stones. Solve the fraction lock and it opens.',
    task: { pool: 'mossy-cache', tier: 'focus' },
    reward: {
      xp: 30,
      gold: 12,
      loot: topicLoot(
        'Grotto Lens',
        'relic',
        'uncommon',
        5,
        'fractions',
        'A lens of green glass. Through it, every fraction looks simpler.',
      ),
    },
    persistence: 'expedition',
    successText: 'The moss stones flare and the lid slides aside.',
  },
  {
    id: 'bridge-winch',
    kind: 'mechanism',
    name: 'Bridge Winch',
    region: 'hollow',
    x: 4.2,
    z: -6.4,
    description:
      'A great wooden drum with the bridge ropes wound round it. Work out the right length and you can lower the bridge.',
    task: { pool: 'bridge-winch', tier: 'focus' },
    reward: { xp: 25, gold: 0 },
    persistence: 'story',
    successText: 'The drum spins and the rope bridge drops across the river!',
  },
  {
    id: 'tide-shrine',
    kind: 'shrine',
    name: 'Tide Shrine',
    region: 'ford',
    x: -7.5,
    z: -15,
    description:
      'Clear water runs over a carved basin. Travellers rest here before facing the stockade.',
    reward: { xp: 0, gold: 0, heal: true, potions: 1 },
    persistence: 'expedition',
    successText: 'Cool water restores your health, and you fill a healing draught.',
  },
  {
    id: 'lore-ford',
    kind: 'lore',
    name: 'Corsair Warning Post',
    region: 'ford',
    x: 7.5,
    z: -14.2,
    description:
      'A skull-painted board: “REDSAIL’S WATERS. The gate code changes with the tide — work out the percentage or stay out.”',
    reward: { xp: 10, gold: 0 },
    persistence: 'story',
    successText: 'The stockade uses a percentage code lock. Now you know.',
  },
  {
    id: 'stockade-lock',
    kind: 'mechanism',
    name: 'Corsair Code Lock',
    region: 'ford',
    x: 3.4,
    z: -20.3,
    description: 'A brass dial lock bolted to the stockade gate. The code is a percentage puzzle.',
    task: { pool: 'stockade-lock', tier: 'focus' },
    reward: { xp: 25, gold: 0 },
    persistence: 'story',
    successText: 'The dial clicks into place. The stockade gate swings open.',
  },
  {
    id: 'captain-strongbox',
    kind: 'chest',
    name: 'Redsail’s Strongbox',
    region: 'stockade',
    x: 7,
    z: -31.5,
    description: 'The captain’s iron strongbox. Redsail keeps the key on his belt.',
    requires: { enemies: ['captain'] },
    lockedHint: 'Captain Redsail carries the strongbox key. Defeat him first.',
    reward: {
      xp: 20,
      gold: 35,
      loot: topicLoot(
        'Redsail Cutlass',
        'weapon',
        'rare',
        10,
        'percentages',
        'The captain’s favourite cutlass, balanced like a feather.',
      ),
    },
    persistence: 'expedition',
    successText: 'Redsail’s key turns. Gold, and the captain’s own cutlass!',
  },
  {
    id: 'lore-stockade',
    kind: 'lore',
    name: 'Captain’s Log',
    region: 'stockade',
    x: -7.2,
    z: -31,
    description:
      '“Day 40. The seals will not break for steel. Each one wants a different kind of thinking — shapes, fractions, sharing. My crew can’t do it. Maybe the kid from Haven can.”',
    reward: { xp: 10, gold: 0 },
    persistence: 'story',
    successText: 'The three seals each need a different kind of maths.',
  },
  {
    id: 'sunken-cache',
    kind: 'puzzle',
    name: 'Drowned Chest',
    region: 'cove',
    x: 13.6,
    z: -28.5,
    description:
      'A barnacled chest with a four-part tide lock. It is the hardest puzzle on the trail — and the richest.',
    task: { pool: 'sunken-cache', tier: 'ritual' },
    reward: {
      xp: 60,
      gold: 40,
      loot: topicLoot(
        'Tidecaller Pearl',
        'relic',
        'legendary',
        11,
        'percentages',
        'A pearl that hums with the tide. Few fighters have ever opened the drowned chest.',
      ),
    },
    persistence: 'expedition',
    successText: 'All four tide dials align. The drowned chest opens with a rush of light!',
  },
  {
    id: 'seal-west',
    kind: 'seal',
    name: 'Seal of Shapes',
    region: 'antechamber',
    x: -5.8,
    z: -35.5,
    description: 'A rune stone carved with rectangles within rectangles.',
    task: { pool: 'seal-shapes', tier: 'focus' },
    reward: { xp: 20, gold: 0 },
    persistence: 'expedition',
    successText: 'The Seal of Shapes cracks and its light goes out.',
  },
  {
    id: 'seal-east',
    kind: 'seal',
    name: 'Seal of Parts',
    region: 'antechamber',
    x: 5.8,
    z: -35.5,
    description: 'A rune stone split into many unequal slices.',
    task: { pool: 'seal-parts', tier: 'focus' },
    reward: { xp: 20, gold: 0 },
    persistence: 'expedition',
    successText: 'The Seal of Parts cracks and its light goes out.',
  },
  {
    id: 'seal-heart',
    kind: 'seal',
    name: 'Seal of Sharing',
    region: 'antechamber',
    x: -4.2,
    z: -39.6,
    description: 'The oldest seal. Its runes divide one great number into equal shares.',
    task: { pool: 'seal-sharing', tier: 'ritual' },
    reward: { xp: 30, gold: 0 },
    persistence: 'expedition',
    successText: 'The Seal of Sharing shatters!',
  },
];

export type Objective = {
  id: string;
  text: string;
  target: { kind: 'object' | 'enemy'; id: string } | null;
};

/** Critical-path steps shown in the HUD. The order is the intended play order. */
export const OBJECTIVES: Array<{
  id: string;
  text: string;
  done: (v: LevelView) => boolean;
  target: (v: LevelView) => Objective['target'];
}> = [
  {
    id: 'bridge',
    text: 'Lower the rope bridge in Fern Hollow',
    done: (v) => v.resolved.includes('bridge-winch'),
    target: () => ({ kind: 'object', id: 'bridge-winch' }),
  },
  {
    id: 'stockade',
    text: 'Crack the corsair code lock at the stockade',
    done: (v) => v.resolved.includes('stockade-lock'),
    target: () => ({ kind: 'object', id: 'stockade-lock' }),
  },
  {
    id: 'captain',
    text: 'Defeat Captain Redsail',
    done: (v) => v.defeated.includes('captain'),
    target: () => ({ kind: 'enemy', id: 'captain' }),
  },
  {
    id: 'seals',
    text: 'Break the three sanctum seals',
    done: (v) =>
      GATES.find((g) => g.id === 'sanctum')!.objects.every((o) => v.resolved.includes(o)),
    target: (v) => {
      const next = GATES.find((g) => g.id === 'sanctum')!.objects.find(
        (o) => !v.resolved.includes(o),
      );
      return next ? { kind: 'object', id: next } : null;
    },
  },
  {
    id: 'guardian',
    text: 'Defeat the Shard Guardian and take the compass fragment',
    done: (v) => v.defeated.includes('guardian'),
    target: () => ({ kind: 'enemy', id: 'guardian' }),
  },
];

/** Minimal progress view so level rules never depend on the whole save. */
export type LevelView = { resolved: readonly string[]; defeated: readonly EnemyKey[] };

export const inRect = (rect: Rect, x: number, z: number) =>
  x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ;

export function openGates(v: LevelView): Set<GateId> {
  return new Set(
    GATES.filter(
      (g) =>
        g.objects.every((o) => v.resolved.includes(o)) &&
        g.enemies.every((e) => v.defeated.includes(e)),
    ).map((g) => g.id),
  );
}

export const regionById = (id: RegionId) => REGIONS.find((region) => region.id === id)!;
export const objectById = (id: string) => LEVEL_OBJECTS.find((o) => o.id === id);

export function regionAt(x: number, z: number): Region | null {
  return REGIONS.find((region) => region.rects.some((rect) => inRect(rect, x, z))) ?? null;
}

export const regionAccessible = (id: RegionId, open: ReadonlySet<GateId>) =>
  regionById(id).gates.every((gate) => open.has(gate));

/** A point is walkable inside any region rect, or inside a gate corridor that is open. */
export function isWalkable(x: number, z: number, open: ReadonlySet<GateId>): boolean {
  return (
    REGIONS.some((region) => region.rects.some((rect) => inRect(rect, x, z))) ||
    GATES.some((gate) => open.has(gate.id) && inRect(gate.rect, x, z))
  );
}

/** Walkable with room to spare: planned routes keep this far from clearing edges. */
export const CLEARANCE = 0.35;
export function isClear(x: number, z: number, open: ReadonlySet<GateId>, margin = CLEARANCE) {
  return (
    isWalkable(x, z, open) &&
    isWalkable(x + margin, z, open) &&
    isWalkable(x - margin, z, open) &&
    isWalkable(x, z + margin, open) &&
    isWalkable(x, z - margin, open)
  );
}

export function segmentWalkable(
  a: Point,
  b: Point,
  open: ReadonlySet<GateId>,
  step = 0.2,
  margin = 0,
) {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const samples = Math.max(1, Math.ceil(length / step));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = a.x + (b.x - a.x) * t,
      z = a.z + (b.z - a.z) * t;
    if (margin ? !isClear(x, z, open, margin) : !isWalkable(x, z, open)) return false;
  }
  return true;
}

/** First closed gate between the hero and a region, used to explain blocked routes. */
export function blockingGate(id: RegionId, open: ReadonlySet<GateId>): Gate | null {
  const gate = regionById(id).gates.find((g) => !open.has(g));
  return gate ? GATES.find((g) => g.id === gate)! : null;
}

export function objectAvailable(object: LevelObject, v: LevelView) {
  const open = openGates(v);
  return (
    regionAccessible(object.region, open) &&
    (object.requires?.enemies ?? []).every((e) => v.defeated.includes(e)) &&
    (object.requires?.objects ?? []).every((o) => v.resolved.includes(o))
  );
}

export function enemyAccessible(key: EnemyKey, v: LevelView) {
  const definition = ENEMY_DEFINITIONS.find((e) => e.key === key);
  return !!definition && regionAccessible(definition.region, openGates(v));
}

export function nextObjective(v: LevelView): Objective | null {
  const step = OBJECTIVES.find((o) => !o.done(v));
  return step ? { id: step.id, text: step.text, target: step.target(v) } : null;
}

export function targetPosition(target: NonNullable<Objective['target']>): Point | null {
  if (target.kind === 'object') {
    const object = objectById(target.id);
    return object ? { x: object.x, z: object.z } : null;
  }
  const enemy = ENEMY_DEFINITIONS.find((e) => e.key === target.id);
  return enemy ? { x: enemy.x, z: enemy.z } : null;
}

/** Loot items are deterministic, so an object or enemy can only ever award one copy. */
export function makeLoot(spec: LootSpec, id: string, expedition: number): Item {
  const boost = Math.min(expedition - 1, 20);
  return {
    id,
    name: spec.name,
    slot: spec.slot,
    rarity: spec.rarity,
    attack: spec.slot === 'armour' ? 0 : spec.power + boost,
    defence: spec.slot === 'armour' ? spec.power + boost : 0,
    topic: spec.topic,
    description: `${spec.description} Affinity: ${spec.topic}.`,
  };
}

// ---------------------------------------------------------------------------
// Navigation: a 0.5-unit grid over the level with 8-way Dijkstra and
// line-of-sight smoothing. Unreachable targets resolve to the closest
// reachable point, with the blocking gate reported for player feedback.
// ---------------------------------------------------------------------------

const CELL = 0.5;
const COLS = Math.round((LEVEL_BOUNDS.maxX - LEVEL_BOUNDS.minX) / CELL);
const ROWS = Math.round((LEVEL_BOUNDS.maxZ - LEVEL_BOUNDS.minZ) / CELL);
const cellX = (c: number) => LEVEL_BOUNDS.minX + (c + 0.5) * CELL;
const cellZ = (row: number) => LEVEL_BOUNDS.minZ + (row + 0.5) * CELL;
const toCell = (x: number, z: number) => [
  Math.min(COLS - 1, Math.max(0, Math.floor((x - LEVEL_BOUNDS.minX) / CELL))),
  Math.min(ROWS - 1, Math.max(0, Math.floor((z - LEVEL_BOUNDS.minZ) / CELL))),
];

export type Route = { points: Point[]; reached: boolean; blockedBy: Gate | null };

/** Nearest walkable point, searching outwards in grid rings. */
export function nearestWalkable(p: Point, open: ReadonlySet<GateId>): Point {
  if (isWalkable(p.x, p.z, open)) return p;
  const [c0, r0] = toCell(p.x, p.z);
  let best: Point | null = null;
  let bestDistance = Infinity;
  for (let ring = 1; ring < Math.max(COLS, ROWS); ring++) {
    for (let c = c0 - ring; c <= c0 + ring; c++)
      for (let row = r0 - ring; row <= r0 + ring; row++) {
        if (Math.max(Math.abs(c - c0), Math.abs(row - r0)) !== ring) continue;
        if (c < 0 || row < 0 || c >= COLS || row >= ROWS) continue;
        const x = cellX(c),
          z = cellZ(row);
        if (!isWalkable(x, z, open)) continue;
        const d = Math.hypot(x - p.x, z - p.z);
        if (d < bestDistance) {
          bestDistance = d;
          best = { x, z };
        }
      }
    if (best) return best;
  }
  return { ...SPAWN };
}

export function findPath(from: Point, to: Point, open: ReadonlySet<GateId>): Route {
  const start = nearestWalkable(from, open);
  const walk = new Uint8Array(COLS * ROWS);
  for (let row = 0; row < ROWS; row++)
    for (let c = 0; c < COLS; c++) walk[row * COLS + c] = +isClear(cellX(c), cellZ(row), open);
  const [sc, sr] = toCell(start.x, start.z);
  const startIndex = sr * COLS + sc;
  walk[startIndex] = 1;
  const distance = new Float64Array(COLS * ROWS).fill(Infinity);
  const parent = new Int32Array(COLS * ROWS).fill(-1);
  distance[startIndex] = 0;
  // Binary heap keyed by distance.
  const heap: number[] = [startIndex];
  const push = (i: number) => {
    heap.push(i);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (distance[heap[p]] <= distance[heap[k]]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = k * 2 + 1,
          rr = l + 1;
        let m = k;
        if (l < heap.length && distance[heap[l]] < distance[heap[m]]) m = l;
        if (rr < heap.length && distance[heap[rr]] < distance[heap[m]]) m = rr;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top;
  };
  const done = new Uint8Array(COLS * ROWS);
  while (heap.length) {
    const i = pop();
    if (done[i]) continue;
    done[i] = 1;
    const c = i % COLS,
      row = (i / COLS) | 0;
    for (let dc = -1; dc <= 1; dc++)
      for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const nc = c + dc,
          nr = row + dr;
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        const n = nr * COLS + nc;
        if (!walk[n]) continue;
        // No corner cutting past walls.
        if (dc && dr && (!walk[row * COLS + nc] || !walk[nr * COLS + c])) continue;
        const nd = distance[i] + (dc && dr ? Math.SQRT2 : 1);
        if (nd < distance[n]) {
          distance[n] = nd;
          parent[n] = i;
          push(n);
        }
      }
  }
  // Choose the reachable cell closest to the requested destination.
  let goal = startIndex;
  let goalGap = Infinity;
  for (let i = 0; i < COLS * ROWS; i++) {
    if (!done[i]) continue;
    const gap = Math.hypot(cellX(i % COLS) - to.x, cellZ((i / COLS) | 0) - to.z);
    if (gap < goalGap - 1e-9 || (Math.abs(gap - goalGap) < 1e-9 && distance[i] < distance[goal])) {
      goal = i;
      goalGap = gap;
    }
  }
  const goalPoint = { x: cellX(goal % COLS), z: cellZ((goal / COLS) | 0) };
  // Targets near a clearing edge sit just outside the clearance grid; accept
  // them when the final short leg is plainly walkable.
  const reached =
    isWalkable(to.x, to.z, open) && goalGap <= 1.5 && segmentWalkable(goalPoint, to, open);
  const cells: Point[] = [];
  for (let i = goal; i !== -1; i = parent[i])
    cells.unshift({ x: cellX(i % COLS), z: cellZ((i / COLS) | 0) });
  const raw = [start, ...cells.slice(1), ...(reached ? [to] : [])];
  // Greedy line-of-sight smoothing keeps routes natural rather than grid-stepped;
  // interior legs keep clearance so float drift can never catch a clearing edge.
  const points: Point[] = [];
  let k = 0;
  while (k < raw.length - 1) {
    let j = raw.length - 1;
    while (
      j > k + 1 &&
      !segmentWalkable(raw[k], raw[j], open, 0.2, k === 0 || j === raw.length - 1 ? 0 : CLEARANCE)
    )
      j--;
    points.push(raw[j]);
    k = j;
  }
  let blockedBy: Gate | null = null;
  if (!reached) {
    const region = regionAt(to.x, to.z);
    const gate = GATES.find((g) => !open.has(g.id) && inRect(g.rect, to.x, to.z));
    blockedBy = gate ?? (region ? blockingGate(region.id, open) : null);
  }
  return { points, reached, blockedBy };
}

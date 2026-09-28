import { describe, expect, it } from 'vitest';
import {
  ENEMY_DEFINITIONS,
  GATES,
  LEVEL_BOUNDS,
  LEVEL_OBJECTS,
  OBJECTIVES,
  REGIONS,
  SPAWN,
  THREAT_RADIUS,
  findPath,
  isWalkable,
  nextObjective,
  openGates,
  regionAt,
  segmentWalkable,
} from '../src/game/level';
import type { GateId, Point, RegionId } from '../src/game/level';
import {
  attackEnemy,
  claimQuest,
  enterZone,
  freshRpg,
  interactObject,
  levelView,
  objectStatus,
  questProgress,
  validateRpg,
} from '../src/game/rpg';
import type { RpgState } from '../src/game/rpg';

const centre = (id: RegionId): Point => {
  const rect = REGIONS.find((r) => r.id === id)!.rects[0];
  return { x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 };
};
const reachable = (to: Point, open: Set<GateId>) => findPath(SPAWN, to, open).reached;
const wilds = () => enterZone(freshRpg(), 'wilds');
const kill = (s: RpgState, key: string) => {
  const id = s.enemies.find((e) => e.key === key)!.id;
  for (let i = 0; i < 20 && s.enemies.find((e) => e.id === id)!.hp > 0; i++)
    s = attackEnemy(s, id, 'ritual', true);
  return s;
};
const solve = (s: RpgState, ...ids: string[]) => ids.reduce((n, id) => interactObject(n, id), s);
/** Plays the critical path using only public rules. */
const playToGuardian = () => {
  let s = wilds();
  s = solve(s, 'bridge-winch', 'stockade-lock');
  s = kill(s, 'captain');
  s = solve(s, 'seal-west', 'seal-east', 'seal-heart');
  return kill(s, 'guardian');
};

describe('Emerald Trail layout', () => {
  it('places every region, object and enemy inside the level and its own region', () => {
    for (const region of REGIONS)
      for (const rect of region.rects) {
        expect(rect.minX).toBeGreaterThanOrEqual(LEVEL_BOUNDS.minX);
        expect(rect.maxX).toBeLessThanOrEqual(LEVEL_BOUNDS.maxX);
        expect(rect.minZ).toBeGreaterThanOrEqual(LEVEL_BOUNDS.minZ);
        expect(rect.maxZ).toBeLessThanOrEqual(LEVEL_BOUNDS.maxZ);
      }
    for (const thing of [...LEVEL_OBJECTS, ...ENEMY_DEFINITIONS])
      expect(regionAt(thing.x, thing.z)?.id, thing.name).toBe(thing.region);
    expect(regionAt(SPAWN.x, SPAWN.z)?.id).toBe('landing');
    expect(new Set(LEVEL_OBJECTS.map((o) => o.id)).size).toBe(LEVEL_OBJECTS.length);
    expect(new Set(ENEMY_DEFINITIONS.map((e) => e.key)).size).toBe(ENEMY_DEFINITIONS.length);
  });

  it('declared region gates match the physical walkable topology', () => {
    const order: GateId[] = ['bridge', 'stockade', 'barricade', 'sanctum'];
    for (let opened = 0; opened <= order.length; opened++) {
      const open = new Set(order.slice(0, opened));
      for (const region of REGIONS)
        expect(reachable(centre(region.id), open), `${region.id} with ${[...open]}`).toBe(
          region.gates.every((g) => open.has(g)),
        );
    }
  });

  it('every gate is the only link: closing just that gate cuts off what lies beyond', () => {
    const all = new Set(GATES.map((g) => g.id));
    for (const gate of GATES) {
      const open = new Set([...all].filter((g) => g !== gate.id));
      for (const region of REGIONS)
        expect(reachable(centre(region.id), open), `${region.id} without ${gate.id}`).toBe(
          !region.gates.includes(gate.id),
        );
    }
  });

  it('routes are continuous, walkable and explain the blocking gate', () => {
    const open = new Set<GateId>();
    const route = findPath(SPAWN, { x: -13.8, z: -3 }, open);
    expect(route.reached).toBe(true);
    let from = SPAWN;
    for (const point of route.points) {
      expect(segmentWalkable(from, point, open)).toBe(true);
      from = point;
    }
    const blocked = findPath(SPAWN, centre('ford'), open);
    expect(blocked.reached).toBe(false);
    expect(blocked.blockedBy?.id).toBe('bridge');
    const last = blocked.points.at(-1)!;
    expect(regionAt(last.x, last.z)?.id).toBe('hollow');
    expect(isWalkable(0, -10, open)).toBe(false);
    expect(isWalkable(0, -10, new Set(['bridge']))).toBe(true);
  });

  it('the hero starts outside every threat radius and each puzzle has approach room', () => {
    for (const e of ENEMY_DEFINITIONS)
      expect(Math.hypot(e.x - SPAWN.x, e.z - SPAWN.z), e.name).toBeGreaterThan(THREAT_RADIUS);
    const all = new Set(GATES.map((g) => g.id));
    for (const o of LEVEL_OBJECTS)
      expect(findPath(SPAWN, { x: o.x, z: o.z + 1.1 }, all).reached, o.id).toBe(true);
  });
});

describe('Emerald Trail progression', () => {
  it('guides the critical path in order and ends when the guardian falls', () => {
    let s = wilds();
    expect(nextObjective(levelView(s))?.id).toBe('bridge');
    expect(questProgress(s)).toMatchObject({ current: 0, target: OBJECTIVES.length, ready: false });
    s = solve(s, 'bridge-winch');
    expect(nextObjective(levelView(s))?.id).toBe('stockade');
    s = solve(s, 'stockade-lock');
    s = kill(s, 'captain');
    expect(nextObjective(levelView(s))).toMatchObject({
      id: 'seals',
      target: { kind: 'object', id: 'seal-west' },
    });
    const done = playToGuardian();
    expect(nextObjective(levelView(done))).toBeNull();
    expect(questProgress(done)).toMatchObject({ current: 5, ready: true });
    // Optional threats remain; the quest does not demand clearing them.
    expect(done.enemies.filter((e) => e.hp > 0).length).toBeGreaterThan(0);
  });

  it('closed gates protect enemies and objects beyond them', () => {
    const s = wilds();
    const raider = s.enemies.find((e) => e.key === 'raider')!;
    expect(attackEnemy(s, raider.id, 'ritual', true)).toBe(s);
    expect(objectStatus(s, 'stockade-lock')).toMatchObject({ ok: false, reason: 'locked' });
    expect(interactObject(s, 'seal-west')).toBe(s);
    const bridged = solve(s, 'bridge-winch');
    expect(bridged.lastReward).toContain('rope bridge drops');
    expect(attackEnemy(bridged, raider.id, 'ritual', true).enemies).not.toEqual(bridged.enemies);
  });

  it('boss-gated chest and barricade open only after Captain Redsail falls', () => {
    let s = solve(wilds(), 'bridge-winch', 'stockade-lock');
    expect(objectStatus(s, 'captain-strongbox')).toMatchObject({
      ok: false,
      message: expect.stringContaining('Redsail'),
    });
    expect(openGates(levelView(s)).has('barricade')).toBe(false);
    s = kill(s, 'captain');
    expect(s.lastReward).toContain('barricade');
    expect(openGates(levelView(s)).has('barricade')).toBe(true);
    const opened = interactObject(s, 'captain-strongbox');
    expect(opened.inventory.at(-1)?.name).toBe('Redsail Cutlass');
    expect(opened.gold).toBe(s.gold + 35);
  });

  it('puzzle mistakes cost nothing and rewards are claim-once', () => {
    const s = wilds();
    const wrong = interactObject(s, 'mossy-cache', false);
    expect(wrong.resolved).toEqual([]);
    expect(wrong.hp).toBe(s.hp);
    expect(wrong.inventory).toEqual(s.inventory);
    const right = interactObject(wrong, 'mossy-cache', true);
    expect(right.inventory.at(-1)).toMatchObject({ id: 'cache-1-mossy-cache', rarity: 'uncommon' });
    expect(right.xp).toBe(s.xp + 30);
    expect(interactObject(right, 'mossy-cache', true)).toBe(right);
    expect(interactObject(right, 'unknown-object')).toBe(right);
    expect(interactObject(enterZone(right, 'village'), 'trail-chest')).toEqual(
      enterZone(right, 'village'),
    );
  });

  it('shrine heals and lore rewards once; story shortcuts persist into the next expedition', () => {
    let s = solve(wilds(), 'bridge-winch');
    s = { ...s, hp: 20 };
    const healed = interactObject(s, 'tide-shrine');
    expect(healed.hp).toBe(100);
    expect(healed.potions).toBe(s.potions + 1);
    s = solve(playToGuardian(), 'lore-landing', 'tide-shrine', 'trail-chest');
    const rewarded = claimQuest(enterZone(s, 'village'));
    const next = enterZone(rewarded, 'wilds');
    expect(next.expedition).toBe(2);
    expect(next.resolved.sort()).toEqual(['bridge-winch', 'lore-landing', 'stockade-lock']);
    expect(objectStatus(next, 'trail-chest').ok).toBe(true);
    expect(objectStatus(next, 'seal-west').ok).toBe(false); // barricade relocks until Redsail falls
    expect(nextObjective(levelView(next))?.id).toBe('captain');
    const chest = interactObject(next, 'trail-chest');
    expect(chest.inventory.at(-1)?.id).toBe('cache-2-trail-chest');
  });
});

describe('level save compatibility', () => {
  it('round-trips resolved objects and rejects unknown or duplicate IDs', () => {
    const s = solve(wilds(), 'trail-chest', 'lore-landing');
    expect(validateRpg(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(() => validateRpg({ ...s, resolved: ['not-an-object'] })).toThrow();
    expect(() => validateRpg({ ...s, resolved: ['trail-chest', 'trail-chest'] })).toThrow();
    const { resolved: _resolved, ...legacy } = s;
    expect(validateRpg(legacy).resolved).toEqual([]);
  });

  it('migrates the old five-enemy trail without losing a completed quest or items', () => {
    const base = freshRpg();
    const oldEnemies = (hp: number) =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `e1-${i}`,
        name: `Old ${i}`,
        kind: 'beast',
        x: 0,
        z: 0,
        hp,
        maxHp: 20,
        attack: 5,
        xp: 10,
        gold: 5,
        topic: 'fractions',
      }));
    const { resolved: _r, ...shape } = base;
    const cleared = validateRpg({ ...shape, enemies: oldEnemies(0), defeated: 5 });
    expect(cleared.enemies).toHaveLength(ENEMY_DEFINITIONS.length);
    expect(cleared.enemies.every((e) => e.hp === 0)).toBe(true);
    expect(questProgress(cleared).ready).toBe(true);
    expect(cleared.defeated).toBe(ENEMY_DEFINITIONS.length);
    const partial = validateRpg({ ...shape, enemies: oldEnemies(12), defeated: 0 });
    expect(partial.enemies.every((e) => e.hp === e.maxHp)).toBe(true);
    expect(partial.inventory).toEqual(base.inventory);
    expect(() => validateRpg({ ...shape, enemies: oldEnemies(0).slice(0, 4) })).toThrow();
  });
});

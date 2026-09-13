import { combatStats } from './rpg';
import type { RpgState } from './rpg';

export type DefenceOutcome = 'blocked' | 'hit';

const MAX_HIT_FRACTION = 0.35;

/**
 * Shows the damage that will actually be lost. Armour cannot reduce a live
 * attack below one health, and the final cap prevents a future high-level
 * enemy from deleting most of a character's health bar in one timer event.
 */
export function defencePreview(s: RpgState, enemyId: string) {
  const enemy = s.enemies.find((candidate) => candidate.id === enemyId && candidate.hp > 0);
  if (!enemy || s.zone !== 'wilds') return { incoming: 0, armour: 0, damage: 0 };
  const stats = combatStats(s);
  const armour = Math.min(Math.max(0, enemy.attack - 1), stats.defence);
  return {
    incoming: enemy.attack,
    armour,
    damage: Math.max(1, Math.min(enemy.attack - armour, Math.ceil(stats.maxHp * MAX_HIT_FRACTION))),
  };
}

/**
 * Resolve one already-authorised enemy event. The caller owns event identity:
 * without an event ID, duplicate timer callbacks cannot be distinguished here.
 */
export function resolveDefence(s: RpgState, enemyId: string, outcome: DefenceOutcome): RpgState {
  const enemy = s.enemies.find((candidate) => candidate.id === enemyId && candidate.hp > 0);
  if (!enemy || s.zone !== 'wilds' || outcome === 'blocked') return s;

  const preview = defencePreview(s, enemyId);
  if (s.hp <= preview.damage) {
    const stats = combatStats(s);
    return {
      ...s,
      zone: 'village',
      hp: stats.maxHp,
      potions: Math.max(3, s.potions),
      lastReward:
        'Mira brought you safely back to Haven. Your loot and progress are safe; the trail remembers your victories.',
    };
  }
  return {
    ...s,
    hp: s.hp - preview.damage,
    lastReward: `${enemy.name} struck for ${preview.damage}. Armour absorbed ${preview.armour} of ${preview.incoming}.`,
  };
}

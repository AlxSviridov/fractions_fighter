import { memo } from 'react';
import {
  ENEMY_DEFINITIONS,
  GATES,
  LEVEL_BOUNDS,
  LEVEL_OBJECTS,
  REGIONS,
  RIVER,
  objectAvailable,
  openGates,
  regionAccessible,
} from '../game/level';
import type { LevelView, Point } from '../game/level';

type Props = {
  view: LevelView;
  player: Point;
  objective: Point | null;
  aliveEnemies: string[];
};

const b = LEVEL_BOUNDS;
const W = b.maxX - b.minX;
const H = b.maxZ - b.minZ;
// North (−z) is drawn at the top of the map.
const sx = (x: number) => x - b.minX;
const sz = (z: number) => b.maxZ - z;

/** Parchment-style trail map. Locked regions stay fogged until their gates open. */
export const TrailMap = memo(function TrailMap({ view, player, objective, aliveEnemies }: Props) {
  const open = openGates(view);
  return (
    <figure className="trail-map" aria-label="Trail map">
      <figcaption>
        <span>TRAIL MAP</span>
        <small>N ▲</small>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true">
        <rect
          x={0}
          y={sz(RIVER.maxZ)}
          width={W}
          height={RIVER.maxZ - RIVER.minZ}
          className="map-river"
        />
        {REGIONS.map((region) =>
          region.rects.map((rect, i) => (
            <rect
              key={`${region.id}-${i}`}
              x={sx(rect.minX)}
              y={sz(rect.maxZ)}
              width={rect.maxX - rect.minX}
              height={rect.maxZ - rect.minZ}
              className={regionAccessible(region.id, open) ? 'map-region' : 'map-region fogged'}
            />
          )),
        )}
        {GATES.map((gate) => (
          <rect
            key={gate.id}
            x={sx(gate.rect.minX)}
            y={sz(gate.rect.maxZ)}
            width={gate.rect.maxX - gate.rect.minX}
            height={gate.rect.maxZ - gate.rect.minZ}
            className={open.has(gate.id) ? 'map-gate open' : 'map-gate'}
          />
        ))}
        {LEVEL_OBJECTS.map((o) => {
          const done = view.resolved.includes(o.id);
          if (!done && !objectAvailable(o, view)) return null;
          return (
            <rect
              key={o.id}
              x={sx(o.x) - 0.7}
              y={sz(o.z) - 0.7}
              width={1.4}
              height={1.4}
              transform={`rotate(45 ${sx(o.x)} ${sz(o.z)})`}
              className={done ? 'map-object done' : `map-object ${o.task ? 'task' : 'free'}`}
            />
          );
        })}
        {ENEMY_DEFINITIONS.filter(
          (e) => aliveEnemies.includes(e.key) && regionAccessible(e.region, open),
        ).map((e) => (
          <circle
            key={e.key}
            cx={sx(e.x)}
            cy={sz(e.z)}
            r={e.rank === 'minion' ? 0.8 : 1.2}
            className={`map-enemy ${e.rank}`}
          />
        ))}
        {objective && (
          <circle cx={sx(objective.x)} cy={sz(objective.z)} r={2} className="map-objective" />
        )}
        <circle cx={sx(player.x)} cy={sz(player.z)} r={1.1} className="map-player" />
      </svg>
    </figure>
  );
});

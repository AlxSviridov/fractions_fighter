import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { JungleWorld } from '../game/world';
import type { Save } from '../game/state';
import type { CombatAction } from '../game/rpg';
export type WorldHandle = {
  goTo: (id: string) => void;
  approachEnemy: (id: string) => void;
  attackEnemy: (id: string, action?: CombatAction) => void;
  telegraphEnemy: (id: string) => void;
  celebrateLoot: () => void;
  celebrate: (id: string) => void;
  control: (key: string, down: boolean) => void;
};
type Props = {
  save: Save;
  paused: boolean;
  onNearby: (id: string | null) => void;
  onInteract: () => void;
  onReady: (seed: number) => void;
  onTargetInteract: (id: string) => void;
  onEnemyInteract: (id: string) => void;
  onZoneInteract: (zone: 'village' | 'wilds') => void;
  onPosition: (x: number, z: number) => void;
};
const World = forwardRef<WorldHandle, Props>(function World(props, ref) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<JungleWorld | null>(null),
    latest = useRef(props);
  latest.current = props;
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false);
  useImperativeHandle(
    ref,
    () => ({
      goTo: (id) => engine.current?.goTo(id),
      approachEnemy: (id) => engine.current?.approachEnemy(id),
      attackEnemy: (id, action) => engine.current?.attackEnemy(id, action),
      telegraphEnemy: (id) => engine.current?.telegraphEnemy(id),
      celebrateLoot: () => engine.current?.celebrateLoot(),
      celebrate: (id) => engine.current?.celebrate(id),
      control: (key, down) => engine.current?.control(key, down),
    }),
    [],
  );
  useEffect(() => {
    setReady(false);
    let world: JungleWorld;
    try {
      world = new JungleWorld(host.current!, latest.current.save, {
        onEnemyInteract: (id) => latest.current.onEnemyInteract(id),
        onZoneInteract: (zone) => latest.current.onZoneInteract(zone),
        onNearby: (id) => latest.current.onNearby(id),
        onInteract: () => latest.current.onInteract(),
        onTargetInteract: (id) => latest.current.onTargetInteract(id),
        onPosition: (x, z) => latest.current.onPosition(x, z),
        onReady: () => {
          setReady(true);
          latest.current.onReady(latest.current.save.seed);
        },
      });
      engine.current = world;
      if (latest.current.save.rpg) world.updateRpg(latest.current.save.rpg);
      world.setPaused(latest.current.paused);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebGL could not start');
      return;
    }
    return () => {
      world.dispose();
      engine.current = null;
    };
  }, [props.save.seed]);
  useEffect(() => {
    engine.current?.update(props.save);
    if (props.save.rpg) engine.current?.updateRpg(props.save.rpg);
  }, [props.save]);
  useEffect(() => {
    engine.current?.setPaused(props.paused);
  }, [props.paused, props.save.seed]);
  return (
    <div className="world" ref={host} data-ready={ready}>
      {error ? (
        <div className="world-error">
          <h2>The jungle needs WebGL</h2>
          <p>Enable hardware acceleration in your browser, then reload.</p>
          <small>{error}</small>
        </div>
      ) : (
        !ready && <div className="world-loading">Growing your jungle…</div>
      )}
    </div>
  );
});
export default World;

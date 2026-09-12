import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { JungleWorld } from '../game/world';
import type { Save } from '../game/state';
export type WorldHandle = { goTo: (id: string) => void; celebrate: (id: string) => void; control: (key: string, down: boolean) => void };
type Props = { save: Save; paused: boolean; onNearby: (id: string | null) => void; onInteract: () => void; onReady: (seed: number) => void; onTargetInteract: (id: string) => void; onPosition: (x: number, z: number) => void };
const World = forwardRef<WorldHandle, Props>(function World(props, ref) {
  const host = useRef<HTMLDivElement>(null), engine = useRef<JungleWorld | null>(null), latest = useRef(props);
  latest.current = props; const [error, setError] = useState(''), [ready, setReady] = useState(false);
  useImperativeHandle(ref, () => ({ goTo: id => engine.current?.goTo(id), celebrate: id => engine.current?.celebrate(id), control: (key, down) => engine.current?.control(key, down) }), []);
  useEffect(() => {
    setReady(false);
    let world: JungleWorld;
    try { world = new JungleWorld(host.current!, latest.current.save, { onNearby: id => latest.current.onNearby(id), onInteract: () => latest.current.onInteract(), onTargetInteract: id => latest.current.onTargetInteract(id), onPosition: (x, z) => latest.current.onPosition(x, z), onReady: () => { setReady(true); latest.current.onReady(latest.current.save.seed); } }); engine.current = world; world.setPaused(latest.current.paused); }
    catch (e) { setError(e instanceof Error ? e.message : 'WebGL could not start'); return; }
    return () => { world.dispose(); engine.current = null; };
  }, [props.save.seed]);
  useEffect(() => { engine.current?.update(props.save); }, [props.save]);
  useEffect(() => { engine.current?.setPaused(props.paused); }, [props.paused, props.save.seed]);
  return <div className="world" ref={host} data-ready={ready}>{error ? <div className="world-error"><h2>The jungle needs WebGL</h2><p>Enable hardware acceleration in your browser, then reload.</p><small>{error}</small></div> : !ready && <div className="world-loading">Growing your jungle…</div>}</div>;
});
export default World;

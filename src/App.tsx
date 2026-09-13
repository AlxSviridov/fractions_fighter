import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Backpack,
  BookOpen,
  Check,
  ChevronLeft,
  Compass,
  Coins,
  Download,
  Flame,
  Gem,
  Heart,
  Home,
  Leaf,
  Map as MapIcon,
  Menu,
  Play,
  Plus,
  Settings2,
  Shield,
  Skull,
  Sparkles,
  Sprout,
  Swords,
  Trophy,
  Upload,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from 'lucide-react';
import { Modal } from './components/Modal';
import { MathEncounter } from './components/MathEncounter';
import type { WorldHandle } from './components/World';
import { DIFFICULTIES, TOPICS } from './game/math';
import type { Difficulty } from './game/math';
import { freshSave, topicReports } from './game/state';
import type { Save } from './game/state';
import { loadSave, SAVE_KEY, validateSave } from './game/save';
import { archiveHero, persistHero, readHeroes } from './game/profiles';
import type { SavedHero } from './game/profiles';
import {
  ACTIONS,
  attackEnemy,
  claimQuest,
  CLASSES,
  combatStats,
  enterZone,
  equipItem,
  freshRpg,
  QUEST,
  questProgress,
  STORY,
  usePotion,
} from './game/rpg';
import type { ClassId, CombatAction, Item, ItemSlot, RpgState, Zone } from './game/rpg';
import { HEROES, portrait } from './game/heroes';
import { makeActionQuestion } from './game/actionMath';
import type { ActionQuestion, ActionTier } from './game/actionMath';
const World = lazy(() => import('./components/World'));
type Screen = 'menu' | 'create' | 'play';
type Panel = 'load' | 'settings' | 'inventory' | 'quests' | 'parents' | 'help' | null;
type Cast = {
  question: ActionQuestion;
  action: CombatAction | 'heal';
  enemyId?: string;
  title: string;
};
function exportJson(data: string, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
let audio: AudioContext | null = null;
function sound(enabled: boolean) {
  if (!enabled) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    [392, 523, 659].forEach((n, i) => {
      const o = audio!.createOscillator(),
        g = audio!.createGain(),
        t = audio!.currentTime + i * 0.08;
      o.frequency.value = n;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g);
      g.connect(audio!.destination);
      o.start(t);
      o.stop(t + 0.6);
    });
  } catch {
    /* Optional audio. */
  }
}
const itemIcon = (slot: ItemSlot, size = 24) =>
  slot === 'weapon' ? (
    <Swords size={size} />
  ) : slot === 'armour' ? (
    <Shield size={size} />
  ) : (
    <Gem size={size} />
  );
const classIcon = (id: ClassId, size = 24) =>
  id === 'warden' ? (
    <Shield size={size} />
  ) : id === 'ranger' ? (
    <Compass size={size} />
  ) : (
    <WandSparkles size={size} />
  );
export default function App() {
  const [initial] = useState(loadSave),
    [save, setSave] = useState<Save>(() => ({
      ...initial.save,
      rpg: initial.save.rpg ?? { ...freshRpg(), xp: initial.save.xp },
    }));
  const [screen, setScreen] = useState<Screen>('menu'),
    [panel, setPanel] = useState<Panel>(null),
    [error, setError] = useState(initial.error ?? ''),
    [blocked, setBlocked] = useState(!!initial.error);
  const [heroes, setHeroes] = useState<SavedHero[]>([]),
    [draftName, setDraftName] = useState('Rowan'),
    [draftAvatar, setDraftAvatar] = useState('7'),
    [draftClass, setDraftClass] = useState<ClassId>('warden');
  const [visualRpg, setVisualRpg] = useState<RpgState | null>(null),
    [resolving, setResolving] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null),
    [cast, setCast] = useState<Cast | null>(null),
    [toast, setToast] = useState(''),
    [loot, setLoot] = useState<Item | null>(null),
    [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [position, setPosition] = useState([0, 7]),
    [readySeed, setReadySeed] = useState<number | null>(null),
    [walkTarget, setWalkTarget] = useState<string | null>(null);
  const world = useRef<WorldHandle>(null),
    file = useRef<HTMLInputElement>(null),
    currentSave = useRef(save);
  currentSave.current = save;
  const rpg = save.rpg!,
    stats = combatStats(rpg),
    quest = questProgress(rpg),
    enemy = rpg.enemies.find((e) => e.id === selectedEnemy && e.hp > 0),
    reports = topicReports(save.attempts);
  const paused = screen !== 'play' || !!panel || !!cast || blocked || resolving;
  const notify = useCallback((message: string) => setToast(message), []),
    closePanel = useCallback(() => setPanel(null), []);
  const refreshHeroes = useCallback(() => {
    try {
      setHeroes(readHeroes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hero archive is unavailable.');
    }
  }, []);
  useEffect(() => {
    refreshHeroes();
  }, [refreshHeroes]);
  useEffect(() => {
    if (blocked) return;
    try {
      persistHero(save);
      setError('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Progress could not be saved. Please export a backup.',
      );
    }
  }, [save, blocked]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 5500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (walkTarget && readySeed === save.seed && !paused && world.current) {
      world.current.approachEnemy(walkTarget);
      setWalkTarget(null);
    }
  }, [walkTarget, readySeed, save.seed, paused]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        screen !== 'play' ||
        cast ||
        resolving ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.key.toLowerCase() === 'i') {
        setPanel((p) => (p === 'inventory' ? null : 'inventory'));
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'j') {
        setPanel((p) => (p === 'quests' ? null : 'quests'));
        e.preventDefault();
      }
      if (e.key === 'Escape' && !panel) {
        setScreen('menu');
        refreshHeroes();
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [screen, cast, resolving, panel, refreshHeroes]);
  const renderSave = useMemo(
    () =>
      screen === 'create'
        ? {
            ...save,
            profile: { ...save.profile, name: draftName },
            rpg: { ...freshRpg(draftClass, draftAvatar), zone: 'village' as Zone },
          }
        : visualRpg
          ? { ...save, rpg: visualRpg }
          : save,
    [screen, save, draftName, draftClass, draftAvatar, visualRpg],
  );
  function updateRpg(next: RpgState) {
    setSave((s) => ({ ...s, rpg: next, xp: next.xp, expedition: next.expedition }));
  }
  function openPanel(p: Panel) {
    if (cast || resolving) return;
    setPanel(p);
    if (p === 'load') refreshHeroes();
  }
  function newGame() {
    setDraftName('Rowan');
    setDraftAvatar('7');
    setDraftClass('warden');
    setPanel(null);
    setScreen('create');
  }
  function createHero() {
    try {
      archiveHero(save);
      const next = {
        ...freshSave(),
        slotId: crypto.randomUUID(),
        quickTimer: true,
        settings: save.settings,
        profile: { ...freshSave().profile, name: draftName.trim() || 'Rowan' },
        started: true,
        rpg: freshRpg(draftClass, draftAvatar),
      };
      persistHero(next);
      setBlocked(false);
      setSave(next);
      setScreen('play');
      setSelectedEnemy(null);
      setLoot(null);
      notify('Welcome to Haven. Scout Mira has a quest for you.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create hero.');
    }
  }
  function loadHero(next: Save) {
    const migrated = { ...next, rpg: next.rpg ?? { ...freshRpg(), xp: next.xp } };
    setSave(migrated);
    setBlocked(false);
    setPanel(null);
    setScreen('play');
    setCast(null);
    setSelectedEnemy(null);
    setLoot(null);
    notify('Your hero, equipment and discoveries are restored.');
  }
  function travel(zone: Zone) {
    if (cast || resolving) return;
    const next = enterZone(rpg, zone);
    updateRpg(next);
    setSelectedEnemy(null);
    setPanel(null);
    setLoot(null);
    notify(next.lastReward);
  }
  function target(id: string) {
    if (screen !== 'play' || rpg.zone !== 'wilds' || cast) return;
    setSelectedEnemy(id);
    setLoot(null);
  }
  function walkToEnemy(id: string) {
    setPanel(null);
    setWalkTarget(id);
    notify('Approaching the target. Click a skill when in range.');
  }
  function startAction(action: CombatAction | 'heal') {
    if (cast || resolving) return;
    if (action === 'heal') {
      if (rpg.hp === stats.maxHp) {
        notify('Your health is full. Save your draught for the trail.');
        return;
      }
      if (!rpg.potions) {
        notify('No draughts left. Return to Haven to replenish.');
        return;
      }
    } else {
      if (!enemy) return;
      if (Math.hypot(position[0] - enemy.x, position[1] - enemy.z) > 3.3) {
        walkToEnemy(enemy.id);
        return;
      }
    }
    const tier: ActionTier =
      action === 'strike' ? 'quick' : action === 'ritual' ? 'ritual' : 'focus';
    const key = `${save.slotId ?? 'legacy'}:${rpg.expedition}:${enemy?.id ?? 'heal'}:${crypto.randomUUID()}`;
    setCast({
      question: makeActionQuestion(tier, save.settings.difficulty, save.seed, key),
      action,
      enemyId: action === 'heal' ? undefined : enemy!.id,
      title:
        action === 'heal' ? 'Awaken a healing draught' : `${enemy!.name} · ${ACTIONS[action].name}`,
    });
  }
  function answerAction(value: string, correct: boolean, hinted: boolean, durationMs: number) {
    if (!cast) return;
    const s = currentSave.current,
      old = s.rpg!;
    const next =
      cast.action === 'heal'
        ? correct
          ? usePotion(old)
          : old
        : attackEnemy(old, cast.enemyId!, cast.action, correct);
    const attempt = {
      questionId: cast.question.id,
      topic: cast.question.topic,
      difficulty: cast.question.difficulty,
      answer: value,
      correct,
      hinted: hinted || s.hintedQuestions.includes(cast.question.id),
      durationMs,
      at: new Date().toISOString(),
    };
    setSave({
      ...s,
      rpg: next,
      xp: next.xp,
      expedition: next.expedition,
      attempts: [...s.attempts, attempt].slice(-10000),
    });
    if (correct) {
      sound(s.settings.sound);
      const found = next.inventory.find((i) => !old.inventory.some((o) => o.id === i.id));
      // Persist rewards immediately; hold only the visual snapshot so the attack plays in the world.
      setVisualRpg(old);
      setResolving(true);
      const targetId = cast.enemyId;
      setTimeout(() => {
        setCast(null);
        if (targetId) world.current?.attackEnemy(targetId);
      }, 420);
      setTimeout(() => {
        setVisualRpg(null);
        setResolving(false);
        if (found) {
          setLoot(found);
          setSelectedItem(found.id);
          world.current?.celebrateLoot();
        }
        notify(next.lastReward);
      }, 1100);
    }
    if (next.zone === 'village' && old.zone === 'wilds') {
      setCast(null);
      setSelectedEnemy(null);
      notify(next.lastReward);
    }
  }
  const finishCast = useCallback(() => setCast(null), []);
  function showHint() {
    if (!cast) return;
    setSave((s) => ({
      ...s,
      hintedQuestions: [...new Set([...s.hintedQuestions, cast.question.id])].slice(-10000),
    }));
  }
  function doEquip(item: Item) {
    const next = equipItem(rpg, item.id);
    updateRpg(next);
    notify(next.lastReward);
    sound(save.settings.sound);
  }
  function questReward() {
    const next = claimQuest(rpg);
    updateRpg(next);
    notify(next.lastReward);
    sound(save.settings.sound);
  }
  async function importFile(selected: File) {
    try {
      if (selected.size > 5000000) throw new Error('That save file is too large.');
      archiveHero(save);
      const next = validateSave(JSON.parse(await selected.text()));
      const prior = localStorage.getItem(SAVE_KEY);
      if (prior) localStorage.setItem(SAVE_KEY + '.backup', prior);
      persistHero(next);
      loadHero(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That save could not be imported.');
    }
  }
  const activeItem =
    rpg.inventory.find((i) => i.id === selectedItem) ?? rpg.inventory[rpg.inventory.length - 1];
  return (
    <main
      className={`game ff-game ${screen !== 'play' ? 'in-menu' : ''} ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}
    >
      <Suspense fallback={<div className="world-loading">Opening the hidden world…</div>}>
        <World
          ref={world}
          save={renderSave}
          paused={paused}
          onNearby={() => {}}
          onInteract={() => {}}
          onReady={setReadySeed}
          onTargetInteract={() =>
            notify('Ancient waystones mark the trail. Your quest is to reclaim the compass shard.')
          }
          onEnemyInteract={target}
          onZoneInteract={travel}
          onPosition={(x, z) => setPosition([x, z])}
        />
      </Suspense>
      <div className="world-vignette" />
      {screen === 'menu' && (
        <div className="main-menu">
          <div className="menu-overline">
            <Compass size={15} /> THE SHATTERED COMPASS · CHAPTER I
          </div>
          <h1>
            FRACTIONS<span>FIGHTER</span>
          </h1>
          <div className="title-rule">
            <i />◆<i />
          </div>
          <p>
            The world was broken into pieces.
            <br />
            You were born to make it whole.
          </p>
          <div className="menu-buttons">
            {save.started && (
              <button className="menu-primary" onClick={() => loadHero(save)}>
                <Play size={18} />
                <span>
                  Continue adventure
                  <small>
                    {save.profile.name} · Level {stats.level} {CLASSES[rpg.classId].name}
                  </small>
                </span>
                <ArrowRight size={18} />
              </button>
            )}
            <button onClick={newGame}>
              <Plus size={18} />
              New game
              <ArrowRight size={17} />
            </button>
            <button onClick={() => openPanel('load')}>
              <BookOpen size={18} />
              Load game<small>{heroes.length || (save.started ? 1 : 0)} heroes</small>
            </button>
            <button onClick={() => openPanel('settings')}>
              <Settings2 size={18} />
              Settings
            </button>
            <button onClick={() => openPanel('parents')}>
              <Sprout size={18} />
              Learning journal
            </button>
          </div>
          <div className="menu-footnote">AN ISOMETRIC ADVENTURE POWERED BY YOUR MIND</div>
        </div>
      )}
      {screen === 'menu' && (
        <aside className="menu-world-label">
          <span>HAVEN</span>
          <strong>The last light beyond the waterfall.</strong>
          <small>Safe harbour. Uncharted wilderness. A new beginning.</small>
        </aside>
      )}
      {screen === 'create' && (
        <section className="creation-screen">
          <button className="back-link" onClick={() => setScreen('menu')}>
            <ChevronLeft size={16} /> Main menu
          </button>
          <div className="creation-heading">
            <span className="eyebrow">NEW GAME · CHOOSE YOUR LEGEND</span>
            <h1>Who will mend the world?</h1>
            <p>A face. A calling. A story that belongs to you.</p>
          </div>
          <div className="hero-creation-grid">
            <div className="hero-portrait-stage">
              <div className="portrait-halo" />
              <img
                src={portrait(draftAvatar)}
                alt={HEROES.find((h) => h.id === draftAvatar)!.name}
              />
              <div className="hero-stage-title">
                <span>{HEROES.find((h) => h.id === draftAvatar)!.heritage}</span>
                <h2>{HEROES.find((h) => h.id === draftAvatar)!.name}</h2>
                <p>{HEROES.find((h) => h.id === draftAvatar)!.subtitle}</p>
              </div>
            </div>
            <div className="creation-options">
              <h3>Choose your hero</h3>
              <div className="hero-choices">
                {HEROES.map((h) => (
                  <button
                    key={h.id}
                    className={draftAvatar === h.id ? 'selected' : ''}
                    onClick={() => setDraftAvatar(h.id)}
                    aria-label={h.name}
                    aria-pressed={draftAvatar === h.id}
                  >
                    <img src={portrait(h.id)} alt="" />
                    <small>{h.name.replace('The ', '')}</small>
                    {draftAvatar === h.id && <Check size={13} />}
                  </button>
                ))}
              </div>
              <h3>Choose your calling</h3>
              <div className="class-choices">
                {(Object.keys(CLASSES) as ClassId[]).map((id) => (
                  <button
                    key={id}
                    aria-pressed={draftClass === id}
                    onClick={() => setDraftClass(id)}
                  >
                    {classIcon(id, 23)}
                    <span>
                      {CLASSES[id].name}
                      <small>{CLASSES[id].weapon}</small>
                    </span>
                    {draftClass === id && <Check size={14} />}
                  </button>
                ))}
              </div>
              <p className="class-description">{CLASSES[draftClass].description}</p>
              <div className="creation-bottom">
                <label htmlFor="hero-name">
                  Your hero’s name
                  <input
                    id="hero-name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={24}
                    placeholder="Name your legend"
                  />
                </label>
                <button className="primary" onClick={createHero} disabled={!draftName.trim()}>
                  Enter Haven
                  <ArrowRight size={18} />
                </button>
              </div>
              <small className="creation-note">
                Your hero is saved separately. Existing adventures stay in Load Game.
              </small>
            </div>
          </div>
        </section>
      )}
      {screen === 'play' && (
        <>
          <header className="ff-topbar">
            <button
              className="ff-wordmark"
              onClick={() => {
                if (cast || resolving) return;
                setScreen('menu');
                refreshHeroes();
              }}
            >
              FRACTIONS<span>FIGHTER</span>
            </button>
            <div className="zone-heading">
              <span>
                {rpg.zone === 'village' ? 'SANCTUARY · NO ENEMIES' : 'EXPEDITION ' + rpg.expedition}
              </span>
              <h1>{rpg.zone === 'village' ? 'Haven' : 'The Emerald Wilds'}</h1>
            </div>
            <nav aria-label="Game navigation">
              <button onClick={() => openPanel('quests')}>
                <BookOpen size={17} />
                Quests
              </button>
              <button onClick={() => openPanel('inventory')}>
                <Backpack size={17} />
                Inventory
              </button>
              <button onClick={() => openPanel('settings')} aria-label="Settings">
                <Settings2 size={18} />
              </button>
              <button
                onClick={() => {
                  if (cast || resolving) return;
                  setScreen('menu');
                  refreshHeroes();
                }}
                aria-label="Main menu"
              >
                <Menu size={19} />
              </button>
            </nav>
          </header>
          <section className="ff-player">
            <img src={portrait(rpg.avatarId)} alt="" />
            <div>
              <strong>{save.profile.name}</strong>
              <small>
                Level {stats.level} {CLASSES[rpg.classId].name}
              </small>
              <div className="ff-xp">
                <i style={{ width: `${(rpg.xp % 120) / 1.2}%` }} />
              </div>
              <span>
                {rpg.xp} XP <i>◆</i> {rpg.gold} gold
              </span>
            </div>
          </section>
          <section className="ff-quest">
            <div className="eyebrow">
              <Compass size={13} />
              ACTIVE QUEST
            </div>
            <h2>{QUEST.name}</h2>
            <p>
              {quest.ready
                ? 'Return to Scout Mira in Haven.'
                : quest.claimed
                  ? 'A fraction restored. A new trail awaits.'
                  : rpg.zone === 'village'
                    ? 'Mira needs a fighter. Take the east gate into the wilds.'
                    : 'Reclaim the first compass fragment.'}
            </p>
            <div className="quest-progress">
              <i style={{ width: `${(quest.current / quest.target) * 100}%` }} />
            </div>
            <small>
              {quest.current} / {quest.target} threats overcome
            </small>
            <button className="text-button" onClick={() => openPanel('quests')}>
              Quest details
              <ArrowRight size={12} />
            </button>
          </section>
          {rpg.zone === 'village' && (
            <section className="village-card">
              <div className="eyebrow">
                <Home size={14} />
                SAFE IN HAVEN
              </div>
              <h2>Gather your courage.</h2>
              <p>
                Rest by the fountain. Check your gear.
                <br />
                The jungle is just beyond the gate.
              </p>
              <div className="village-actions">
                <button onClick={() => openPanel('quests')}>
                  <BookOpen size={16} />
                  Speak to Mira{quest.ready && <span>!</span>}
                </button>
                <button onClick={() => openPanel('inventory')}>
                  <Backpack size={16} />
                  Check equipment
                </button>
              </div>
              <button className="primary full" onClick={() => travel('wilds')}>
                {quest.claimed ? 'Begin the next expedition' : 'Enter the wilds'}
                <ArrowRight size={17} />
              </button>
            </section>
          )}
          {rpg.zone === 'wilds' && (
            <section className="enemy-tracker">
              <div>
                <span>
                  <MapIcon size={12} />
                  ON THE TRAIL
                </span>
                <button aria-label="Return to Haven" onClick={() => travel('village')}>
                  <Home size={14} />
                </button>
              </div>
              {rpg.enemies.map((e) => (
                <button
                  key={e.id}
                  disabled={e.hp === 0 || !!cast || resolving}
                  onClick={() => walkToEnemy(e.id)}
                  className={selectedEnemy === e.id ? 'tracked' : ''}
                >
                  <span
                    className={
                      e.hp === 0 ? 'enemy-done' : e.kind === 'guardian' ? 'boss-dot' : 'enemy-dot'
                    }
                  >
                    {e.hp === 0 ? (
                      <Check size={11} />
                    ) : e.kind === 'guardian' ? (
                      <Skull size={11} />
                    ) : null}
                  </span>
                  <span>
                    {e.name}
                    <i style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                  </span>
                  <small>{e.hp === 0 ? 'CLEARED' : `${e.hp} HP`}</small>
                </button>
              ))}
            </section>
          )}
          {enemy && rpg.zone === 'wilds' && !cast && !resolving && (
            <section className="combat-choice">
              <button
                className="icon-button combat-close"
                aria-label="Deselect target"
                onClick={() => setSelectedEnemy(null)}
              >
                <X size={15} />
              </button>
              <div className="eyebrow">
                {enemy.kind === 'guardian' ? 'ANCIENT GUARDIAN' : 'TARGET ACQUIRED'}
              </div>
              <h2>{enemy.name}</h2>
              <div className="enemy-health">
                <i style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                <span>
                  {enemy.hp} / {enemy.maxHp}
                </span>
              </div>
              <div className="skill-choices">
                {(['strike', 'power', 'ritual'] as CombatAction[]).map((action, i) => (
                  <button key={action} onClick={() => startAction(action)}>
                    {i === 0 ? <Swords /> : i === 1 ? <Flame /> : <Sparkles />}
                    <strong>{ACTIONS[action].name}</strong>
                    <small>
                      {i === 0
                        ? 'QUICK COMPARISON'
                        : i === 1
                          ? 'UNTIMED CALCULATION'
                          : 'DEEP THINKING'}
                    </small>
                    <span>{stats.attack * ACTIONS[action].multiplier} damage</span>
                  </button>
                ))}
              </div>
              <small className="combat-hint">
                Choose your approach. Greater thinking brings greater power.
              </small>
            </section>
          )}
          {loot && !cast && !resolving && (
            <section className={`loot-notification rarity-${loot.rarity}`}>
              <button
                className="icon-button"
                aria-label="Dismiss loot"
                onClick={() => setLoot(null)}
              >
                <X size={14} />
              </button>
              <span className="loot-kicker">
                <Gem size={13} />
                {loot.rarity.toUpperCase()} TREASURE FOUND
              </span>
              <div className="loot-main">
                {itemIcon(loot.slot, 34)}
                <div>
                  <h3>{loot.name}</h3>
                  <span>
                    {loot.attack
                      ? `Attack ${stats.attack} → ${stats.attack + loot.attack - (rpg.inventory.find((i) => i.id === rpg.equipment[loot.slot])?.attack ?? 0)}`
                      : `Defence ${stats.defence} → ${stats.defence + loot.defence - (rpg.inventory.find((i) => i.id === rpg.equipment[loot.slot])?.defence ?? 0)}`}{' '}
                    · {TOPICS[loot.topic]}
                  </span>
                </div>
              </div>
              <div className="loot-actions">
                <button
                  className="primary"
                  onClick={() => {
                    doEquip(loot);
                    setLoot(null);
                  }}
                >
                  Equip now
                  <Check size={14} />
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedItem(loot.id);
                    setPanel('inventory');
                    setLoot(null);
                  }}
                >
                  Inspect
                  <ArrowRight size={13} />
                </button>
              </div>
            </section>
          )}
          <div className="ff-status-location">
            <Leaf size={12} />
            {rpg.zone === 'village'
              ? 'Haven is safe. Your health and draughts are restored.'
              : 'Click ground to move · Click a monster to fight'}
          </div>
          <section className="ff-actionbar">
            <div
              className="health-orb"
              style={{ '--fill': `${(rpg.hp / stats.maxHp) * 100}%` } as React.CSSProperties}
            >
              <Heart size={22} />
              <strong>{rpg.hp}</strong>
              <span>HEALTH</span>
            </div>
            <div className="bar-centre">
              <div className="bar-skills">
                <button
                  onClick={() =>
                    enemy
                      ? startAction('strike')
                      : notify('Click a monster in the wilds to choose your attack.')
                  }
                  disabled={!!cast || resolving}
                >
                  <Swords size={22} />
                  <span>Strike</span>
                  <kbd>QUICK</kbd>
                </button>
                <button
                  onClick={() =>
                    enemy ? startAction('power') : notify('Select a monster to use a power skill.')
                  }
                  disabled={!!cast || resolving}
                >
                  <Flame size={22} />
                  <span>Power</span>
                  <kbd>FOCUS</kbd>
                </button>
                <button
                  onClick={() =>
                    enemy
                      ? startAction('ritual')
                      : notify('Select a monster to channel an ancient ritual.')
                  }
                  disabled={!!cast || resolving}
                >
                  <Sparkles size={22} />
                  <span>Ritual</span>
                  <kbd>DEEP</kbd>
                </button>
                <div className="bar-divider" />
                <button onClick={() => startAction('heal')} disabled={!!cast || resolving}>
                  <Heart size={21} />
                  <span>Draught</span>
                  <kbd>×{rpg.potions}</kbd>
                </button>
                <button onClick={() => openPanel('inventory')}>
                  <Backpack size={22} />
                  <span>Inventory</span>
                  <kbd>I</kbd>
                </button>
                <button onClick={() => openPanel('quests')}>
                  <BookOpen size={22} />
                  <span>Journal</span>
                  <kbd>J</kbd>
                </button>
              </div>
              <div className="bar-bottom">
                <span>
                  {rpg.zone === 'village'
                    ? 'A haven for every hero.'
                    : 'Steel, cunning, and a little magic.'}
                </span>
                <span>
                  <Coins size={11} />
                  {rpg.gold}
                  <i>◆</i>
                  <Swords size={11} />
                  {stats.attack}
                  <Shield size={11} />
                  {stats.defence}
                </span>
              </div>
            </div>
            <div className="level-medallion">
              <Compass size={26} />
              <strong>{stats.level}</strong>
              <span>LEVEL</span>
            </div>
          </section>
        </>
      )}
      {screen !== 'play' && (
        <footer className="menu-footer">
          <span>FRACTIONS FIGHTER · DEVELOPMENT BUILD 0.2</span>
          <button onClick={() => openPanel('help')}>How to play</button>
          <button
            aria-label={save.settings.sound ? 'Mute sound' : 'Enable sound'}
            onClick={() => {
              setSave((s) => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }));
              sound(!save.settings.sound);
            }}
          >
            {save.settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </footer>
      )}
      {resolving && !cast && (
        <div className="impact-banner">
          <Swords size={22} />
          <strong>POWER UNLEASHED</strong>
        </div>
      )}
      {toast && (
        <div className="toast ff-toast" role="status">
          <Sparkles size={16} />
          {toast}
        </div>
      )}
      {error && (
        <div className="ff-error" role="alert">
          <span>{error}</span>
          <button
            onClick={() => {
              try {
                exportJson(localStorage.getItem(SAVE_KEY) ?? '', 'fractions-fighter-backup.json');
              } catch {}
            }}
          >
            Export backup
          </button>
          <button aria-label="Dismiss storage message" onClick={() => setError('')}>
            <X size={14} />
          </button>
        </div>
      )}
      <input
        ref={file}
        type="file"
        hidden
        accept="application/json,.json"
        aria-label="Import save file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = '';
        }}
      />
      {panel === 'load' && (
        <Modal title="Your legends await." eyebrow="LOAD GAME" onClose={closePanel} wide>
          <p>Each hero keeps their own equipment, quests and learning history.</p>
          <div className="saved-hero-list">
            {(heroes.length
              ? heroes
              : save.started
                ? [{ id: save.slotId ?? 'legacy', updated: new Date().toISOString(), save }]
                : []
            ).map((h) => (
              <button key={h.id} onClick={() => loadHero(h.save)}>
                <img src={portrait(h.save.rpg?.avatarId ?? '7')} alt="" />
                <span>
                  <strong>{h.save.profile.name}</strong>
                  <small>
                    {CLASSES[h.save.rpg?.classId ?? 'warden'].name} ·{' '}
                    {h.save.rpg?.zone === 'wilds' ? 'Emerald Wilds' : 'Haven'} ·{' '}
                    {h.save.rpg?.xp ?? h.save.xp} XP
                  </small>
                  <small>{new Date(h.updated).toLocaleDateString()}</small>
                </span>
                <ArrowRight size={20} />
              </button>
            ))}
          </div>
          {!heroes.length && !save.started && (
            <div className="empty-panel">
              <BookOpen size={35} />
              <h3>No legends written. Yet.</h3>
              <p>Create a hero to start your first adventure.</p>
              <button className="primary" onClick={newGame}>
                New game
                <Plus size={16} />
              </button>
            </div>
          )}
          <button className="secondary" onClick={() => file.current?.click()}>
            <Upload size={16} />
            Import a hero from another device
          </button>
        </Modal>
      )}
      {panel === 'inventory' && (
        <Modal
          title="Every treasure tells a story."
          eyebrow={`${save.profile.name.toUpperCase()} · INVENTORY`}
          onClose={closePanel}
          wide
        >
          <div className="inventory-stats">
            <span>
              <Swords size={16} />
              {stats.attack} Attack
            </span>
            <span>
              <Shield size={16} />
              {stats.defence} Defence
            </span>
            <span>
              <Heart size={16} />
              {stats.maxHp} Health
            </span>
            <span>
              <Coins size={16} />
              {rpg.gold} Gold
            </span>
          </div>
          <div className="inventory-layout">
            <div className="equipped-panel">
              <img src={portrait(rpg.avatarId)} alt={save.profile.name} />
              <h3>Equipped</h3>
              {(['weapon', 'armour', 'relic'] as ItemSlot[]).map((slot) => {
                const item = rpg.inventory.find((i) => i.id === rpg.equipment[slot]);
                return (
                  <button
                    key={slot}
                    className={`equip-slot ${item ? 'rarity-' + item.rarity : ''}`}
                    onClick={() => item && setSelectedItem(item.id)}
                  >
                    {itemIcon(slot, 19)}
                    <span>
                      <small>{slot.toUpperCase()}</small>
                      <strong>{item?.name ?? 'Empty slot'}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pack-panel">
              <h3>
                Your pack <span>{rpg.inventory.length} items</span>
              </h3>
              <div className="pack-grid">
                {rpg.inventory.map((item) => (
                  <button
                    key={item.id}
                    className={`pack-item rarity-${item.rarity} ${activeItem.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item.id)}
                    aria-label={`Inspect ${item.name}`}
                  >
                    {itemIcon(item.slot, 25)}
                    <small>{item.name}</small>
                    {rpg.equipment[item.slot] === item.id && <Check size={12} />}
                  </button>
                ))}
              </div>
              <article className={`item-detail rarity-${activeItem.rarity}`}>
                <span>
                  {activeItem.rarity.toUpperCase()} {activeItem.slot.toUpperCase()}
                </span>
                <h3>{activeItem.name}</h3>
                <p>{activeItem.description}</p>
                <div>
                  {activeItem.attack > 0 && <strong>+{activeItem.attack} attack</strong>}
                  {activeItem.defence > 0 && <strong>+{activeItem.defence} defence</strong>}
                  <small>Affinity: {TOPICS[activeItem.topic]}</small>
                  {rpg.equipment[activeItem.slot] !== activeItem.id && (
                    <small className="upgrade-comparison">
                      {activeItem.slot === 'armour'
                        ? `Total defence: ${stats.defence} → ${stats.defence + activeItem.defence - (rpg.inventory.find((i) => i.id === rpg.equipment.armour)?.defence ?? 0)}`
                        : `Total attack: ${stats.attack} → ${stats.attack + activeItem.attack - (rpg.inventory.find((i) => i.id === rpg.equipment[activeItem.slot])?.attack ?? 0)}`}
                    </small>
                  )}
                </div>
                <button
                  className="primary full"
                  disabled={rpg.equipment[activeItem.slot] === activeItem.id}
                  onClick={() => doEquip(activeItem)}
                >
                  {rpg.equipment[activeItem.slot] === activeItem.id
                    ? 'Equipped'
                    : 'Equip ' + activeItem.name}
                  <Check size={15} />
                </button>
              </article>
            </div>
          </div>
        </Modal>
      )}
      {panel === 'quests' && (
        <Modal title={QUEST.name} eyebrow="SCOUT MIRA · HAVEN" onClose={closePanel} wide>
          <div className="quest-dialogue">
            <Compass size={63} strokeWidth={1} />
            <div>
              <blockquote>
                “A world can be broken into fractions.
                <br />A fighter can bring them together.”
              </blockquote>
              <p>{STORY}</p>
            </div>
          </div>
          <p>{QUEST.description}</p>
          <div className="quest-checklist">
            {rpg.enemies.map((e) => (
              <div key={e.id}>
                <span className={e.hp === 0 ? 'checked' : ''}>
                  {e.hp === 0 ? <Check size={13} /> : <Swords size={13} />}
                </span>
                <strong>{e.name}</strong>
                <small>
                  {e.hp === 0
                    ? 'COMPLETED'
                    : e.kind === 'guardian'
                      ? 'COMPASS FRAGMENT'
                      : 'JUNGLE THREAT'}
                </small>
              </div>
            ))}
          </div>
          <div className="quest-rewards">
            <span>
              <Coins size={17} />
              {QUEST.gold} gold
            </span>
            <span>
              <Sparkles size={17} />
              {QUEST.xp} XP
            </span>
            <span>
              <Gem size={17} />A fraction restored
            </span>
          </div>
          {quest.ready && rpg.zone === 'village' ? (
            <button className="primary full" onClick={questReward}>
              Claim Mira’s reward
              <Trophy size={18} />
            </button>
          ) : (
            <button
              className="primary full"
              onClick={() => travel(rpg.zone === 'village' ? 'wilds' : 'village')}
            >
              {rpg.zone === 'village'
                ? quest.claimed
                  ? 'Seek the next fragment'
                  : 'Take the east gate'
                : 'Return to Haven'}
              <ArrowRight size={17} />
            </button>
          )}
        </Modal>
      )}
      {panel === 'settings' && (
        <Modal title="Shape your adventure." eyebrow="SETTINGS" onClose={closePanel}>
          <p>Only quick, simple runes use a timer. Power skills and rituals always wait for you.</p>
          <div className="difficulty-list">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
              <button
                key={d}
                aria-pressed={save.settings.difficulty === d}
                onClick={() =>
                  setSave((s) => ({ ...s, settings: { ...s.settings, difficulty: d } }))
                }
              >
                <span>
                  {classIcon(
                    d === 'explorer' ? 'warden' : d === 'adventurer' ? 'ranger' : 'arcanist',
                    20,
                  )}
                </span>
                <span>
                  <strong>{DIFFICULTIES[d].label}</strong>
                  <small>{DIFFICULTIES[d].description}</small>
                </span>
                {save.settings.difficulty === d && <Check size={17} />}
              </button>
            ))}
          </div>
          <label className="toggle-row">
            <span>
              <strong>Falling quick runes</strong>
              <small>12 seconds for easy comparisons. Turn off for untimed play.</small>
            </span>
            <input
              type="checkbox"
              checked={save.quickTimer !== false}
              onChange={(e) => setSave((s) => ({ ...s, quickTimer: e.target.checked }))}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Relic sounds</strong>
              <small>Hear your successful spells.</small>
            </span>
            <input
              type="checkbox"
              checked={save.settings.sound}
              onChange={(e) =>
                setSave((s) => ({ ...s, settings: { ...s.settings, sound: e.target.checked } }))
              }
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Reduced motion</strong>
              <small>Still animations; quick runes also stop falling.</small>
            </span>
            <input
              type="checkbox"
              checked={save.settings.reducedMotion}
              onChange={(e) =>
                setSave((s) => ({
                  ...s,
                  settings: { ...s.settings, reducedMotion: e.target.checked },
                }))
              }
            />
          </label>
          <button className="primary full" onClick={closePanel}>
            Save & return
            <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {panel === 'parents' && (
        <Modal
          title="The learning behind the legend."
          eyebrow="LEARNING JOURNAL · FOR PARENTS"
          onClose={closePanel}
          wide
        >
          <p>
            {save.profile.name}’s actual attempts. Each question counts once. First try means an
            independent answer without hints; retries support progress without inflating the score.
          </p>
          <div className="report-summary">
            <div>
              <strong>{reports.reduce((n, r) => n + r.questions, 0)}</strong>
              <span>questions explored</span>
            </div>
            <div>
              <strong>{reports.reduce((n, r) => n + r.independent, 0)}</strong>
              <span>independent first tries</span>
            </div>
            <div>
              <strong>{rpg.defeated}</strong>
              <span>encounters won</span>
            </div>
          </div>
          <div className="topic-table">
            <div className="topic-header">
              <span>Maths area</span>
              <span>First try</span>
              <span>Questions</span>
              <span>With support</span>
            </div>
            {reports.map((r) => (
              <div className="topic-row" key={r.topic}>
                <span>
                  <span>
                    {r.name}
                    <small>
                      {r.questions < 5
                        ? 'More evidence needed'
                        : r.accuracy! >= 80
                          ? 'Promising progress'
                          : 'Worth practising together'}
                    </small>
                  </span>
                </span>
                <span>{r.accuracy === null ? '—' : r.accuracy + '%'}</span>
                <span>{r.questions}</span>
                <span>{r.assisted}</span>
              </div>
            ))}
          </div>
          <div className="note">
            <Sprout size={18} />
            <span>
              Short runes practise fluency. Stronger skills call for deeper work. These are practice
              observations, not an exam prediction; results mix difficulties and show the latest
              10,000 attempts.
            </span>
          </div>
          <div className="save-actions">
            <button
              className="secondary"
              onClick={() =>
                exportJson(
                  JSON.stringify(save, null, 2),
                  'fractions-fighter-' + save.profile.name.replace(/[^a-z0-9]/gi, '-') + '.json',
                )
              }
            >
              <Download size={16} />
              Export this hero
            </button>
            <button className="secondary" onClick={() => file.current?.click()}>
              <Upload size={16} />
              Import hero
            </button>
          </div>
          <small className="privacy-note">
            <Shield size={13} />
            Local browser saves. Export for device transfer or backup. No cloud sync or tracking.
            This view is not password-protected.
          </small>
        </Modal>
      )}
      {panel === 'help' && (
        <Modal title="A fighter’s field guide." eyebrow="HOW TO PLAY" onClose={closePanel}>
          <div className="howto-step">
            <Home />
            <div>
              <strong>Prepare in Haven</strong>
              <p>
                Choose a hero and class through New Game. Mira gives the compass quest. The village
                restores health and draughts.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <Swords />
            <div>
              <strong>Click to explore. Click to fight.</strong>
              <p>
                Enter the wilds. Click ground to walk and a monster to approach it. Your trail list
                also guides you to targets.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <Sparkles />
            <div>
              <strong>Match your thinking to your power</strong>
              <p>
                Quick strike: a simple falling &lt; = &gt; rune. Power skill: an untimed calculation
                for ×3 damage. Ancient ritual: a harder division for ×7 damage. Missed quick timers
                cause no damage; hints and relaxed mode are available.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <Backpack />
            <div>
              <strong>Find loot. Grow stronger.</strong>
              <p>
                Every defeated enemy drops gear. Equip it from Inventory (I). Clear five threats,
                return to Mira, claim the reward, then seek the next compass fragment.
              </p>
            </div>
          </div>
          <button className="primary full" onClick={closePanel}>
            Let’s play
            <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {cast && (
        <MathEncounter
          key={cast.question.id}
          question={cast.question}
          title={cast.title}
          timed={save.quickTimer !== false && !save.settings.reducedMotion}
          alreadyHinted={save.hintedQuestions.includes(cast.question.id)}
          onHint={showHint}
          onAnswer={answerAction}
          onFinish={finishCast}
          onClose={finishCast}
        />
      )}
    </main>
  );
}

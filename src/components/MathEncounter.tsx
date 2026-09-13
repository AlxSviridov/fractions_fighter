import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Lightbulb, Pause, Shield, Sparkles, X } from 'lucide-react';
import type { ActionQuestion } from '../game/actionMath';
import { isActionCorrect } from '../game/actionMath';
import { Modal } from './Modal';
type Props = {
  question: ActionQuestion;
  mistakeFeedback?: string;
  defending?: boolean;
  defenceInfo?: { incoming: number; armour: number; damage: number };
  onTimeout?: () => void;
  title: string;
  timed: boolean;
  alreadyHinted: boolean;
  onHint: () => void;
  onAnswer: (answer: string, correct: boolean, hinted: boolean, duration: number) => void;
  onFinish: () => void;
  onClose: () => void;
};
export function MathEncounter(p: Props) {
  const [answer, setAnswer] = useState(''),
    [hint, setHint] = useState(p.alreadyHinted),
    [result, setResult] = useState<'correct' | 'wrong' | 'missed' | null>(null),
    [remaining, setRemaining] = useState(1),
    [relaxed, setRelaxed] = useState(false);
  const time = useRef({ last: performance.now(), active: 0 }),
    lock = useRef(false),
    input = useRef<HTMLInputElement>(null),
    onFinish = useRef(p.onFinish);
  onFinish.current = p.onFinish;
  const onTimeout = useRef(p.onTimeout);
  onTimeout.current = p.onTimeout;
  const quick = p.question.tier === 'quick';
  const duration = p.question.timeLimitMs ?? 12000;
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      if (!document.hidden && !lock.current) {
        time.current.active += now - time.current.last;
      }
      time.current.last = now;
      if (quick && p.timed && !hint && !relaxed && !lock.current) {
        const left = Math.max(0, 1 - time.current.active / duration);
        setRemaining(left);
        if (left === 0) {
          if (onTimeout.current) {
            lock.current = true;
            onTimeout.current();
            return;
          }
          setResult('missed');
          setRelaxed(true);
        }
      }
    }, 50);
    return () => clearInterval(id);
  }, [quick, p.timed, hint, relaxed, duration]);
  useEffect(() => {
    if (result === 'correct' && quick) {
      const id = setTimeout(() => onFinish.current(), 850);
      return () => clearTimeout(id);
    }
  }, [result, quick]);
  function submit(value: string) {
    if (lock.current || !value.trim()) return;
    const correct = isActionCorrect(p.question, value);
    lock.current = correct || !!p.defending;
    setResult(correct ? 'correct' : 'wrong');
    p.onAnswer(
      value,
      correct,
      hint || result === 'missed',
      Math.min(86400000, Math.round(time.current.active)),
    );
    if (!correct) {
      setAnswer('');
      setRelaxed(true);
      input.current?.focus();
    }
  }
  function help() {
    setHint(true);
    setRelaxed(true);
    p.onHint();
  }
  const content = (
    <>
      {p.defending && p.defenceInfo && (
        <div className="defence-breakdown">
          <Shield size={18} />
          <strong>Correct rune: block the attack</strong>
          <span>
            Attack {p.defenceInfo.incoming} · Armour absorbs {p.defenceInfo.armour} ·{' '}
            {p.defenceInfo.damage} health at risk
            {p.defenceInfo.incoming - p.defenceInfo.armour > p.defenceInfo.damage
              ? ' (ward limits the impact)'
              : ''}
          </span>
        </div>
      )}
      <div className="rune-meta">
        <span>
          {quick
            ? p.defending
              ? 'INCOMING ATTACK · DEFEND'
              : 'QUICK RUNE · BASIC STRIKE'
            : p.question.tier === 'ritual'
              ? 'ANCIENT RITUAL · ×7 DAMAGE'
              : 'FOCUS SKILL · ×3 POWER'}
        </span>
        <span>
          <Shield size={12} />
          {quick && !relaxed && p.timed && !hint
            ? `${duration / 1000}-second rune`
            : 'Take your time'}
        </span>
      </div>
      {result === 'correct' ? (
        <div className="rune-success">
          <Check size={36} />
          <h3>{quick ? 'Direct hit!' : 'Power unleashed.'}</h3>
          <p>{p.question.explanation}</p>
          {!quick && (
            <button className="primary full" onClick={p.onFinish}>
              Return to the fight
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <>
          {quick ? (
            <div className="rune-fall-lane">
              <div
                className="rune-fall-card"
                style={{
                  transform: `translateY(${p.timed && !relaxed && !hint ? (1 - remaining) * 58 : 16}px)`,
                }}
              >
                <span>{p.question.prompt.split(' ◇ ')[0]}</span>
                <i>?</i>
                <span>{p.question.prompt.split(' ◇ ')[1]}</span>
              </div>
              <div className="rune-catch-line" />
              <div className="rune-countdown">
                <i style={{ width: `${remaining * 100}%` }} />
              </div>
            </div>
          ) : (
            <h3 className="math-prompt word-problem">{p.question.prompt}</h3>
          )}
          {p.question.choices ? (
            <div className="rune-answers">
              {p.question.choices.map((c) => (
                <button
                  key={c}
                  autoFocus={c === p.question.choices![0]}
                  aria-label={`Answer ${c}`}
                  onClick={() => submit(c)}
                >
                  {c}
                  <small>{c === '<' ? 'LESS THAN' : c === '>' ? 'GREATER THAN' : 'EQUAL TO'}</small>
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(answer);
              }}
            >
              <label htmlFor="action-answer" className="answer-label">
                Your answer{p.question.unit ? ` (${p.question.unit})` : ''}
              </label>
              <div className="answer-input">
                <input
                  ref={input}
                  id="action-answer"
                  data-autofocus
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Work it out, then cast"
                  inputMode="decimal"
                  maxLength={30}
                />
                <button className="primary" type="submit" disabled={!answer.trim()}>
                  Unleash
                  <Sparkles size={16} />
                </button>
              </div>
              <label className="scratch-label" htmlFor="scratch">
                Your working (optional, not marked)
              </label>
              <textarea id="scratch" rows={3} placeholder="Split numbers, jot down steps…" />
            </form>
          )}
          {result === 'wrong' && (
            <p className="rune-feedback" role="status">
              {p.mistakeFeedback || 'Your ward caught the blow. Try again — or use a hint.'}
            </p>
          )}
          {result === 'missed' && (
            <p className="rune-feedback" role="status">
              The rune slipped past. No damage taken. Solve it at your pace.
            </p>
          )}
          {hint ? (
            <div className="hint-box">
              <Lightbulb size={16} />
              <div>
                <p>{p.question.hint}</p>
                <details>
                  <summary>Show the method</summary>
                  <p>{p.question.explanation}</p>
                </details>
              </div>
            </div>
          ) : (
            <button className="hint-button" onClick={help}>
              <Lightbulb size={14} />
              Show a hint<span>{quick ? 'Stops the falling rune' : 'A method, not a penalty'}</span>
            </button>
          )}
          {quick && p.timed && !relaxed && !hint && (
            <button className="relax-button" onClick={() => setRelaxed(true)}>
              <Pause size={12} />
              Let me think
            </button>
          )}
        </>
      )}
    </>
  );
  if (quick)
    return (
      <section className="quick-encounter" role="dialog" aria-modal="false" aria-label={p.title}>
        <button
          className="icon-button quick-close"
          aria-label="Leave encounter"
          onClick={p.onClose}
        >
          <X size={17} />
        </button>
        <h2>{p.title}</h2>
        {content}
      </section>
    );
  return (
    <Modal title={p.title} eyebrow="CHANNEL YOUR POWER" onClose={p.onClose}>
      {content}
    </Modal>
  );
}

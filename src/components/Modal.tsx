import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current!;
    const focusable = () =>
      [
        ...node.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, a[href], textarea, [tabindex="0"]',
        ),
      ].filter((e) => e.getClientRects().length > 0 && !e.hidden);
    const first = node.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0];
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        const all = focusable();
        if (!all.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    node.addEventListener('keydown', key);
    return () => {
      node.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop">
      <section
        ref={ref}
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
        <div className="eyebrow">{eyebrow}</div>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

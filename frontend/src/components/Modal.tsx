import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { usePresence } from './Presence';

interface Props { title: string; onClose: () => void; children: ReactNode; small?: boolean }

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export default function Modal({ title, onClose, children, small }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { leaving, done } = usePresence();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Foca o primeiro campo; em confirmações de risco, foca o botão de voltar
    if (!ref.current?.contains(document.activeElement)) {
      ref.current?.querySelector<HTMLElement>('input, textarea, select, [data-autofocus], button.primary:not(.danger)')?.focus();
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  // Mantém o foco dentro do diálogo ao navegar com Tab
  const trapTab = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return createPortal(
    <div
      className={`modal-backdrop${leaving ? ' leaving' : ''}`}
      onMouseDown={(e) => !leaving && e.target === e.currentTarget && onClose()}
      onAnimationEnd={(e) => leaving && e.target === e.currentTarget && done()}
    >
      <div ref={ref} className={`modal${small ? ' modal-small' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={trapTab}>
        <header className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar"><Icon name="x" /></button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}

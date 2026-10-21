import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface Props { title: string; onClose: () => void; children: ReactNode; small?: boolean }

export default function Modal({ title, onClose, children, small }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Foca o primeiro campo para o usuário já sair digitando (a menos que o formulário use autoFocus)
    if (!ref.current?.contains(document.activeElement)) {
      ref.current?.querySelector<HTMLElement>('input, textarea, select, button.primary')?.focus();
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal${small ? ' modal-small' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
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

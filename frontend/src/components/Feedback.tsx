import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import Modal from './Modal';

interface Toast { id: number; message: string; type: 'success' | 'error'; action?: { label: string; to: string } }
interface ConfirmOptions { title: string; message?: string; confirmLabel?: string; danger?: boolean }

interface FeedbackState {
  toast: (message: string, opts?: { type?: Toast['type']; action?: Toast['action'] }) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackState | null>(null);

/** Notificações rápidas (toast) e diálogo de confirmação usados em todas as telas. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(ok: boolean) => void>();
  const nextId = useRef(0);

  const dismiss = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));

  const toast = useCallback<FeedbackState['toast']>((message, opts = {}) => {
    const id = ++nextId.current;
    setToasts((list) => [...list, { id, message, type: opts.type ?? 'success', action: opts.action }]);
    setTimeout(() => dismiss(id), opts.action ? 7000 : 3500);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setPending(opts);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const answer = (ok: boolean) => {
    resolver.current?.(ok);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'success' ? 'check' : 'x'} />
            <span>{t.message}</span>
            {t.action && (
              <button className="toast-action" onClick={() => { dismiss(t.id); navigate(t.action!.to); }}>
                {t.action.label}
              </button>
            )}
            <button className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Fechar"><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
      {pending && (
        <Modal title={pending.title} onClose={() => answer(false)} small>
          {pending.message && <p className="muted">{pending.message}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={() => answer(false)}>Voltar</button>
            <button type="button" className={pending.danger ? 'danger primary' : 'primary'} onClick={() => answer(true)}>
              {pending.confirmLabel ?? 'Confirmar'}
            </button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  return ctx;
}

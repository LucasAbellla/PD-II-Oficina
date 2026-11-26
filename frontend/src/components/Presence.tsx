import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface PresenceState { leaving: boolean; done: () => void }

const PresenceContext = createContext<PresenceState>({ leaving: false, done: () => undefined });
export const usePresence = () => useContext(PresenceContext);

/**
 * Mantém o conteúdo montado enquanto a animação de saída roda.
 * Uso: <Presence>{aberto && <Modal … />}</Presence>
 */
export default function Presence({ children }: { children: ReactNode }) {
  const last = useRef<ReactNode>(null);
  const [, rerender] = useState(0);
  const visible = Boolean(children);
  if (visible) last.current = children;
  const leaving = !visible && last.current !== null;

  const done = () => {
    if (!leaving) return;
    last.current = null;
    rerender((n) => n + 1);
  };

  // Garante a remoção mesmo se o evento de fim de animação não disparar
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(done, 400);
    return () => clearTimeout(timer);
  });

  return <PresenceContext.Provider value={{ leaving, done }}>{visible ? children : last.current}</PresenceContext.Provider>;
}

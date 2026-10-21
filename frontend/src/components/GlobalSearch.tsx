import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import type { Customer, Paged, Vehicle } from '../types';
import Icon from './Icon';

interface Result { key: string; group: 'Veículos' | 'Clientes'; title: string; subtitle: string; to: string }

/** Busca rápida por placa ou cliente, disponível em todas as telas (atalho: tecla "/"). */
export default function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const debounced = useDebounce(term.trim(), 250);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (debounced.length < 2) return setResults([]);
    let cancelled = false;
    const q = encodeURIComponent(debounced);
    Promise.all([
      api<Paged<Vehicle>>(`/vehicles?pageSize=5&search=${q}`),
      api<Paged<Customer>>(`/customers?pageSize=5&search=${q}`),
    ])
      .then(([vehicles, customers]) => {
        if (cancelled) return;
        setResults([
          ...vehicles.data.map((v): Result => ({
            key: `v-${v.id}`, group: 'Veículos', title: v.plate,
            subtitle: `${v.brand} ${v.model} · ${v.customer?.name ?? ''}`, to: `/veiculos/${v.id}/historico`,
          })),
          ...customers.data.map((c): Result => ({
            key: `c-${c.id}`, group: 'Clientes', title: c.name, subtitle: c.phone ?? c.email ?? '', to: `/clientes/${c.id}`,
          })),
        ]);
        setActive(0);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [debounced]);

  const go = (r: Result) => {
    navigate(r.to);
    setTerm('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) go(results[active]);
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div className="global-search combo">
      <Icon name="search" />
      <input
        ref={inputRef}
        value={term}
        placeholder="Buscar placa ou cliente…"
        aria-label="Busca rápida por placa ou cliente"
        autoComplete="off"
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <kbd>/</kbd>
      {open && debounced.length >= 2 && (
        <ul className="combo-list" role="listbox">
          {results.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(r); }}>
              {(i === 0 || results[i - 1].group !== r.group) && <span className="combo-group">{r.group}</span>}
              <strong>{r.title}</strong> <span className="muted">{r.subtitle}</span>
            </li>
          ))}
          {results.length === 0 && <li className="combo-empty">Nenhum cliente ou veículo encontrado</li>}
        </ul>
      )}
    </div>
  );
}

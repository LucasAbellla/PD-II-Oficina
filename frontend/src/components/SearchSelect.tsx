import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface Props<T extends { id: string }> {
  value: T | null;
  onChange: (item: T | null) => void;
  search: (term: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  renderOption?: (item: T) => ReactNode;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  emptyText?: string;
}

/** Campo de seleção com busca (autocomplete), navegável pelo teclado. */
export default function SearchSelect<T extends { id: string }>(props: Props<T>) {
  const { value, onChange, search, getLabel, renderOption, placeholder, id, invalid, emptyText } = props;
  const [term, setTerm] = useState(value ? getLabel(value) : '');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<T[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term, 250);
  const request = useRef(0);

  useEffect(() => { setTerm(value ? getLabel(value) : ''); }, [value]);

  useEffect(() => {
    if (!open) return;
    const current = ++request.current;
    setLoading(true);
    search(value ? '' : debounced)
      .then((list) => { if (current === request.current) { setOptions(list); setActive(0); } })
      .catch(() => undefined)
      .finally(() => { if (current === request.current) setLoading(false); });
  }, [debounced, open]);

  const select = (item: T) => {
    onChange(item);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && open && options[active]) { e.preventDefault(); select(options[active]); }
    if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }
  };

  return (
    <div className="combo">
      <input
        id={id}
        value={term}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
      />
      {open && (
        <ul className="combo-list" role="listbox">
          {options.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); select(item); }}
            >
              {renderOption ? renderOption(item) : getLabel(item)}
            </li>
          ))}
          {!loading && options.length === 0 && <li className="combo-empty">{emptyText ?? 'Nada encontrado'}</li>}
        </ul>
      )}
    </div>
  );
}

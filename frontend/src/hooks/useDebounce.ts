import { useEffect, useState } from 'react';

/** Atrasa a atualização do valor para não disparar uma requisição a cada tecla. */
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

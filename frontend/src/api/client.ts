const BASE: string = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'oficina_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: { field: string; message: string }[]) {
    super(message);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    throw new ApiError(res.status, json.error ?? 'Erro inesperado', json.details);
  }
  return json as T;
}

/** Mensagem amigável a partir de um erro da API (inclui erros de campo). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    return e.details?.length ? e.details.map((d) => `${d.field}: ${d.message}`).join(' · ') : e.message;
  }
  return 'Não foi possível conectar ao servidor';
}

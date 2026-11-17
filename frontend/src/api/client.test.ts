import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, errorMessage, fieldErrors, tokenStore } from './client';

function respostaJson(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

beforeEach(() => {
  const dados = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
  });
  vi.stubGlobal('window', { location: { href: '/' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api', () => {
  it('envia o token e o corpo em JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(201, { id: '1' }));
    vi.stubGlobal('fetch', fetchMock);
    tokenStore.set('abc');

    await expect(api('/customers', { method: 'POST', body: { name: 'Ana' } })).resolves.toEqual({ id: '1' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/customers');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' });
    expect(init.body).toBe('{"name":"Ana"}');
  });

  it('retorna undefined em 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(204)));
    await expect(api('/auth/me/password', { method: 'PATCH', body: {} })).resolves.toBeUndefined();
  });

  it('descarta o token e volta ao login quando a sessão expira', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(401, { error: 'Token inválido ou expirado' })));
    tokenStore.set('expirado');

    await expect(api('/customers')).rejects.toMatchObject({ status: 401, message: 'Token inválido ou expirado' });
    expect(tokenStore.get()).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('repassa os erros de campo da API', async () => {
    const details = [{ field: 'plate', message: 'Placa inválida' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(400, { error: 'Dados inválidos', details })));

    const erro = await api('/vehicles', { method: 'POST', body: {} }).catch((e: ApiError) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).details).toEqual(details);
  });
});

describe('mensagens de erro', () => {
  it('agrupa erros por campo', () => {
    const erro = new ApiError(400, 'Dados inválidos', [
      { field: 'name', message: 'Nome obrigatório' },
      { field: 'plate', message: 'Placa inválida' },
    ]);
    expect(fieldErrors(erro)).toEqual({ name: 'Nome obrigatório', plate: 'Placa inválida' });
    expect(errorMessage(erro)).toBe('name: Nome obrigatório · plate: Placa inválida');
  });

  it('trata falha de conexão', () => {
    expect(fieldErrors(new Error('x'))).toEqual({});
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe('Não foi possível conectar ao servidor');
  });
});

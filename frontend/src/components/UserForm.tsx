import { useState, type FormEvent } from 'react';
import { api, errorMessage, fieldErrors } from '../api/client';
import { ROLE_LABEL, type Role, type User } from '../types';

interface Props { user?: User; isSelf?: boolean; onSaved: (u: User) => void; onCancel: () => void }

export default function UserForm({ user, isSelf, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: user?.name ?? '', email: user?.email ?? '', password: '',
    role: (user?.role ?? 'ATTENDANT') as Role, active: user?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: 'name' | 'email' | 'password') => (e: { target: { value: string } }) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: '' });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      const saved = user
        ? await api<User>(`/auth/users/${user.id}`, { method: 'PUT', body: { name: form.name, role: form.role, active: form.active } })
        : await api<User>('/auth/users', { method: 'POST', body: { name: form.name, email: form.email, password: form.password, role: form.role } });
      onSaved(saved);
    } catch (err) {
      const byField = fieldErrors(err);
      setErrors(byField);
      if (Object.keys(byField).length === 0) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <label className="wide">Nome *
        <input value={form.name} onChange={set('name')} aria-invalid={!!errors.name || undefined} />
        {errors.name && <small className="field-error">{errors.name}</small>}
      </label>
      {user ? (
        <label className="wide">E-mail<input value={form.email} disabled /></label>
      ) : (
        <>
          <label className="wide">E-mail (login) *
            <input type="email" value={form.email} onChange={set('email')} autoComplete="off" aria-invalid={!!errors.email || undefined} />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>
          <label className="wide">Senha inicial *
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password"
              aria-invalid={!!errors.password || undefined} />
            {errors.password
              ? <small className="field-error">{errors.password}</small>
              : <small className="muted">Mínimo de 8 caracteres. O funcionário pode trocá-la depois.</small>}
          </label>
        </>
      )}
      <fieldset className="wide radio-group" disabled={isSelf}>
        <legend>Perfil</legend>
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <label key={r} className={`radio-card${form.role === r ? ' selected' : ''}`}>
            <input type="radio" name="role" checked={form.role === r} onChange={() => setForm({ ...form, role: r })} />
            <span><strong>{ROLE_LABEL[r]}</strong>
              <small className="muted">{r === 'ADMIN' ? 'Tudo, inclusive gerenciar usuários' : 'Clientes, veículos e ordens de serviço'}</small>
            </span>
          </label>
        ))}
      </fieldset>
      {user && (
        <label className="wide switch">
          <input type="checkbox" checked={form.active} disabled={isSelf} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          <span>Usuário ativo <small className="muted">(desativado não consegue entrar no sistema)</small></span>
        </label>
      )}
      {isSelf && <p className="muted small wide">Você não pode alterar o próprio perfil nem se desativar.</p>}
      {error && <p className="error wide">{error}</p>}
      <div className="modal-actions wide">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : user ? 'Salvar alterações' : 'Criar usuário'}</button>
      </div>
    </form>
  );
}

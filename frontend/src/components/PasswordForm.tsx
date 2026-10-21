import { useState, type FormEvent } from 'react';
import { api, errorMessage, fieldErrors } from '../api/client';

/**
 * mode "change": o próprio usuário troca a senha (pede a senha atual).
 * mode "reset": o ADMIN define uma nova senha para outro usuário.
 */
interface Props { mode: 'change' | 'reset'; userId?: string; onSaved: () => void; onCancel: () => void }

export default function PasswordForm({ mode, userId, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: '' });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) return setErrors({ confirm: 'As senhas não conferem' });
    setBusy(true);
    try {
      if (mode === 'change') {
        await api('/auth/me/password', { method: 'PATCH', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      } else {
        await api(`/auth/users/${userId}/password`, { method: 'PUT', body: { password: form.newPassword } });
      }
      onSaved();
    } catch (err) {
      // A API chama o campo de "password" no reset e de "newPassword" na troca
      const { password, ...rest } = fieldErrors(err);
      const byField = password ? { ...rest, newPassword: password } : rest;
      setErrors(byField);
      if (Object.keys(byField).length === 0) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {mode === 'change' && (
        <label className="wide">Senha atual
          <input type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password"
            aria-invalid={!!errors.currentPassword || undefined} />
          {errors.currentPassword && <small className="field-error">{errors.currentPassword}</small>}
        </label>
      )}
      <label className="wide">Nova senha
        <input type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password"
          aria-invalid={!!errors.newPassword || undefined} />
        {errors.newPassword ? <small className="field-error">{errors.newPassword}</small> : <small className="muted">Mínimo de 8 caracteres</small>}
      </label>
      <label className="wide">Confirmar nova senha
        <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password"
          aria-invalid={!!errors.confirm || undefined} />
        {errors.confirm && <small className="field-error">{errors.confirm}</small>}
      </label>
      {error && <p className="error wide">{error}</p>}
      <div className="modal-actions wide">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : mode === 'change' ? 'Alterar senha' : 'Definir senha'}</button>
      </div>
    </form>
  );
}

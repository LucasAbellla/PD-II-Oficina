import { useState, type FormEvent } from 'react';
import { api, errorMessage, fieldErrors } from '../api/client';
import { maskPhone } from '../lib/format';
import type { Customer } from '../types';

interface Props { customer?: Customer; onSaved: (c: Customer) => void; onCancel: () => void }

export default function CustomerForm({ customer, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: customer?.name ?? '', phone: customer?.phone ?? '', email: customer?.email ?? '',
    document: customer?.document ?? '', notes: customer?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm({ ...form, [k]: k === 'phone' ? maskPhone(e.target.value) : e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: '' });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      const saved = await api<Customer>(customer ? `/customers/${customer.id}` : '/customers', {
        method: customer ? 'PUT' : 'POST', body: form,
      });
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
        <input value={form.name} onChange={set('name')} required aria-invalid={!!errors.name || undefined} />
        {errors.name && <small className="field-error">{errors.name}</small>}
      </label>
      <label>Telefone
        <input value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="(51) 99999-9999" />
      </label>
      <label>E-mail
        <input type="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email || undefined} />
        {errors.email && <small className="field-error">{errors.email}</small>}
      </label>
      <label>CPF/CNPJ<input value={form.document} onChange={set('document')} /></label>
      <label className="wide">Observações<textarea rows={2} value={form.notes} onChange={set('notes')} /></label>
      {error && <p className="error wide">{error}</p>}
      <div className="modal-actions wide">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : customer ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
      </div>
    </form>
  );
}

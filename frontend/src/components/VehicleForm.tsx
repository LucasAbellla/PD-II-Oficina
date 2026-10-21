import { useState, type FormEvent } from 'react';
import { api, errorMessage, fieldErrors } from '../api/client';
import { normalizePlate } from '../lib/format';
import type { Customer, Paged, Vehicle } from '../types';
import SearchSelect from './SearchSelect';

type Owner = { id: string; name: string };

interface Props { vehicle?: Vehicle; owner?: Owner; onSaved: (v: Vehicle) => void; onCancel: () => void }

const searchCustomers = (term: string) =>
  api<Paged<Customer>>(`/customers?pageSize=8&search=${encodeURIComponent(term)}`).then((r) => r.data);

export default function VehicleForm({ vehicle, owner, onSaved, onCancel }: Props) {
  const [customer, setCustomer] = useState<Owner | null>(vehicle?.customer ?? owner ?? null);
  const [form, setForm] = useState({
    plate: vehicle?.plate ?? '', brand: vehicle?.brand ?? '', model: vehicle?.model ?? '',
    year: vehicle?.year?.toString() ?? '', color: vehicle?.color ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm({ ...form, [k]: k === 'plate' ? normalizePlate(e.target.value) : e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: '' });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customer) return setErrors({ customerId: 'Selecione o proprietário' });
    setBusy(true);
    setErrors({});
    const body = { ...form, year: form.year === '' ? null : Number(form.year), customerId: customer.id };
    try {
      const saved = await api<Vehicle>(vehicle ? `/vehicles/${vehicle.id}` : '/vehicles', {
        method: vehicle ? 'PUT' : 'POST', body,
      });
      onSaved({ ...saved, customer });
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
      <label className="wide">Proprietário *
        <SearchSelect<Owner>
          value={customer}
          onChange={(c) => { setCustomer(c); if (c) setErrors({ ...errors, customerId: '' }); }}
          search={searchCustomers}
          getLabel={(c) => c.name}
          placeholder="Digite o nome do cliente…"
          invalid={!!errors.customerId}
          emptyText="Nenhum cliente encontrado — cadastre-o primeiro"
        />
        {errors.customerId && <small className="field-error">{errors.customerId}</small>}
      </label>
      <label>Placa *
        <input value={form.plate} onChange={set('plate')} placeholder="ABC1D23" className="plate-input" autoFocus={!!owner && !vehicle}
          aria-invalid={!!errors.plate || undefined} />
        {errors.plate && <small className="field-error">{errors.plate}</small>}
      </label>
      <label>Ano
        <input type="number" inputMode="numeric" value={form.year} onChange={set('year')} placeholder="2020"
          aria-invalid={!!errors.year || undefined} />
        {errors.year && <small className="field-error">{errors.year}</small>}
      </label>
      <label>Marca *
        <input value={form.brand} onChange={set('brand')} placeholder="Fiat" aria-invalid={!!errors.brand || undefined} />
        {errors.brand && <small className="field-error">{errors.brand}</small>}
      </label>
      <label>Modelo *
        <input value={form.model} onChange={set('model')} placeholder="Uno" aria-invalid={!!errors.model || undefined} />
        {errors.model && <small className="field-error">{errors.model}</small>}
      </label>
      <label className="wide">Cor<input value={form.color} onChange={set('color')} /></label>
      {error && <p className="error wide">{error}</p>}
      <div className="modal-actions wide">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : vehicle ? 'Salvar alterações' : 'Cadastrar veículo'}</button>
      </div>
    </form>
  );
}

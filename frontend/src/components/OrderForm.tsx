import { useState, type FormEvent } from 'react';
import { api, errorMessage, fieldErrors } from '../api/client';
import type { Paged, Vehicle } from '../types';
import SearchSelect from './SearchSelect';

interface Props { vehicle?: Vehicle; onSaved: (order: { id: string; number: number }) => void; onCancel: () => void }

const searchVehicles = (term: string) =>
  api<Paged<Vehicle>>(`/vehicles?pageSize=8&search=${encodeURIComponent(term)}`).then((r) => r.data);

export default function OrderForm({ vehicle: initial, onSaved, onCancel }: Props) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(initial ?? null);
  const [form, setForm] = useState({ description: '', mileageIn: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!vehicle) return setErrors({ vehicleId: 'Selecione o veículo' });
    setBusy(true);
    setErrors({});
    try {
      const created = await api<{ id: string; number: number }>('/service-orders', {
        method: 'POST',
        body: { vehicleId: vehicle.id, description: form.description, mileageIn: form.mileageIn === '' ? undefined : Number(form.mileageIn) },
      });
      onSaved(created);
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
      <label className="wide">Veículo *
        <SearchSelect<Vehicle>
          value={vehicle}
          onChange={(v) => { setVehicle(v); if (v) setErrors({ ...errors, vehicleId: '' }); }}
          search={searchVehicles}
          getLabel={(v) => `${v.plate} — ${v.brand} ${v.model}`}
          renderOption={(v) => <><strong className="plate">{v.plate}</strong> {v.brand} {v.model} <span className="muted">· {v.customer?.name}</span></>}
          placeholder="Digite a placa, o modelo ou o cliente…"
          invalid={!!errors.vehicleId}
          emptyText="Nenhum veículo encontrado — cadastre-o primeiro"
        />
        {errors.vehicleId && <small className="field-error">{errors.vehicleId}</small>}
      </label>
      <label className="wide">Problema relatado *
        <textarea rows={3} value={form.description} autoFocus={!!initial}
          onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }); }}
          placeholder="Ex.: barulho na suspensão dianteira ao passar em lombadas" aria-invalid={!!errors.description || undefined} />
        {errors.description && <small className="field-error">{errors.description}</small>}
      </label>
      <label>Km de entrada
        <input type="number" inputMode="numeric" min={0} value={form.mileageIn}
          onChange={(e) => setForm({ ...form, mileageIn: e.target.value })} aria-invalid={!!errors.mileageIn || undefined} />
        {errors.mileageIn && <small className="field-error">{errors.mileageIn}</small>}
      </label>
      {error && <p className="error wide">{error}</p>}
      <div className="modal-actions wide">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button className="primary" disabled={busy}>{busy ? 'Abrindo…' : 'Abrir OS'}</button>
      </div>
    </form>
  );
}

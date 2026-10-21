import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { Customer, Paged, Vehicle } from '../types';

const empty = { plate: '', brand: '', model: '', year: '', color: '', customerId: '' };

export default function VehiclesPage() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<Paged<Vehicle>>(`/vehicles?pageSize=100&search=${encodeURIComponent(search)}`);
      setItems(res.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [search]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    api<Paged<Customer>>('/customers?pageSize=100').then((r) => setCustomers(r.data)).catch(() => undefined);
  }, []);

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const body = { ...form, year: form.year === '' ? null : Number(form.year) };
    try {
      await api(editingId ? `/vehicles/${editingId}` : '/vehicles', { method: editingId ? 'PUT' : 'POST', body });
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const edit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({ plate: v.plate, brand: v.brand, model: v.model, year: v.year?.toString() ?? '', color: v.color ?? '', customerId: v.customerId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <h2>Veículos</h2>
      <form className="card grid" onSubmit={submit}>
        <label>Cliente (proprietário) *
          <select value={form.customerId} onChange={set('customerId')} required>
            <option value="">Selecione…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Placa *<input value={form.plate} onChange={set('plate')} required maxLength={7} placeholder="ABC1D23" /></label>
        <label>Marca *<input value={form.brand} onChange={set('brand')} required /></label>
        <label>Modelo *<input value={form.model} onChange={set('model')} required /></label>
        <label>Ano<input type="number" value={form.year} onChange={set('year')} /></label>
        <label>Cor<input value={form.color} onChange={set('color')} /></label>
        <div className="actions wide">
          <button>{editingId ? 'Salvar alterações' : 'Cadastrar veículo'}</button>
          {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar</button>}
        </div>
      </form>
      {error && <p className="error">{error}</p>}

      <input className="search" placeholder="Buscar por placa, marca, modelo ou cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Placa</th><th>Veículo</th><th>Cliente</th><th /></tr></thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.plate}</strong></td>
                <td>{v.brand} {v.model} {v.year ?? ''}</td>
                <td>{v.customer?.name}</td>
                <td>
                  <button className="link" onClick={() => edit(v)}>Editar</button>{' '}
                  <Link to={`/veiculos/${v.id}/historico`}>Histórico</Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="muted">Nenhum veículo encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

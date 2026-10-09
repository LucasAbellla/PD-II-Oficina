import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { STATUS_LABEL, type OrderStatus, type OrderSummary, type Paged, type Vehicle } from '../types';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [form, setForm] = useState({ vehicleId: '', description: '', mileageIn: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const q = statusFilter ? `&status=${statusFilter}` : '';
      const res = await api<Paged<OrderSummary>>(`/service-orders?pageSize=100${q}`);
      setOrders(res.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    api<Paged<Vehicle>>('/vehicles?pageSize=100').then((r) => setVehicles(r.data)).catch(() => undefined);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = await api<{ id: string }>('/service-orders', {
        method: 'POST',
        body: { vehicleId: form.vehicleId, description: form.description, mileageIn: form.mileageIn === '' ? undefined : Number(form.mileageIn) },
      });
      navigate(`/os/${created.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <h2>Ordens de serviço</h2>
      <form className="card grid" onSubmit={submit}>
        <label className="wide">Veículo *
          <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
            <option value="">Selecione…</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model} ({v.customer?.name})</option>)}
          </select>
        </label>
        <label className="wide">Problema relatado *<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={3} /></label>
        <label>Km de entrada<input type="number" min={0} value={form.mileageIn} onChange={(e) => setForm({ ...form, mileageIn: e.target.value })} /></label>
        <div className="actions"><button>Abrir OS</button></div>
      </form>
      {error && <p className="error">{error}</p>}

      <label className="inline">Filtrar por status:{' '}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}>
          <option value="">Todos</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nº</th><th>Veículo</th><th>Cliente</th><th>Problema</th><th>Status</th><th>Abertura</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/os/${o.id}`}>#{o.number}</Link></td>
                <td>{o.vehicle.plate} · {o.vehicle.model}</td>
                <td>{o.vehicle.customer.name}</td>
                <td>{o.description}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>{new Date(o.openedAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="muted">Nenhuma ordem de serviço.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

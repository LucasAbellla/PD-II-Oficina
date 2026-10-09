import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import type { VehicleHistory } from '../types';

export default function VehicleHistoryPage() {
  const { id } = useParams();
  const [data, setData] = useState<VehicleHistory | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<VehicleHistory>(`/vehicles/${id}/history`).then(setData).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (!data) return error ? <p className="error">{error}</p> : <p>Carregando…</p>;
  const { vehicle, orders } = data;

  return (
    <>
      <p><Link to="/veiculos">← Veículos</Link></p>
      <h2>Histórico — {vehicle.plate}</h2>
      <p className="muted">{vehicle.brand} {vehicle.model} {vehicle.year ?? ''} · Proprietário: {vehicle.customer.name}</p>
      {orders.length === 0 && <p className="muted">Este veículo ainda não possui ordens de serviço.</p>}
      {orders.map((o) => (
        <div className="card" key={o.id}>
          <p><Link to={`/os/${o.id}`}><strong>OS #{o.number}</strong></Link> <StatusBadge status={o.status} />{' '}
            <span className="muted">{new Date(o.openedAt).toLocaleDateString('pt-BR')}</span></p>
          <p>{o.description}</p>
          <ul>{o.items.map((i) => <li key={i.id}>{i.description}</li>)}</ul>
        </div>
      ))}
    </>
  );
}

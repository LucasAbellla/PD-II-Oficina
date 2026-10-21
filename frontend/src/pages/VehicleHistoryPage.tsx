import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatKm } from '../lib/format';
import type { VehicleHistory } from '../types';

export default function VehicleHistoryPage() {
  const { id } = useParams();
  const [data, setData] = useState<VehicleHistory | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<VehicleHistory>(`/vehicles/${id}/history`).then(setData).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (!data) return error ? <p className="error">{error}</p> : <p className="loading">Carregando…</p>;
  const { vehicle, orders } = data;
  const lastKm = orders.find((o) => o.mileageIn != null)?.mileageIn;
  const servicesCount = orders.reduce((n, o) => n + o.items.length, 0);

  return (
    <>
      <Link to="/veiculos" className="back-link"><Icon name="back" size={16} /> Veículos</Link>
      <div className="page-header">
        <div>
          <h2><span className="plate plate-lg">{vehicle.plate}</span> {vehicle.brand} {vehicle.model}</h2>
          <p className="muted">
            {[vehicle.year, vehicle.color].filter(Boolean).join(' · ')}{vehicle.year || vehicle.color ? ' · ' : ''}
            Proprietário: <Link to={`/clientes/${vehicle.customer.id}`}>{vehicle.customer.name}</Link>
          </p>
        </div>
        <Link to={`/os?nova=1&veiculo=${vehicle.id}`} className="button primary"><Icon name="plus" /> Nova OS</Link>
      </div>

      <div className="stats">
        <div className="stat"><span className="stat-value">{orders.length}</span><span className="stat-label">ordens de serviço</span></div>
        <div className="stat"><span className="stat-value">{servicesCount}</span><span className="stat-label">serviços realizados</span></div>
        <div className="stat"><span className="stat-value">{orders[0] ? formatDate(orders[0].openedAt) : '—'}</span><span className="stat-label">última visita</span></div>
        <div className="stat"><span className="stat-value">{formatKm(lastKm)}</span><span className="stat-label">última quilometragem</span></div>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <Icon name="history" size={32} />
          <p>Este veículo ainda não possui ordens de serviço.</p>
        </div>
      ) : (
        <ol className="timeline">
          {orders.map((o) => (
            <li key={o.id}>
              <div className="card">
                <div className="timeline-head">
                  <Link to={`/os/${o.id}`}><strong>OS #{o.number}</strong></Link>
                  <StatusBadge status={o.status} />
                  <span className="muted small">
                    {formatDate(o.openedAt)}{o.closedAt && ` → ${formatDate(o.closedAt)}`} · {formatKm(o.mileageIn)}
                  </span>
                </div>
                <p>{o.description}</p>
                {o.items.length > 0 ? (
                  <ul className="timeline-items">
                    {o.items.map((i) => <li key={i.id}>{i.description}{i.notes && <span className="muted"> — {i.notes}</span>}</li>)}
                  </ul>
                ) : <p className="muted small">Nenhum serviço registrado.</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientApi, errorMessage } from '../api/client';
import Icon from '../components/Icon';
import { LoadError, SkeletonPage } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import type { ClientVehicleList } from '../types';

export default function ClientVehiclesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ClientVehicleList | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    clientApi<ClientVehicleList>('/client/vehicles')
      .then((r) => {
        // Login por placa: acesso a um único veículo, vai direto para ele.
        if (r.scope === 'vehicle' && r.vehicles.length === 1) navigate(`/cliente/veiculos/${r.vehicles[0].id}`, { replace: true });
        else setData(r);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [navigate]);

  if (!data) return error ? <LoadError message={error} /> : <SkeletonPage cards={2} />;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Olá, {data.customerName.split(' ')[0]}!</h2>
          <p className="page-sub">Escolha um veículo para ver o andamento e o histórico.</p>
        </div>
      </div>
      {data.vehicles.length === 0 && (
        <div className="empty"><Icon name="car" size={32} /><p>Nenhum veículo encontrado.</p></div>
      )}
      <div className="vehicle-cards stagger">
        {data.vehicles.map((v) => (
          <div className="card vehicle-card" key={v.id}>
            <span className="plate plate-lg">{v.plate}</span>
            <p><strong>{v.brand} {v.model}</strong> <span className="muted">{[v.year, v.color].filter(Boolean).join(' · ')}</span></p>
            {v.latestOrder
              ? <p className="muted small">Último atendimento: OS #{v.latestOrder.number} <StatusBadge status={v.latestOrder.status} /></p>
              : <p className="muted small">Sem atendimentos registrados.</p>}
            <Link to={`/cliente/veiculos/${v.id}`} className="button primary btn-sm">Ver andamento <Icon name="arrow" size={16} /></Link>
          </div>
        ))}
      </div>
    </>
  );
}

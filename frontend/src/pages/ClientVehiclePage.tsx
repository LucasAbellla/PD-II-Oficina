import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clientApi, downloadPdf, errorMessage } from '../api/client';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { formatDate } from '../lib/format';
import type { ClientOrder, ClientVehicleDetail } from '../types';

function OrderBlock({ order, onError }: { order: ClientOrder; onError: (m: string) => void }) {
  const download = async () => {
    try {
      await downloadPdf(`/client/orders/${order.id}/invoice`, `nota-fiscal-OS${order.number}.pdf`, 'client');
    } catch (e) {
      onError(errorMessage(e));
    }
  };

  return (
    <div className="card">
      <p>
        <strong>OS #{order.number}</strong> <StatusBadge status={order.status} />{' '}
        <span className="muted small">aberta em {formatDate(order.openedAt)}</span>
      </p>
      <p className="muted pre-line">Problema relatado: {order.description}</p>
      <StatusTimeline status={order.status} events={order.timeline} />

      <span className="info-label">O que foi feito</span>
      {order.items.length === 0 ? (
        <p className="muted">Nenhum serviço registrado até o momento.</p>
      ) : (
        <ul className="cl-list">
          {order.items.map((i) => (
            <li key={i.id}><Icon name="check" size={14} /> {i.description} <small className="muted">· {formatDate(i.performedAt)}</small></li>
          ))}
        </ul>
      )}

      <span className="info-label cl-gap">Nota fiscal</span>
      {!order.invoiceReady && <p className="muted">Ficará disponível para download quando o serviço estiver pronto.</p>}
      {order.invoiceReady && !order.invoice && <p className="muted">O serviço está pronto. A oficina ainda não anexou a nota fiscal.</p>}
      {order.invoice && <button className="primary" onClick={download}><Icon name="download" size={16} /> Baixar nota fiscal (PDF)</button>}
    </div>
  );
}

export default function ClientVehiclePage() {
  const { id } = useParams();
  const [data, setData] = useState<ClientVehicleDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    clientApi<ClientVehicleDetail>(`/client/vehicles/${id}`).then(setData).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (!data) return error ? <p className="error">{error}</p> : <p className="loading">Carregando…</p>;
  const [current, ...older] = data.orders;

  return (
    <>
      <Link to="/cliente/veiculos" className="back-link"><Icon name="back" size={16} /> Meus veículos</Link>
      <div className="page-header">
        <h2><span className="plate plate-lg">{data.vehicle.plate}</span> {data.vehicle.brand} {data.vehicle.model} {data.vehicle.year ?? ''}</h2>
      </div>
      {error && <p className="error">{error}</p>}
      {!current && <div className="empty"><Icon name="clipboard" size={32} /><p>Este veículo ainda não possui atendimentos.</p></div>}
      {current && (
        <>
          <h3 className="section-title">Atendimento mais recente</h3>
          <OrderBlock order={current} onError={setError} />
        </>
      )}
      {older.length > 0 && (
        <>
          <h3 className="section-title">Histórico</h3>
          {older.map((o) => <OrderBlock key={o.id} order={o} onError={setError} />)}
        </>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { formatDate, formatDateTime } from '../lib/format';
import type { PublicOrder } from '../types';

/** Link público por OS: sem login, somente leitura, pensado para o celular. */
export default function PublicOrderPage() {
  const { token } = useParams();
  const [data, setData] = useState<PublicOrder | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<PublicOrder>(`/public/orders/${token}`, { auth: false }).then(setData).catch(() => setFailed(true));
  }, [token]);

  if (failed) {
    return (
      <div className="cl-page"><main className="cl-main">
        <div className="card"><h2>Link indisponível</h2><p>Este link de acompanhamento é inválido ou expirou. Peça um novo link à oficina.</p></div>
      </main></div>
    );
  }
  if (!data) return <div className="cl-page"><main className="cl-main"><p className="loading">Carregando…</p></main></div>;

  const { order, vehicle } = data;
  return (
    <div className="cl-page">
      <header className="cl-head"><div className="brand"><span className="brand-icon"><Icon name="wrench" /></span> {data.workshop}</div></header>
      <main className="cl-main">
        <p className="muted small">Acompanhamento de serviço</p>
        <div className="card">
          <p><strong>OS #{order.number}</strong> <StatusBadge status={order.status} /></p>
          <p>{vehicle.brand} {vehicle.model} {vehicle.year ?? ''} {vehicle.color ? `· ${vehicle.color}` : ''} · Placa <span className="plate">{vehicle.plate}</span></p>
          <p className="muted pre-line">Problema relatado: {order.description}</p>
          <StatusTimeline status={order.status} events={data.timeline} />
        </div>

        <h3 className="section-title">Serviços realizados nesta OS</h3>
        <div className="card">
          {data.items.length === 0 && <p className="muted">Nenhum serviço registrado até o momento.</p>}
          <ul className="cl-list">
            {data.items.map((i) => (
              <li key={i.id}><Icon name="check" size={14} /> {i.description} <small className="muted">· {formatDate(i.performedAt)}</small></li>
            ))}
          </ul>
        </div>

        <h3 className="section-title">Histórico do veículo</h3>
        {data.history.length === 0 && <p className="muted">Sem atendimentos anteriores registrados.</p>}
        {data.history.map((h) => (
          <div className="card" key={h.number}>
            <strong>OS #{h.number}</strong> <span className="muted small">{formatDate(h.openedAt)}</span>
            <ul className="cl-list">{h.services.map((s, idx) => <li key={idx}>{s}</li>)}</ul>
          </div>
        ))}

        <p className="muted small cl-foot">
          Atualizado em {formatDateTime(data.generatedAt)} · Link válido até {formatDate(data.expiresAt)}
        </p>
      </main>
    </div>
  );
}

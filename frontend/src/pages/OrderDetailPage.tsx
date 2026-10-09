import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { STATUS_LABEL, type OrderDetail, type OrderStatus } from '../types';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [item, setItem] = useState({ description: '', notes: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setOrder(await api<OrderDetail>(`/service-orders/${id}`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const changeStatus = (status: OrderStatus) =>
    run(() => api(`/service-orders/${id}/status`, { method: 'PATCH', body: { status } }));

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await api(`/service-orders/${id}/items`, { method: 'POST', body: item });
      setItem({ description: '', notes: '' });
    });
  };

  const removeItem = (itemId: string) => run(() => api(`/service-orders/${id}/items/${itemId}`, { method: 'DELETE' }));

  if (!order) return error ? <p className="error">{error}</p> : <p>Carregando…</p>;
  const closed = order.status === 'DELIVERED' || order.status === 'CANCELED';

  return (
    <>
      <p><Link to="/os">← Ordens de serviço</Link></p>
      <h2>OS #{order.number} <StatusBadge status={order.status} /></h2>
      <div className="card">
        <p><strong>Veículo:</strong> {order.vehicle.plate} — {order.vehicle.brand} {order.vehicle.model}{' '}
          (<Link to={`/veiculos/${order.vehicle.id}/historico`}>ver histórico</Link>)</p>
        <p><strong>Cliente:</strong> {order.vehicle.customer.name} {order.vehicle.customer.phone && `· ${order.vehicle.customer.phone}`}</p>
        <p><strong>Problema relatado:</strong> {order.description}</p>
        <p className="muted">Aberta em {new Date(order.openedAt).toLocaleString('pt-BR')} por {order.createdBy.name}
          {order.mileageIn != null && ` · ${order.mileageIn} km`}</p>
        <div className="actions">
          {order.allowedTransitions.map((s) => (
            <button key={s} className={s === 'CANCELED' ? 'danger' : ''} onClick={() => changeStatus(s)}>→ {STATUS_LABEL[s]}</button>
          ))}
          {order.allowedTransitions.length === 0 && <span className="muted">OS encerrada.</span>}
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <h3>Serviços realizados</h3>
      {!closed && (
        <form className="card grid" onSubmit={addItem}>
          <label>Serviço *<input value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} required /></label>
          <label>Observações<input value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></label>
          <div className="actions"><button>Adicionar serviço</button></div>
        </form>
      )}
      <ul className="items">
        {order.items.map((i) => (
          <li key={i.id}>
            <div><strong>{i.description}</strong>{i.notes && <span className="muted"> — {i.notes}</span>}<br />
              <small className="muted">{new Date(i.performedAt).toLocaleString('pt-BR')}</small></div>
            {!closed && <button className="link" onClick={() => removeItem(i.id)}>Remover</button>}
          </li>
        ))}
        {order.items.length === 0 && <li className="muted">Nenhum serviço registrado ainda.</li>}
      </ul>
    </>
  );
}

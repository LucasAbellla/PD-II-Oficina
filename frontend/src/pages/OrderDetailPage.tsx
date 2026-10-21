import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import StatusStepper from '../components/StatusStepper';
import { formatDateTime, formatKm } from '../lib/format';
import { STATUS_LABEL, type OrderDetail, type OrderStatus } from '../types';

// Serviços mais comuns para agilizar o registro (basta clicar)
const SUGGESTIONS = ['Troca de óleo e filtro', 'Alinhamento e balanceamento', 'Troca de pastilhas de freio', 'Revisão geral', 'Diagnóstico elétrico', 'Troca de correia dentada'];

const actionLabel = (from: OrderStatus, to: OrderStatus) => {
  if (to === 'IN_PROGRESS') return from === 'COMPLETED' ? 'Reabrir serviço' : 'Iniciar serviço';
  if (to === 'COMPLETED') return 'Concluir serviço';
  if (to === 'DELIVERED') return 'Entregar ao cliente';
  return STATUS_LABEL[to];
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { toast, confirm } = useFeedback();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [item, setItem] = useState({ description: '', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const itemInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await api<OrderDetail>(`/service-orders/${id}`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      await load();
      toast(success);
      return true;
    } catch (e) {
      toast(errorMessage(e), { type: 'error' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: OrderStatus) => {
    if (status === 'CANCELED' && !(await confirm({
      title: `Cancelar a OS #${order?.number}?`, message: 'Uma OS cancelada não pode ser reaberta nem receber novos serviços.',
      confirmLabel: 'Cancelar OS', danger: true,
    }))) return;
    if (status === 'DELIVERED' && !(await confirm({
      title: 'Confirmar entrega do veículo?', message: 'Depois de entregue, a OS fica encerrada e não aceita mais alterações.',
      confirmLabel: 'Confirmar entrega',
    }))) return;
    await run(() => api(`/service-orders/${id}/status`, { method: 'PATCH', body: { status } }), `Status alterado para ${STATUS_LABEL[status]}`);
  };

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    if (item.description.trim().length < 2) return itemInput.current?.focus();
    const ok = await run(() => api(`/service-orders/${id}/items`, { method: 'POST', body: item }), 'Serviço registrado');
    if (ok) {
      setItem({ description: '', notes: '' });
      itemInput.current?.focus();
    }
  };

  const removeItem = async (itemId: string, description: string) => {
    if (!(await confirm({ title: 'Remover serviço?', message: `"${description}" será removido desta OS.`, confirmLabel: 'Remover', danger: true }))) return;
    await run(() => api(`/service-orders/${id}/items/${itemId}`, { method: 'DELETE' }), 'Serviço removido');
  };

  if (!order) return error ? <p className="error">{error}</p> : <p className="loading">Carregando…</p>;
  const closed = order.status === 'DELIVERED' || order.status === 'CANCELED';
  const forward = order.allowedTransitions.filter((s) => s !== 'CANCELED');
  const { vehicle } = order;

  return (
    <>
      <Link to="/os" className="back-link"><Icon name="back" size={16} /> Ordens de serviço</Link>
      <div className="page-header">
        <h2>OS #{order.number} <StatusBadge status={order.status} /></h2>
        <div className="actions">
          {forward.map((s, i) => (
            <button key={s} className={i === 0 ? 'primary' : 'secondary'} disabled={busy} onClick={() => changeStatus(s)}>
              {actionLabel(order.status, s)}
            </button>
          ))}
          {order.allowedTransitions.includes('CANCELED') && (
            <button className="ghost-danger" disabled={busy} onClick={() => changeStatus('CANCELED')}>Cancelar OS</button>
          )}
        </div>
      </div>

      <StatusStepper status={order.status} />

      <div className="info-grid">
        <div className="card">
          <span className="info-label">Veículo</span>
          <p><span className="plate">{vehicle.plate}</span> {vehicle.brand} {vehicle.model} {vehicle.year ?? ''}</p>
          <Link to={`/veiculos/${vehicle.id}/historico`} className="small-link"><Icon name="history" size={14} /> Ver histórico do veículo</Link>
        </div>
        <div className="card">
          <span className="info-label">Cliente</span>
          <p><Link to={`/clientes/${vehicle.customer.id}`}>{vehicle.customer.name}</Link></p>
          {vehicle.customer.phone && (
            <a href={`tel:${vehicle.customer.phone.replace(/\D/g, '')}`} className="small-link"><Icon name="phone" size={14} /> {vehicle.customer.phone}</a>
          )}
        </div>
        <div className="card">
          <span className="info-label">Entrada</span>
          <p>{formatDateTime(order.openedAt)} · {formatKm(order.mileageIn)}</p>
          <span className="muted small">
            por {order.createdBy.name}{order.closedAt && ` · encerrada em ${formatDateTime(order.closedAt)}`}
          </span>
        </div>
      </div>

      <div className="card">
        <span className="info-label">Problema relatado</span>
        <p className="pre-line">{order.description}</p>
      </div>

      <h3 className="section-title">Serviços realizados <span className="chip-count">{order.items.length}</span></h3>
      {!closed && (
        <form className="card add-item" onSubmit={addItem}>
          <div className="add-item-row">
            <input ref={itemInput} value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })}
              placeholder="Serviço realizado (ex.: troca de óleo)" aria-label="Serviço realizado" />
            <input value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })}
              placeholder="Observações (opcional)" aria-label="Observações" />
            <button className="primary" disabled={busy}><Icon name="plus" /> Adicionar</button>
          </div>
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button type="button" key={s} className="chip" onClick={() => { setItem({ ...item, description: s }); itemInput.current?.focus(); }}>{s}</button>
            ))}
          </div>
        </form>
      )}
      <ul className="items">
        {order.items.map((i) => (
          <li key={i.id}>
            <span className="item-check"><Icon name="check" size={14} /></span>
            <div className="item-body">
              <strong>{i.description}</strong>
              {i.notes && <span className="muted"> — {i.notes}</span>}
              <small className="muted">{formatDateTime(i.performedAt)}</small>
            </div>
            {!closed && (
              <button className="icon-btn" title="Remover serviço" aria-label={`Remover ${i.description}`} onClick={() => removeItem(i.id, i.description)}>
                <Icon name="trash" size={16} />
              </button>
            )}
          </li>
        ))}
        {order.items.length === 0 && <li className="muted empty-item">Nenhum serviço registrado ainda.</li>}
      </ul>
    </>
  );
}

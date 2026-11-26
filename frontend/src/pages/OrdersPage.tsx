import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import OrderForm from '../components/OrderForm';
import Presence from '../components/Presence';
import { LoadError, SkeletonTable } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../lib/format';
import { STATUS_LABEL, type OrderStatus, type OrderSummary, type Paged, type StatusSummary, type Vehicle } from '../types';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as OrderStatus | '';
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const [newOrder, setNewOrder] = useState<{ vehicle?: Vehicle } | null>(null);
  const debounced = useDebounce(search.trim());

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const q = `${status ? `&status=${status}` : ''}${debounced ? `&search=${encodeURIComponent(debounced)}` : ''}`;
      const [list, counts] = await Promise.all([
        api<Paged<OrderSummary>>(`/service-orders?pageSize=100${q}`),
        api<StatusSummary>('/service-orders/summary'),
      ]);
      setOrders(list.data);
      setSummary(counts);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setFetching(false);
    }
  }, [status, debounced]);

  useEffect(() => { void load(); }, [load]);

  // Vindo de "Abrir OS" em outra tela: /os?nova=1&veiculo=<id>
  useEffect(() => {
    if (!params.get('nova')) return;
    const vehicleId = params.get('veiculo');
    const clear = () => setParams((p) => { p.delete('nova'); p.delete('veiculo'); return p; }, { replace: true });
    if (!vehicleId) { setNewOrder({}); clear(); return; }
    api<Vehicle>(`/vehicles/${vehicleId}`).then((vehicle) => setNewOrder({ vehicle })).catch(() => setNewOrder({})).finally(clear);
  }, [params, setParams]);

  const setStatus = (s: OrderStatus | '') => setParams((p) => { if (s) p.set('status', s); else p.delete('status'); return p; });
  const total = summary ? Object.values(summary).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Ordens de serviço</h2>
          <p className="page-sub">Abra uma OS para registrar serviços e mudar o status.</p>
        </div>
        <button className="primary" onClick={() => setNewOrder({})}><Icon name="plus" /> Nova OS</button>
      </div>

      <div className="chips" role="group" aria-label="Filtrar por status">
        <button aria-pressed={status === ''} className="chip" onClick={() => setStatus('')}>
          Todas <span className="chip-count">{total}</span>
        </button>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
          <button key={s} aria-pressed={status === s} className={`chip chip-${s.toLowerCase()}`} onClick={() => setStatus(s)}>
            {STATUS_LABEL[s]} <span className="chip-count">{summary?.[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="search-box">
        <Icon name="search" />
        <input placeholder="Buscar por nº da OS, placa, cliente ou problema…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <LoadError message={error} onRetry={load} />}

      {orders === null ? (!error && <SkeletonTable cols={6} />) : orders.length === 0 ? (
        <div className="empty">
          <Icon name="clipboard" size={32} />
          <p>{search || status ? 'Nenhuma OS encontrada com esse filtro.' : 'Nenhuma ordem de serviço aberta ainda.'}</p>
          {!search && !status && <button className="primary" onClick={() => setNewOrder({})}><Icon name="plus" /> Abrir a primeira OS</button>}
        </div>
      ) : (
        <div className={`table-wrap${fetching ? ' is-fetching' : ''}`} aria-busy={fetching}>
          <table className="clickable">
            <thead><tr><th>Nº</th><th>Veículo</th><th className="hide-sm">Cliente</th><th className="hide-sm">Problema</th><th>Status</th><th className="hide-sm">Abertura</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/os/${o.id}`)}>
                  <td><Link to={`/os/${o.id}`} className="os-number" onClick={(e) => e.stopPropagation()}>#{o.number}</Link></td>
                  <td><span className="plate">{o.vehicle.plate}</span> {o.vehicle.model}</td>
                  <td className="hide-sm">{o.vehicle.customer.name}</td>
                  <td className="truncate hide-sm">{o.description}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="hide-sm">{formatDate(o.openedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Presence>{newOrder && (
        <Modal title="Nova ordem de serviço" onClose={() => setNewOrder(null)}>
          <OrderForm
            vehicle={newOrder.vehicle}
            onCancel={() => setNewOrder(null)}
            onSaved={(o) => { toast(`OS #${o.number} aberta`); navigate(`/os/${o.id}`); }}
          />
        </Modal>
      )}</Presence>
    </>
  );
}

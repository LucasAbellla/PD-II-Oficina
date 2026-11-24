import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadPdf, errorMessage, uploadPdf } from '../api/client';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import StatusStepper from '../components/StatusStepper';
import { formatDate, formatDateTime, formatKm } from '../lib/format';
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

  const share = () => run(() => api(`/service-orders/${id}/share`, { method: 'POST' }), 'Link de acompanhamento gerado');
  const revokeLink = async () => {
    if (!(await confirm({ title: 'Revogar o link?', message: 'Quem tiver o link deixará de conseguir ver esta OS.', confirmLabel: 'Revogar', danger: true }))) return;
    await run(() => api(`/service-orders/${id}/share`, { method: 'DELETE' }), 'Link revogado');
  };
  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast('Link copiado');
  };

  const onInvoiceFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return toast('Envie um arquivo PDF.', { type: 'error' });
    if (file.size > 5 * 1024 * 1024) return toast('O PDF deve ter no máximo 5 MB.', { type: 'error' });
    void run(() => uploadPdf(`/service-orders/${id}/invoice`, file), 'Nota fiscal anexada');
  };
  const downloadInvoice = async (name: string) => {
    try {
      await downloadPdf(`/service-orders/${id}/invoice`, name, 'staff');
    } catch (e) {
      toast(errorMessage(e), { type: 'error' });
    }
  };
  const removeInvoice = async () => {
    if (!(await confirm({ title: 'Remover a nota fiscal?', message: 'O cliente deixará de ver o arquivo até que um novo PDF seja anexado.', confirmLabel: 'Remover', danger: true }))) return;
    await run(() => api(`/service-orders/${id}/invoice`, { method: 'DELETE' }), 'Nota fiscal removida');
  };

  if (!order) return error ? <p className="error">{error}</p> : <p className="loading">Carregando…</p>;
  const closed = order.status === 'DELIVERED' || order.status === 'CANCELED';
  const forward = order.allowedTransitions.filter((s) => s !== 'CANCELED');
  const { vehicle } = order;
  const ready = order.status === 'COMPLETED' || order.status === 'DELIVERED';
  const linkActive = Boolean(order.publicToken && order.publicTokenExpiresAt && new Date(order.publicTokenExpiresAt) > new Date());
  const link = linkActive ? `${window.location.origin}/acompanhar/${order.publicToken}` : '';
  const digits = (vehicle.customer.phone ?? '').replace(/\D/g, '');
  const wa = `https://wa.me/${digits.length >= 10 && digits.length <= 11 ? '55' + digits : digits}?text=${encodeURIComponent(
    `Olá! Acompanhe o andamento do seu veículo (${vehicle.plate}) pelo link: ${link}`,
  )}`;

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

      <h3 className="section-title">Nota fiscal</h3>
      <div className="card">
        {order.invoice ? (
          <>
            <p><Icon name="file" size={16} /> <strong>{order.invoice.fileName}</strong>{' '}
              <span className="muted small">· {Math.max(1, Math.round(order.invoice.sizeBytes / 1024))} KB · enviada em {formatDateTime(order.invoice.uploadedAt)}</span></p>
            <div className="actions">
              <button className="secondary" onClick={() => downloadInvoice(order.invoice!.fileName)}><Icon name="download" size={16} /> Baixar</button>
              <button className="ghost-danger" disabled={busy} onClick={removeInvoice}><Icon name="trash" size={16} /> Remover</button>
            </div>
          </>
        ) : (
          <p className="muted">Nenhuma nota fiscal anexada.</p>
        )}
        {ready ? (
          <label className="file-input">{order.invoice ? 'Substituir PDF' : 'Anexar nota fiscal (PDF, até 5 MB)'}
            <input type="file" accept="application/pdf" onChange={onInvoiceFile} disabled={busy} />
          </label>
        ) : (
          <p className="muted small">O envio fica disponível quando a OS estiver Concluída ou Entregue.</p>
        )}
        <p className="muted small">O cliente só vê e baixa a nota fiscal na área dele quando a OS estiver Concluída ou Entregue.</p>
      </div>

      <h3 className="section-title">Acompanhamento pelo cliente</h3>
      <div className="card">
        <p className="muted">Gere um link somente leitura para o cliente ver o status, os serviços e o histórico do veículo, sem login.</p>
        {linkActive ? (
          <>
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link de acompanhamento" />
            <p className="muted small">Válido até {formatDate(order.publicTokenExpiresAt!)}</p>
            <div className="actions">
              <button className="primary" onClick={() => copyLink(link)}><Icon name="link" size={16} /> Copiar link</button>
              <a className="button secondary" href={wa} target="_blank" rel="noreferrer"><Icon name="phone" size={16} /> Enviar pelo WhatsApp</a>
              <button className="secondary" disabled={busy} onClick={share}>Gerar novo link</button>
              <button className="ghost-danger" disabled={busy} onClick={revokeLink}>Revogar</button>
            </div>
          </>
        ) : (
          <button className="primary" disabled={busy} onClick={share}><Icon name="link" size={16} /> Gerar link de acompanhamento</button>
        )}
      </div>

      <h3 className="section-title">Linha do tempo <span className="chip-count">{order.events.length}</span></h3>
      <ul className="timeline">
        {order.events.map((e) => (
          <li key={e.id}>
            <div className="card">
              <div className="timeline-head">
                <StatusBadge status={e.toStatus} />
                <strong>{formatDateTime(e.createdAt)}</strong>
                {e.by && <span className="muted small">por {e.by}</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

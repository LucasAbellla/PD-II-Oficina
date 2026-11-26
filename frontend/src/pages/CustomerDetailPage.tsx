import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import CustomerForm from '../components/CustomerForm';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import Presence from '../components/Presence';
import { LoadError, SkeletonPage } from '../components/Skeleton';
import VehicleForm from '../components/VehicleForm';
import { formatDate } from '../lib/format';
import type { CustomerDetail } from '../types';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { toast, confirm } = useFeedback();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [modal, setModal] = useState<'edit' | 'vehicle' | null>(params.get('novoVeiculo') ? 'vehicle' : null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setCustomer(await api<CustomerDetail>(`/customers/${id}`));
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (params.get('novoVeiculo')) setParams({}, { replace: true });
  }, [params, setParams]);

  const generatePin = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await api<{ pin: string }>(`/customers/${id}/access-pin`, { method: 'POST' });
      setPin(res.pin);
      void load();
    } catch (e) {
      toast(errorMessage(e), { type: 'error' });
    } finally {
      setGenerating(false);
    }
  };
  const revokeAccess = async () => {
    if (!(await confirm({ title: 'Revogar o acesso do cliente?', message: 'O código atual deixa de funcionar. Você pode gerar outro quando quiser.', confirmLabel: 'Revogar', danger: true }))) return;
    try {
      await api(`/customers/${id}/access-pin`, { method: 'DELETE' });
      toast('Acesso do cliente revogado');
      void load();
    } catch (e) {
      toast(errorMessage(e), { type: 'error' });
    }
  };

  const anonymize = async () => {
    if (!(await confirm({
      title: 'Anonimizar os dados do cliente?',
      message: 'Nome, CPF/CNPJ, telefone, e-mail e observações serão apagados e o acesso do cliente e os links de acompanhamento deixam de funcionar. Veículos e histórico de OS são mantidos. Não é possível desfazer.',
      confirmLabel: 'Anonimizar',
      danger: true,
    }))) return;
    try {
      setCustomer(await api<CustomerDetail>(`/customers/${id}/anonymize`, { method: 'POST' }));
      toast('Dados pessoais do cliente removidos');
    } catch (e) {
      toast(errorMessage(e), { type: 'error' });
    }
  };

  if (!customer) return error ? <LoadError message={error} onRetry={() => void load()} /> : <SkeletonPage cards={3} />;

  return (
    <>
      <Link to="/clientes" className="back-link"><Icon name="back" size={16} /> Clientes</Link>
      <div className="page-header">
        <h2>{customer.name}</h2>
        {!customer.anonymizedAt && <button className="secondary" onClick={() => setModal('edit')}><Icon name="edit" /> Editar dados</button>}
      </div>
      {customer.anonymizedAt && (
        <div className="notice" role="status">
          <Icon name="alert" />
          <p>Dados pessoais removidos em {formatDate(customer.anonymizedAt)} a pedido do titular (LGPD). Veículos e histórico de OS foram mantidos.</p>
        </div>
      )}

      <div className="info-grid">
        <div className="card">
          <span className="info-label">Telefone</span>
          <p>{customer.phone
            ? <a href={`tel:${customer.phone.replace(/\D/g, '')}`}>{customer.phone}</a>
            : <span className="muted">Não informado</span>}</p>
        </div>
        <div className="card">
          <span className="info-label">E-mail</span>
          <p>{customer.email ?? <span className="muted">Não informado</span>}</p>
        </div>
        <div className="card">
          <span className="info-label">CPF/CNPJ</span>
          <p>{customer.document ?? <span className="muted">Não informado</span>}</p>
        </div>
      </div>
      {customer.notes && <div className="card"><span className="info-label">Observações</span><p className="pre-line">{customer.notes}</p></div>}

      {!customer.anonymizedAt && <>
      <h3 className="section-title">Acesso do cliente</h3>
      <div className="card">
        <p className="muted">
          O cliente entra em “Sou cliente” com a <strong>placa</strong> de um veículo (vê só aquele veículo) ou com o <strong>CPF</strong>{' '}
          cadastrado (vê todos os veículos), mais um código de 6 dígitos gerado aqui.
          {!customer.document && ' Sem CPF/CNPJ cadastrado, ele só poderá entrar pela placa.'}
        </p>
        <div className="actions">
          {customer.access ? <span className="badge badge-completed">Acesso ativo</span> : <span className="badge">Sem código</span>}
          <button className="primary" onClick={generatePin} disabled={generating} aria-busy={generating}><Icon name="key" size={16} /> {customer.access ? 'Gerar novo código' : 'Gerar código de acesso'}</button>
          {customer.access && <button className="ghost-danger" onClick={revokeAccess}>Revogar acesso</button>}
        </div>
      </div>
      </>}

      <div className="page-header">
        <h3 className="section-title">Veículos <span className="chip-count">{customer.vehicles.length}</span></h3>
        <button className="primary" onClick={() => setModal('vehicle')}><Icon name="plus" /> Adicionar veículo</button>
      </div>
      {customer.vehicles.length === 0 ? (
        <div className="empty">
          <Icon name="car" size={32} />
          <p>Este cliente ainda não tem veículos cadastrados.</p>
          <button className="primary" onClick={() => setModal('vehicle')}><Icon name="plus" /> Adicionar veículo</button>
        </div>
      ) : (
        <div className="vehicle-cards stagger">
          {customer.vehicles.map((v) => (
            <div className="card vehicle-card" key={v.id}>
              <span className="plate plate-lg">{v.plate}</span>
              <p><strong>{v.brand} {v.model}</strong> <span className="muted">{[v.year, v.color].filter(Boolean).join(' · ')}</span></p>
              <div className="actions">
                <Link to={`/os?nova=1&veiculo=${v.id}`} className="button primary btn-sm"><Icon name="plus" size={16} /> Abrir OS</Link>
                <Link to={`/veiculos/${v.id}/historico`} className="button secondary btn-sm"><Icon name="history" size={16} /> Histórico</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {user?.role === 'ADMIN' && !customer.anonymizedAt && (
        <>
          <h3 className="section-title">Privacidade (LGPD)</h3>
          <div className="card">
            <p className="muted">Se o cliente pedir a exclusão dos dados pessoais, anonimize o cadastro. O histórico de serviços dos veículos continua disponível para a oficina.</p>
            <div className="actions">
              <button className="ghost-danger" onClick={anonymize}>Anonimizar dados do cliente</button>
            </div>
          </div>
        </>
      )}

      <Presence>{pin && (
        <Modal title="Código de acesso do cliente" onClose={() => setPin(null)} small>
          <p>Informe este código a <strong>{customer.name}</strong>. Por segurança, ele não será exibido novamente.</p>
          <p className="pin-code">{pin}</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => { void navigator.clipboard.writeText(pin); toast('Código copiado'); }}>Copiar</button>
            <button className="primary" onClick={() => setPin(null)}>Concluir</button>
          </div>
        </Modal>
      )}</Presence>
      <Presence>{modal === 'edit' && (
        <Modal title="Editar cliente" onClose={() => setModal(null)}>
          <CustomerForm customer={customer} onCancel={() => setModal(null)}
            onSaved={() => { setModal(null); toast('Dados do cliente atualizados'); void load(); }} />
        </Modal>
      )}</Presence>
      <Presence>{modal === 'vehicle' && (
        <Modal title={`Novo veículo de ${customer.name}`} onClose={() => setModal(null)}>
          <VehicleForm owner={customer} onCancel={() => setModal(null)}
            onSaved={(v) => {
              setModal(null);
              void load();
              toast(`Veículo ${v.plate} cadastrado`, { action: { label: 'Abrir OS', to: `/os?nova=1&veiculo=${v.id}` } });
            }} />
        </Modal>
      )}</Presence>
    </>
  );
}

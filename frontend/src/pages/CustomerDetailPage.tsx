import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import CustomerForm from '../components/CustomerForm';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import VehicleForm from '../components/VehicleForm';
import type { CustomerDetail } from '../types';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { toast, confirm } = useFeedback();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [modal, setModal] = useState<'edit' | 'vehicle' | null>(params.get('novoVeiculo') ? 'vehicle' : null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCustomer(await api<CustomerDetail>(`/customers/${id}`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (params.get('novoVeiculo')) setParams({}, { replace: true });
  }, [params, setParams]);

  const generatePin = async () => {
    try {
      const res = await api<{ pin: string }>(`/customers/${id}/access-pin`, { method: 'POST' });
      setPin(res.pin);
      void load();
    } catch (e) {
      toast(errorMessage(e), { type: 'error' });
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

  if (!customer) return error ? <p className="error">{error}</p> : <p className="loading">Carregando…</p>;

  return (
    <>
      <Link to="/clientes" className="back-link"><Icon name="back" size={16} /> Clientes</Link>
      <div className="page-header">
        <h2>{customer.name}</h2>
        <button className="secondary" onClick={() => setModal('edit')}><Icon name="edit" /> Editar dados</button>
      </div>

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

      <h3 className="section-title">Acesso do cliente</h3>
      <div className="card">
        <p className="muted">
          O cliente entra em “Sou cliente” com a <strong>placa</strong> de um veículo (vê só aquele veículo) ou com o <strong>CPF</strong>{' '}
          cadastrado (vê todos os veículos), mais um código de 6 dígitos gerado aqui.
          {!customer.document && ' Sem CPF/CNPJ cadastrado, ele só poderá entrar pela placa.'}
        </p>
        <div className="actions">
          {customer.access ? <span className="badge badge-completed">Acesso ativo</span> : <span className="badge">Sem código</span>}
          <button className="primary" onClick={generatePin}><Icon name="key" size={16} /> {customer.access ? 'Gerar novo código' : 'Gerar código de acesso'}</button>
          {customer.access && <button className="ghost-danger" onClick={revokeAccess}>Revogar acesso</button>}
        </div>
      </div>

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
        <div className="vehicle-cards">
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

      {pin && (
        <Modal title="Código de acesso do cliente" onClose={() => setPin(null)} small>
          <p>Informe este código a <strong>{customer.name}</strong>. Por segurança, ele não será exibido novamente.</p>
          <p className="pin-code">{pin}</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => { void navigator.clipboard.writeText(pin); toast('Código copiado'); }}>Copiar</button>
            <button className="primary" onClick={() => setPin(null)}>Concluir</button>
          </div>
        </Modal>
      )}
      {modal === 'edit' && (
        <Modal title="Editar cliente" onClose={() => setModal(null)}>
          <CustomerForm customer={customer} onCancel={() => setModal(null)}
            onSaved={() => { setModal(null); toast('Dados do cliente atualizados'); void load(); }} />
        </Modal>
      )}
      {modal === 'vehicle' && (
        <Modal title={`Novo veículo de ${customer.name}`} onClose={() => setModal(null)}>
          <VehicleForm owner={customer} onCancel={() => setModal(null)}
            onSaved={(v) => {
              setModal(null);
              void load();
              toast(`Veículo ${v.plate} cadastrado`, { action: { label: 'Abrir OS', to: `/os?nova=1&veiculo=${v.id}` } });
            }} />
        </Modal>
      )}
    </>
  );
}

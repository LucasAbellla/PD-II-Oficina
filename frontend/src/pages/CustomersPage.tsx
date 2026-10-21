import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import CustomerForm from '../components/CustomerForm';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useDebounce } from '../hooks/useDebounce';
import type { Customer, Paged } from '../types';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [items, setItems] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounced = useDebounce(search.trim());

  const load = useCallback(async () => {
    try {
      const res = await api<Paged<Customer>>(`/customers?pageSize=100&search=${encodeURIComponent(debounced)}`);
      setItems(res.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [debounced]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h2>Clientes</h2>
        <button className="primary" onClick={() => setCreating(true)}><Icon name="plus" /> Novo cliente</button>
      </div>
      <div className="search-box">
        <Icon name="search" />
        <input placeholder="Buscar por nome, telefone ou placa…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}

      {items === null ? <p className="loading">Carregando…</p> : items.length === 0 ? (
        <div className="empty">
          <Icon name="users" size={32} />
          <p>{search ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}</p>
          <button className="primary" onClick={() => setCreating(true)}><Icon name="plus" /> Cadastrar cliente</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="clickable">
            <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Veículos</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}>
                  <td><Link to={`/clientes/${c.id}`} onClick={(e) => e.stopPropagation()}><strong>{c.name}</strong></Link></td>
                  <td>{c.phone ?? '—'}</td>
                  <td>{c.email ?? '—'}</td>
                  <td>{c._count?.vehicles ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Novo cliente" onClose={() => setCreating(false)}>
          <CustomerForm
            onCancel={() => setCreating(false)}
            onSaved={(c) => { toast(`${c.name} cadastrado(a). Agora cadastre o veículo.`); navigate(`/clientes/${c.id}?novoVeiculo=1`); }}
          />
        </Modal>
      )}
    </>
  );
}

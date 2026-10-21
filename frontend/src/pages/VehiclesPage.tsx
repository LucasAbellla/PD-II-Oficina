import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import VehicleForm from '../components/VehicleForm';
import { useDebounce } from '../hooks/useDebounce';
import type { Paged, Vehicle } from '../types';

export default function VehiclesPage() {
  const { toast } = useFeedback();
  const [items, setItems] = useState<Vehicle[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Vehicle | 'new' | null>(null);
  const [error, setError] = useState('');
  const debounced = useDebounce(search.trim());

  const load = useCallback(async () => {
    try {
      const res = await api<Paged<Vehicle>>(`/vehicles?pageSize=100&search=${encodeURIComponent(debounced)}`);
      setItems(res.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [debounced]);

  useEffect(() => { void load(); }, [load]);

  const onSaved = (v: Vehicle) => {
    const isNew = editing === 'new';
    setEditing(null);
    void load();
    if (isNew) toast(`Veículo ${v.plate} cadastrado`, { action: { label: 'Abrir OS', to: `/os?nova=1&veiculo=${v.id}` } });
    else toast('Veículo atualizado');
  };

  return (
    <>
      <div className="page-header">
        <h2>Veículos</h2>
        <button className="primary" onClick={() => setEditing('new')}><Icon name="plus" /> Novo veículo</button>
      </div>
      <div className="search-box">
        <Icon name="search" />
        <input placeholder="Buscar por placa, marca, modelo ou cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}

      {items === null ? <p className="loading">Carregando…</p> : items.length === 0 ? (
        <div className="empty">
          <Icon name="car" size={32} />
          <p>{search ? 'Nenhum veículo encontrado para essa busca.' : 'Nenhum veículo cadastrado ainda.'}</p>
          <button className="primary" onClick={() => setEditing('new')}><Icon name="plus" /> Cadastrar veículo</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Placa</th><th>Veículo</th><th>Proprietário</th><th className="right">Ações</th></tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td><span className="plate">{v.plate}</span></td>
                  <td>{v.brand} {v.model} <span className="muted">{v.year ?? ''}</span></td>
                  <td>{v.customer && <Link to={`/clientes/${v.customer.id}`}>{v.customer.name}</Link>}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/os?nova=1&veiculo=${v.id}`} className="button primary btn-sm">Abrir OS</Link>
                      <Link to={`/veiculos/${v.id}/historico`} className="icon-btn" title="Histórico" aria-label={`Histórico de ${v.plate}`}><Icon name="history" /></Link>
                      <button className="icon-btn" title="Editar" aria-label={`Editar ${v.plate}`} onClick={() => setEditing(v)}><Icon name="edit" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Novo veículo' : `Editar ${editing.plate}`} onClose={() => setEditing(null)}>
          <VehicleForm vehicle={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSaved={onSaved} />
        </Modal>
      )}
    </>
  );
}

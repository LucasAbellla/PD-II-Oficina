import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api/client';
import type { Customer, Paged } from '../types';

const empty = { name: '', document: '', phone: '', email: '', notes: '' };

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<Paged<Customer>>(`/customers?pageSize=100&search=${encodeURIComponent(search)}`);
      setItems(res.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api(editingId ? `/customers/${editingId}` : '/customers', { method: editingId ? 'PUT' : 'POST', body: form });
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const edit = (c: Customer) => {
    setEditingId(c.id);
    setForm({ name: c.name, document: c.document ?? '', phone: c.phone ?? '', email: c.email ?? '', notes: c.notes ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <h2>Clientes</h2>
      <form className="card grid" onSubmit={submit}>
        <label>Nome *<input value={form.name} onChange={set('name')} required /></label>
        <label>Telefone<input value={form.phone} onChange={set('phone')} /></label>
        <label>E-mail<input type="email" value={form.email} onChange={set('email')} /></label>
        <label>CPF/CNPJ<input value={form.document} onChange={set('document')} /></label>
        <label className="wide">Observações<input value={form.notes} onChange={set('notes')} /></label>
        <div className="actions wide">
          <button>{editingId ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
          {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar</button>}
        </div>
      </form>
      {error && <p className="error">{error}</p>}

      <input className="search" placeholder="Buscar por nome, telefone ou placa…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Veículos</th><th /></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c._count?.vehicles ?? 0}</td>
                <td><button className="link" onClick={() => edit(c)}>Editar</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="muted">Nenhum cliente encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

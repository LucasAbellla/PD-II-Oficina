import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useFeedback } from '../components/Feedback';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import PasswordForm from '../components/PasswordForm';
import UserForm from '../components/UserForm';
import { formatDate } from '../lib/format';
import { ROLE_LABEL, type User } from '../types';

type ModalState = { type: 'new' } | { type: 'edit'; user: User } | { type: 'password'; user: User } | null;

/** Gestão de usuários da oficina (somente ADMIN). */
export default function UsersPage() {
  const { user: me } = useAuth();
  const { toast } = useFeedback();
  const [users, setUsers] = useState<User[] | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setUsers(await api<User[]>('/auth/users'));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => { if (me?.role === 'ADMIN') void load(); }, [load, me?.role]);

  if (me?.role !== 'ADMIN') return <Navigate to="/os" replace />;

  const close = () => setModal(null);
  const saved = (message: string) => { close(); toast(message); void load(); };

  return (
    <>
      <div className="page-header">
        <h2>Usuários</h2>
        <button className="primary" onClick={() => setModal({ type: 'new' })}><Icon name="plus" /> Novo usuário</button>
      </div>
      <p className="muted">Cada funcionário da oficina deve ter o próprio login. Usuários desativados não conseguem entrar, mas as OS que abriram continuam no histórico.</p>
      {error && <p className="error">{error}</p>}

      {users === null ? <p className="loading">Carregando…</p> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Desde</th><th className="right">Ações</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.active ? '' : 'inactive'}>
                  <td><strong>{u.name}</strong>{u.id === me.id && <span className="muted"> (você)</span>}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : ''}`}>{ROLE_LABEL[u.role]}</span></td>
                  <td>{u.active ? <span className="status-dot on">Ativo</span> : <span className="status-dot off">Desativado</span>}</td>
                  <td>{u.createdAt && formatDate(u.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Editar" aria-label={`Editar ${u.name}`} onClick={() => setModal({ type: 'edit', user: u })}><Icon name="edit" /></button>
                      {u.id !== me.id && (
                        <button className="icon-btn" title="Definir nova senha" aria-label={`Definir nova senha de ${u.name}`} onClick={() => setModal({ type: 'password', user: u })}><Icon name="key" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'new' && (
        <Modal title="Novo usuário" onClose={close}>
          <UserForm onCancel={close} onSaved={(u) => saved(`Usuário ${u.name} criado`)} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title={`Editar ${modal.user.name}`} onClose={close}>
          <UserForm user={modal.user} isSelf={modal.user.id === me.id} onCancel={close} onSaved={() => saved('Usuário atualizado')} />
        </Modal>
      )}
      {modal?.type === 'password' && (
        <Modal title={`Nova senha para ${modal.user.name}`} onClose={close} small>
          <p className="muted">Informe a nova senha ao funcionário. Ele poderá trocá-la depois em "Alterar senha".</p>
          <PasswordForm mode="reset" userId={modal.user.id} onCancel={close} onSaved={() => saved(`Senha de ${modal.user.name} redefinida`)} />
        </Modal>
      )}
    </>
  );
}

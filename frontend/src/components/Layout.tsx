import { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../types';
import { useFeedback } from './Feedback';
import GlobalSearch from './GlobalSearch';
import Icon, { type IconName } from './Icon';
import Modal from './Modal';
import PasswordForm from './PasswordForm';

const NAV: { to: string; label: string; icon: IconName; adminOnly?: boolean }[] = [
  { to: '/os', label: 'Ordens de serviço', icon: 'clipboard' },
  { to: '/clientes', label: 'Clientes', icon: 'users' },
  { to: '/veiculos', label: 'Veículos', icon: 'car' },
  { to: '/usuarios', label: 'Usuários', icon: 'shield', adminOnly: true },
];

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { toast } = useFeedback();
  const [changingPassword, setChangingPassword] = useState(false);
  if (loading) return <p className="loading center">Carregando…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><Icon name="wrench" /></span> Oficina</div>
        <nav>
          {NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN').map((n) => (
            <NavLink key={n.to} to={n.to}><Icon name={n.icon} /> <span>{n.label}</span></NavLink>
          ))}
        </nav>
        <div className="user">
          <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          <span className="user-name" title={user.name}><span>{user.name}</span><small>{ROLE_LABEL[user.role]}</small></span>
          <button className="icon-btn" onClick={() => setChangingPassword(true)} title="Alterar senha" aria-label="Alterar senha"><Icon name="key" /></button>
          <button className="icon-btn" onClick={logout} title="Sair" aria-label="Sair"><Icon name="logout" /></button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar"><GlobalSearch /></header>
        <main className="container">
          <Outlet />
        </main>
      </div>
      {changingPassword && (
        <Modal title="Alterar minha senha" onClose={() => setChangingPassword(false)} small>
          <PasswordForm mode="change" onCancel={() => setChangingPassword(false)}
            onSaved={() => { setChangingPassword(false); toast('Senha alterada com sucesso'); }} />
        </Modal>
      )}
    </div>
  );
}

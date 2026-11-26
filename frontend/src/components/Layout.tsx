import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../types';
import { useFeedback } from './Feedback';
import GlobalSearch from './GlobalSearch';
import Icon, { type IconName } from './Icon';
import Modal from './Modal';
import PasswordForm from './PasswordForm';
import Presence from './Presence';

// short: rótulo usado na barra inferior do celular
const NAV: { to: string; label: string; short?: string; icon: IconName; adminOnly?: boolean }[] = [
  { to: '/painel', label: 'Painel', icon: 'chart' },
  { to: '/os', label: 'Ordens de serviço', short: 'OS', icon: 'clipboard' },
  { to: '/clientes', label: 'Clientes', icon: 'users' },
  { to: '/veiculos', label: 'Veículos', icon: 'car' },
  { to: '/usuarios', label: 'Usuários', icon: 'shield', adminOnly: true },
];

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { toast } = useFeedback();
  const { pathname } = useLocation();
  const [changingPassword, setChangingPassword] = useState(false);
  if (loading) return <p className="loading center" role="status">Carregando…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><Icon name="wrench" /></span> Oficina</div>
        <nav aria-label="Menu principal">
          {NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN').map((n) => (
            <NavLink key={n.to} to={n.to}>
              <Icon name={n.icon} />
              {n.short ? <span><span className="nav-long">{n.label}</span><span className="nav-short">{n.short}</span></span> : <span>{n.label}</span>}
            </NavLink>
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
        <header className="topbar">
          <span className="brand-icon mobile-brand" aria-hidden="true"><Icon name="wrench" size={16} /></span>
          <GlobalSearch />
          {pathname !== '/os' && (
            <Link to="/os?nova=1" className="button primary topbar-new" aria-label="Nova OS"><Icon name="plus" /> <span>Nova OS</span></Link>
          )}
          <button className="icon-btn mobile-only" onClick={() => setChangingPassword(true)} title="Alterar senha" aria-label="Alterar senha"><Icon name="key" /></button>
          <button className="icon-btn mobile-only" onClick={logout} title="Sair" aria-label="Sair"><Icon name="logout" /></button>
        </header>
        <main key={pathname} className="container page-enter">
          <Outlet />
        </main>
      </div>
      <Presence>{changingPassword && (
        <Modal title="Alterar minha senha" onClose={() => setChangingPassword(false)} small>
          <PasswordForm mode="change" onCancel={() => setChangingPassword(false)}
            onSaved={() => { setChangingPassword(false); toast('Senha alterada com sucesso'); }} />
        </Modal>
      )}</Presence>
    </div>
  );
}

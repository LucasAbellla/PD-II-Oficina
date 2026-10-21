import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import GlobalSearch from './GlobalSearch';
import Icon, { type IconName } from './Icon';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/os', label: 'Ordens de serviço', icon: 'clipboard' },
  { to: '/clientes', label: 'Clientes', icon: 'users' },
  { to: '/veiculos', label: 'Veículos', icon: 'car' },
];

export default function Layout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p className="loading center">Carregando…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><Icon name="wrench" /></span> Oficina</div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}><Icon name={n.icon} /> <span>{n.label}</span></NavLink>
          ))}
        </nav>
        <div className="user">
          <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          <span className="user-name">{user.name}<small>{user.role === 'ADMIN' ? 'Administrador' : 'Atendente'}</small></span>
          <button className="icon-btn" onClick={logout} title="Sair" aria-label="Sair"><Icon name="logout" /></button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar"><GlobalSearch /></header>
        <main className="container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

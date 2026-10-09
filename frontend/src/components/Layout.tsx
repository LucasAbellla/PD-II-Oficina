import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p className="center">Carregando…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <header className="topbar">
        <strong>🔧 Oficina</strong>
        <nav>
          <NavLink to="/os">Ordens de serviço</NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/veiculos">Veículos</NavLink>
        </nav>
        <span className="user">
          {user.name} <button className="link" onClick={logout}>Sair</button>
        </span>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { clientTokenStore } from '../api/client';
import Icon from './Icon';

/** Estrutura da área do cliente (sem menu lateral de funcionário). */
export default function ClientLayout() {
  const navigate = useNavigate();
  if (!clientTokenStore.get()) return <Navigate to="/cliente" replace />;

  return (
    <div className="cl-page">
      <header className="cl-head">
        <div className="brand"><span className="brand-icon"><Icon name="wrench" /></span> Área do cliente</div>
        <button
          className="secondary btn-sm"
          onClick={() => {
            clientTokenStore.clear();
            navigate('/cliente');
          }}
        >
          <Icon name="logout" size={16} /> Sair
        </button>
      </header>
      <main className="cl-main">
        <Outlet />
      </main>
    </div>
  );
}

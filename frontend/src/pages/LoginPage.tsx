import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import BrandPanel from '../components/BrandPanel';
import Icon from '../components/Icon';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/os" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/os');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <BrandPanel />
      <main className="login-side">
      <form className="card login" onSubmit={submit}>
        <Link to="/" className="back-link"><Icon name="back" size={16} /> Voltar</Link>
        <div>
          <h2>Acesso da equipe</h2>
          <p className="muted">Entre para gerenciar clientes, veículos e ordens de serviço.</p>
        </div>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy} aria-busy={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      </main>
    </div>
  );
}

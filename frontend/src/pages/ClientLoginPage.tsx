import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { clientApi, clientTokenStore, errorMessage } from '../api/client';
import BrandPanel from '../components/BrandPanel';
import Icon from '../components/Icon';

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (clientTokenStore.get()) return <Navigate to="/cliente/veiculos" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await clientApi<{ token: string }>('/client/login', { method: 'POST', body: { identifier, pin }, auth: false });
      clientTokenStore.set(res.token);
      navigate('/cliente/veiculos');
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
        <h2>Área do cliente</h2>
        <p className="muted">
          Entre com a <strong>placa do veículo</strong> para ver apenas aquele veículo, ou com o seu <strong>CPF</strong> para ver
          todos os veículos do seu cadastro.
        </p>
        <label>Placa ou CPF
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ABC1D23 ou 000.000.000-00" required autoFocus
            className={/^[a-z]/i.test(identifier) ? 'plate-input' : undefined} />
        </label>
        <label>Código de acesso (6 dígitos)
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required className="pin-input" placeholder="••••••" />
          <small className="muted">O código é fornecido pela oficina. Não tem um? Peça no balcão ou pelo WhatsApp.</small>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy} aria-busy={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      </main>
    </div>
  );
}

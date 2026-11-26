import { Link } from 'react-router-dom';
import BrandPanel from '../components/BrandPanel';
import Icon from '../components/Icon';

/** Tela inicial: escolha entre o acesso de funcionário e o de cliente. */
export default function LandingPage() {
  return (
    <div className="login-page">
      <BrandPanel />
      <main className="login-side">
        <div className="landing-box">
          <h2>Como você deseja entrar?</h2>
          <p className="muted">Funcionários usam e-mail e senha. Clientes entram com a placa ou o CPF.</p>
          <div className="landing-choices">
            <Link className="landing-choice" to="/login">
              <span className="icon-tile"><Icon name="wrench" size={24} /></span>
              <strong>Sou funcionário</strong>
              <span className="desc">Clientes, veículos, ordens de serviço e notas fiscais.</span>
              <span className="go"><Icon name="arrow" /></span>
            </Link>
            <Link className="landing-choice" to="/cliente">
              <span className="icon-tile tile-accent"><Icon name="car" size={24} /></span>
              <strong>Sou cliente</strong>
              <span className="desc">Status do seu veículo, serviços feitos e nota fiscal.</span>
              <span className="go"><Icon name="arrow" /></span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

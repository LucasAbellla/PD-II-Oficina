import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

/** Tela inicial: escolha entre o acesso de funcionário e o de cliente. */
export default function LandingPage() {
  return (
    <div className="login-page">
      <div className="card landing-box">
        <div className="brand brand-lg"><span className="brand-icon"><Icon name="wrench" size={22} /></span> Oficina</div>
        <p className="muted">Como você deseja entrar?</p>
        <div className="landing-choices">
          <Link className="landing-choice" to="/login">
            <Icon name="shield" size={26} />
            <strong>Sou funcionário</strong>
            <span>Gerencie clientes, veículos, ordens de serviço e notas fiscais.</span>
          </Link>
          <Link className="landing-choice" to="/cliente">
            <Icon name="car" size={26} />
            <strong>Sou cliente</strong>
            <span>Acompanhe o status do seu veículo, veja o que foi feito e baixe a nota fiscal.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

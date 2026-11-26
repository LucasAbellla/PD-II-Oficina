import Icon from './Icon';

/** Painel de marca das telas de entrada (tela inicial e logins). */
export default function BrandPanel() {
  return (
    <aside className="brand-panel">
      <div className="brand"><span className="brand-icon"><Icon name="wrench" /></span> Oficina</div>
      <div>
        <h1>Do balcão à entrega, cada carro no seu lugar.</h1>
        <p>Ordens de serviço, histórico por placa e acompanhamento pelo cliente em um só sistema.</p>
        <ul className="brand-points">
          <li><Icon name="clipboard" /> Status de cada OS em tempo real</li>
          <li><Icon name="history" /> Tudo o que já foi feito em cada veículo</li>
          <li><Icon name="link" /> Link para o cliente acompanhar pelo celular</li>
        </ul>
      </div>
      <span className="plate plate-lg brand-plate" aria-hidden="true">OFC2D26</span>
    </aside>
  );
}

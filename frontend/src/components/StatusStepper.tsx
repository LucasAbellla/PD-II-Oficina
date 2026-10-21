import { STATUS_LABEL, type OrderStatus } from '../types';
import Icon from './Icon';

const FLOW: OrderStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];

/** Mostra em que etapa do fluxo da OS ela está (RF07). */
export default function StatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELED') return <div className="stepper-canceled">Esta OS foi cancelada.</div>;
  // Entregue é a etapa final: mostra todas como concluídas
  const current = status === 'DELIVERED' ? FLOW.length : FLOW.indexOf(status);
  return (
    <ol className="stepper">
      {FLOW.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''}>
          <span className="step-dot">{i < current ? <Icon name="check" size={14} /> : i + 1}</span>
          <span className="step-label">{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

import { STATUS_LABEL, type OrderStatus } from '../types';
import { formatDateTime } from '../lib/format';
import Icon from './Icon';

const FLOW: OrderStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];

/** Etapas do atendimento com a data de cada uma. Usada na área do cliente e no link público. */
export default function StatusTimeline({ status, events }: { status: OrderStatus; events: { status: OrderStatus; at: string }[] }) {
  const when = new Map(events.map((e) => [e.status, e.at]));
  if (status === 'CANCELED') {
    return <div className="stepper-canceled">Esta ordem de serviço foi cancelada{when.has('CANCELED') ? ` em ${formatDateTime(when.get('CANCELED')!)}` : ''}.</div>;
  }
  const current = status === 'DELIVERED' ? FLOW.length : FLOW.indexOf(status);
  return (
    <ol className="stepper">
      {FLOW.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''}>
          <span className="step-dot">{i < current ? <Icon name="check" size={14} /> : i + 1}</span>
          <span className="step-label">{STATUS_LABEL[s]}</span>
          <small className="step-date">{when.has(s) ? formatDateTime(when.get(s)!) : 'Aguardando'}</small>
        </li>
      ))}
    </ol>
  );
}

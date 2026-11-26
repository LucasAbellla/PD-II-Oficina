import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import Icon, { type IconName } from '../components/Icon';
import { LoadError, SkeletonPage } from '../components/Skeleton';
import { useCountUp } from '../hooks/useCountUp';
import { formatMinutes } from '../lib/format';
import { STATUS_LABEL, type DashboardSummary, type OrderStatus } from '../types';

function Stat({ value, label, icon, tone, to }: { value: number; label: string; icon: IconName; tone?: string; to?: string }) {
  const shown = useCountUp(value);
  const body = (
    <>
      <span className={`icon-tile ${tone ?? ''}`}><Icon name={icon} /></span>
      <span className="stat-value">{shown}</span>
      <span className="stat-label">{label}</span>
    </>
  );
  return to ? <Link to={to} className="stat">{body}</Link> : <div className="stat">{body}</div>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api<DashboardSummary>('/dashboard').then(setData).catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  if (!data) return error ? <LoadError message={error} onRetry={load} /> : <SkeletonPage stats={4} cards={2} />;
  const statuses = Object.keys(STATUS_LABEL) as OrderStatus[];
  const max = Math.max(1, ...statuses.map((s) => data.byStatus[s]));

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Painel</h2>
          <p className="page-sub">Movimento da oficina e tempo de atendimento.</p>
        </div>
      </div>
      <div className="stats stagger">
        <Stat value={data.inProgressNow} label="OS em aberto" icon="clipboard" tone="tile-accent" to="/os" />
        <Stat value={data.last30Days} label="OS nos últimos 30 dias" icon="calendar" to="/os" />
        <Stat value={data.returningVehicles} label="Veículos que retornaram" icon="repeat" tone="tile-success" to="/veiculos" />
        <Stat value={data.totalCustomers} label={`Clientes, com ${data.totalVehicles} veículos`} icon="users" tone="tile-ink" to="/clientes" />
      </div>

      <div className="dash-grid">
        <div className="card">
          <h3 className="card-title"><Icon name="chart" /> OS por status</h3>
          {statuses.map((s, i) => (
            <Link to={`/os?status=${s}`} className="bar-row" key={s}>
              <span>{STATUS_LABEL[s]}</span>
              <div className="bar-track">
                <div className={`bar-fill bar-${s.toLowerCase()}`} style={{ width: `${(data.byStatus[s] / max) * 100}%`, ['--i' as string]: i }} />
              </div>
              <strong>{data.byStatus[s]}</strong>
            </Link>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title"><Icon name="clock" /> Tempo médio por etapa</h3>
          <p className="muted small">Últimos 90 dias, a partir das mudanças de status de cada OS.</p>
          <ul className="durations">
            <li><span>Aberta até iniciar</span><span>{formatMinutes(data.averageMinutes.OPEN)}</span></li>
            <li><span>Em andamento até concluir</span><span>{formatMinutes(data.averageMinutes.IN_PROGRESS)}</span></li>
            <li><span>Concluída até entregar</span><span>{formatMinutes(data.averageMinutes.COMPLETED)}</span></li>
            <li className="total"><span>Da abertura à conclusão</span><span>{formatMinutes(data.averageMinutes.TOTAL)}</span></li>
          </ul>
        </div>
      </div>
    </>
  );
}

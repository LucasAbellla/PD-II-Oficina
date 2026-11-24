import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { formatMinutes } from '../lib/format';
import { STATUS_LABEL, type DashboardSummary, type OrderStatus } from '../types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<DashboardSummary>('/dashboard').then(setData).catch((e) => setError(errorMessage(e)));
  }, []);

  if (!data) return error ? <p className="error">{error}</p> : <p className="loading">Carregando…</p>;
  const statuses = Object.keys(STATUS_LABEL) as OrderStatus[];
  const max = Math.max(1, ...statuses.map((s) => data.byStatus[s]));

  return (
    <>
      <div className="page-header"><h2>Painel</h2></div>
      <div className="stats">
        <div className="stat"><span className="stat-value">{data.inProgressNow}</span><span className="stat-label">OS em aberto</span></div>
        <div className="stat"><span className="stat-value">{data.last30Days}</span><span className="stat-label">OS nos últimos 30 dias</span></div>
        <div className="stat"><span className="stat-value">{data.returningVehicles}</span><span className="stat-label">Veículos que retornaram</span></div>
        <div className="stat"><span className="stat-value">{data.totalCustomers}</span><span className="stat-label">Clientes · {data.totalVehicles} veículos</span></div>
      </div>

      <div className="card">
        <h3>OS por status</h3>
        {statuses.map((s) => (
          <div className="bar-row" key={s}>
            <span>{STATUS_LABEL[s]}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(data.byStatus[s] / max) * 100}%` }} /></div>
            <strong>{data.byStatus[s]}</strong>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Tempo médio por etapa (últimos 90 dias)</h3>
        <table>
          <tbody>
            <tr><td>Aberta → Em andamento</td><td>{formatMinutes(data.averageMinutes.OPEN)}</td></tr>
            <tr><td>Em andamento → Concluída</td><td>{formatMinutes(data.averageMinutes.IN_PROGRESS)}</td></tr>
            <tr><td>Concluída → Entregue</td><td>{formatMinutes(data.averageMinutes.COMPLETED)}</td></tr>
            <tr><td><strong>Abertura → Conclusão</strong></td><td><strong>{formatMinutes(data.averageMinutes.TOTAL)}</strong></td></tr>
          </tbody>
        </table>
        <p className="muted small">Calculado a partir do registro de mudanças de status de cada OS.</p>
      </div>
    </>
  );
}

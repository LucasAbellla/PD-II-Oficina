/** Esqueletos exibidos enquanto os dados carregam, no formato do conteúdo final. */

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap" role="status" aria-label="Carregando">
      <table>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}><span className="sk sk-line" style={{ width: `${45 + ((r * 7 + c * 13) % 45)}%` }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPage({ stats = 0, cards = 2 }: { stats?: number; cards?: number }) {
  return (
    <div role="status" aria-label="Carregando">
      <span className="sk sk-title" />
      {stats > 0 && (
        <div className="stats">
          {Array.from({ length: stats }, (_, i) => <div key={i} className="stat"><span className="sk sk-num" /><span className="sk sk-line" /></div>)}
        </div>
      )}
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card">
          <span className="sk sk-line" style={{ width: '30%' }} />
          <span className="sk sk-line" />
          <span className="sk sk-line" style={{ width: '70%' }} />
        </div>
      ))}
    </div>
  );
}

/** Mensagem de erro de carregamento com opção de tentar de novo. */
export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error error-row" role="alert">
      <span>{message}</span>
      {onRetry && <button type="button" className="btn-sm secondary" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}

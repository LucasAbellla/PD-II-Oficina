/**
 * Regras de transição de status da OS (RF07).
 * Isolado em função pura para facilitar testes e futura expansão
 * (ex.: novos status como WAITING_PARTS) sem tocar nas rotas.
 */
export type OrderStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELED';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELED'],
  COMPLETED: ['DELIVERED', 'IN_PROGRESS'],
  DELIVERED: [],
  CANCELED: [],
};

export const allowedTransitions = (from: OrderStatus): OrderStatus[] => transitions[from];

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => transitions[from].includes(to);

/** OS encerradas não aceitam novos serviços. */
export const isClosed = (status: OrderStatus): boolean => status === 'DELIVERED' || status === 'CANCELED';

export type Role = 'ADMIN' | 'ATTENDANT';
export type OrderStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELED';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelada',
};

export interface User { id: string; name: string; email: string; role: Role }
export interface Paged<T> { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }

export interface Customer {
  id: string; name: string; document?: string | null; phone?: string | null;
  email?: string | null; notes?: string | null; _count?: { vehicles: number };
}
export interface Vehicle {
  id: string; plate: string; brand: string; model: string; year?: number | null;
  color?: string | null; customerId: string; customer?: { id: string; name: string };
}
export interface ServiceItem { id: string; description: string; notes?: string | null; performedAt: string }
export interface OrderSummary {
  id: string; number: number; status: OrderStatus; description: string; openedAt: string;
  vehicle: { id: string; plate: string; brand: string; model: string; customer: { name: string } };
}
export interface OrderDetail {
  id: string; number: number; status: OrderStatus; description: string; mileageIn?: number | null;
  openedAt: string; closedAt?: string | null; items: ServiceItem[]; allowedTransitions: OrderStatus[];
  vehicle: Vehicle & { customer: { id: string; name: string; phone?: string | null } };
  createdBy: { id: string; name: string };
}
export interface VehicleHistory {
  vehicle: Vehicle & { customer: Customer };
  orders: { id: string; number: number; status: OrderStatus; description: string; openedAt: string; items: ServiceItem[] }[];
}

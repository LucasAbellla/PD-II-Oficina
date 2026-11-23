export type Role = 'ADMIN' | 'ATTENDANT';
export type OrderStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELED';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelada',
};

export type StatusSummary = Record<OrderStatus, number>;

export const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Administrador', ATTENDANT: 'Atendente' };

export interface User { id: string; name: string; email: string; role: Role; active?: boolean; createdAt?: string }
export interface Paged<T> { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }

export interface Customer {
  id: string; name: string; document?: string | null; phone?: string | null;
  email?: string | null; notes?: string | null; _count?: { vehicles: number };
  access?: { updatedAt: string } | null;
}
export interface CustomerDetail extends Customer { vehicles: Vehicle[] }
export interface Vehicle {
  id: string; plate: string; brand: string; model: string; year?: number | null;
  color?: string | null; customerId: string; customer?: { id: string; name: string };
}
export interface ServiceItem { id: string; description: string; notes?: string | null; performedAt: string }
export interface OrderSummary {
  id: string; number: number; status: OrderStatus; description: string; openedAt: string; mileageIn?: number | null;
  vehicle: { id: string; plate: string; brand: string; model: string; customer: { name: string } };
}
export interface OrderDetail {
  id: string; number: number; status: OrderStatus; description: string; mileageIn?: number | null;
  openedAt: string; closedAt?: string | null; items: ServiceItem[]; allowedTransitions: OrderStatus[];
  vehicle: Vehicle & { customer: { id: string; name: string; phone?: string | null } };
  createdBy: { id: string; name: string };
  events: TimelineEvent[];
  publicToken?: string | null; publicTokenExpiresAt?: string | null;
  invoice?: { id: string; fileName: string; sizeBytes: number; uploadedAt: string } | null;
}
export interface VehicleHistory {
  vehicle: Vehicle & { customer: Customer };
  orders: {
    id: string; number: number; status: OrderStatus; description: string; openedAt: string;
    closedAt?: string | null; mileageIn?: number | null; items: ServiceItem[];
  }[];
}

export interface TimelineEvent { id: string; fromStatus: OrderStatus | null; toStatus: OrderStatus; createdAt: string; by: string | null }

export interface PublicOrder {
  workshop: string;
  order: { number: number; status: OrderStatus; description: string; openedAt: string; closedAt?: string | null };
  vehicle: { brand: string; model: string; year?: number | null; color?: string | null; plate: string };
  items: { id: string; description: string; performedAt: string }[];
  timeline: { status: OrderStatus; at: string }[];
  history: { number: number; openedAt: string; status: OrderStatus; services: string[] }[];
  expiresAt: string;
  generatedAt: string;
}

export interface DashboardSummary {
  byStatus: Record<OrderStatus, number>;
  inProgressNow: number;
  last30Days: number;
  returningVehicles: number;
  totalCustomers: number;
  totalVehicles: number;
  averageMinutes: { OPEN: number | null; IN_PROGRESS: number | null; COMPLETED: number | null; TOTAL: number | null };
}

export interface ClientVehicleSummary {
  id: string; plate: string; brand: string; model: string; year?: number | null; color?: string | null;
  latestOrder: { number: number; status: OrderStatus; openedAt: string } | null;
}
export interface ClientVehicleList { customerName: string; scope: 'vehicle' | 'customer'; vehicles: ClientVehicleSummary[] }
export interface ClientOrder {
  id: string; number: number; status: OrderStatus; description: string; openedAt: string; closedAt?: string | null;
  items: { id: string; description: string; performedAt: string }[];
  timeline: { status: OrderStatus; at: string }[];
  invoiceReady: boolean;
  invoice: { fileName: string; sizeBytes: number; uploadedAt: string } | null;
}
export interface ClientVehicleDetail {
  vehicle: { id: string; plate: string; brand: string; model: string; year?: number | null; color?: string | null };
  orders: ClientOrder[];
}

import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
      client?: { customerId: string; vehicleId?: string };
    }
  }
}

export {};

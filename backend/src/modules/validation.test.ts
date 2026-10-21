import { describe, expect, it } from 'vitest';
import { paginationSchema } from '../lib/http.js';
import { customerSchema } from './customers/customers.schema.js';
import {
  createOrderSchema,
  itemSchema,
  orderListQuery,
  statusSchema,
} from './service-orders/service-orders.schema.js';
import { vehicleSchema } from './vehicles/vehicles.schema.js';

const customerId = '123e4567-e89b-12d3-a456-426614174000';

describe('validação e normalização do MVP', () => {
  it('normaliza campos de cliente e transforma opcionais vazios em null', () => {
    expect(
      customerSchema.parse({
        name: '  Maria da Silva  ',
        document: '',
        phone: '  (51) 99999-0000 ',
        email: '',
        notes: '',
      }),
    ).toEqual({ name: 'Maria da Silva', phone: '(51) 99999-0000', document: null, email: null, notes: null });
    expect(() => customerSchema.parse({ name: 'Maria', email: 'invalido' })).toThrow();
  });

  it('permite limpar ano e cor do veículo na edição', () => {
    const parsed = vehicleSchema.parse({ plate: 'ABC1234', brand: 'Fiat', model: 'Uno', customerId, year: null, color: '' });
    expect(parsed.year).toBeNull();
    expect(parsed.color).toBeNull();
  });

  it('valida e normaliza placas antigas e Mercosul', () => {
    expect(vehicleSchema.parse({ plate: 'abc1234', brand: 'Fiat', model: 'Uno', customerId }).plate).toBe('ABC1234');
    expect(vehicleSchema.parse({ plate: 'abc1d23', brand: 'Fiat', model: 'Uno', customerId }).plate).toBe('ABC1D23');
    expect(() => vehicleSchema.parse({ plate: 'AB-123', brand: 'Fiat', model: 'Uno', customerId })).toThrow();
  });

  it('coage números válidos e bloqueia quilometragem negativa', () => {
    expect(createOrderSchema.parse({ vehicleId: customerId, description: 'Troca de óleo', mileageIn: '85000' }).mileageIn).toBe(85000);
    expect(() => createOrderSchema.parse({ vehicleId: customerId, description: 'Troca de óleo', mileageIn: -1 })).toThrow();
  });

  it('valida status, itens e filtros aceitos pela API', () => {
    expect(statusSchema.parse({ status: 'IN_PROGRESS' })).toEqual({ status: 'IN_PROGRESS' });
    expect(() => statusSchema.parse({ status: 'INVALID' })).toThrow();
    expect(itemSchema.parse({ description: '  Alinhamento  ' }).description).toBe('Alinhamento');
    expect(orderListQuery.parse({ page: '2', pageSize: '50', status: 'OPEN' })).toEqual({ page: 2, pageSize: 50, status: 'OPEN' });
  });

  it('limita a paginação a 100 registros', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(() => paginationSchema.parse({ pageSize: 101 })).toThrow();
  });
});

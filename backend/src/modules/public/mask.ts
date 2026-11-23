/** Oculta parte da placa na página pública (minimização de dados — LGPD). Ex.: ABC1D23 → ABC****. */
export function maskPlate(plate: string): string {
  if (plate.length <= 3) return plate;
  return plate.slice(0, 3) + '*'.repeat(plate.length - 3);
}

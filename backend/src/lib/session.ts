/** O token foi emitido antes do instante informado? (iat do JWT vem em segundos) */
export function issuedBefore(iat: number | undefined, instant: Date | null | undefined): boolean {
  if (!instant) return false;
  return iat === undefined || iat < Math.floor(instant.getTime() / 1000);
}

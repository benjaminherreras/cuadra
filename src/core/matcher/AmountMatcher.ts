const TOLERANCE_EXACT = 0.01
const TOLERANCE_SMALL = 10

export function amountScore(transaccionMonto: number, montoEsperadoDeposito: number): number {
  const diff = Math.abs(Math.abs(transaccionMonto) - Math.abs(montoEsperadoDeposito))
  if (diff <= TOLERANCE_EXACT) return 100
  const pct = diff / Math.abs(montoEsperadoDeposito || 1)
  if (pct <= 0.001) return 98
  if (diff <= TOLERANCE_SMALL) return 90
  if (pct <= 0.01) return 80
  if (pct <= 0.05) return 60
  if (pct <= 0.10) return 40
  return 0
}

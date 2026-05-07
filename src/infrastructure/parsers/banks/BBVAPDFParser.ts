import { BasePDFParser } from '../pdf/BasePDFParser.js'

export class BBVAPDFParser extends BasePDFParser {
  readonly banco = 'BBVA'
  protected readonly markers = ['BBVA', 'BANCOMER']

  // BBVA Mexico: DD/MM/YYYY or DD/MM/YY
  protected parseDate(token: string): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{2,4})$/.exec(token)
    if (!m) return null
    const year = m[3]!.length === 2 ? parseInt(m[3]!) + 2000 : parseInt(m[3]!)
    return new Date(`${year}-${m[2]}-${m[1]}`)
  }

  // BBVA layout: CARGO | ABONO | SALDO  (cargo = withdrawal, abono = deposit)
  protected override calcMonto(amounts: number[], description: string, prevBalance: number | null): number {
    if (amounts.length === 3) {
      const cargo = amounts[0]!
      const abono = amounts[1]!
      if (abono > 0 && cargo === 0) return abono
      if (cargo > 0 && abono === 0) return -cargo
    }
    return super.calcMonto(amounts, description, prevBalance)
  }
}

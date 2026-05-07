import { BasePDFParser } from '../pdf/BasePDFParser.js'

export class ScotiabankPDFParser extends BasePDFParser {
  readonly banco = 'SCOTIABANK'
  protected readonly markers = ['SCOTIABANK', 'SCOTIABANK INVERLAT']

  protected parseDate(token: string): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(token)
    if (!m) return null
    return new Date(`${m[3]}-${m[2]}-${m[1]}`)
  }

  // Scotiabank: CARGO | ABONO | SALDO
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

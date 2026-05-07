import { BasePDFParser } from '../pdf/BasePDFParser.js'

export class HSBCPDFParser extends BasePDFParser {
  readonly banco = 'HSBC'
  protected readonly markers = ['HSBC']

  // HSBC Mexico: DD/MM/YYYY
  protected parseDate(token: string): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(token)
    if (!m) return null
    return new Date(`${m[3]}-${m[2]}-${m[1]}`)
  }

  // HSBC layout: DÉBITO | CRÉDITO | SALDO  (debito = withdrawal, credito = deposit)
  protected override calcMonto(amounts: number[], description: string, prevBalance: number | null): number {
    if (amounts.length === 3) {
      const debito = amounts[0]!
      const credito = amounts[1]!
      if (credito > 0 && debito === 0) return credito
      if (debito > 0 && credito === 0) return -debito
    }
    return super.calcMonto(amounts, description, prevBalance)
  }
}

import { BasePDFParser } from '../pdf/BasePDFParser.js'

const MESES: Record<string, string> = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12',
}

export class CitibanamexPDFParser extends BasePDFParser {
  readonly banco = 'CITIBANAMEX'
  protected readonly markers = ['CITIBANAMEX', 'BANAMEX', 'BANCO NACIONAL DE MEXICO']

  // Citibanamex uses DD/MMM/YYYY (Spanish) or DD/MM/YYYY
  protected parseDate(token: string): Date | null {
    // DD/MMM/YYYY e.g. 01/ENE/2024
    const mSpanish = /^(\d{2})\/([A-Z]{3})\/(\d{4})$/.exec(token)
    if (mSpanish) {
      const mm = MESES[mSpanish[2]!]
      if (!mm) return null
      return new Date(`${mSpanish[3]}-${mm}-${mSpanish[1]}`)
    }
    // DD/MM/YYYY
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(token)
    if (!m) return null
    return new Date(`${m[3]}-${m[2]}-${m[1]}`)
  }

  // Citibanamex: RETIRO | DEPÓSITO | SALDO
  protected override calcMonto(amounts: number[], description: string, prevBalance: number | null): number {
    if (amounts.length === 3) {
      const retiro = amounts[0]!
      const deposito = amounts[1]!
      if (deposito > 0 && retiro === 0) return deposito
      if (retiro > 0 && deposito === 0) return -retiro
    }
    return super.calcMonto(amounts, description, prevBalance)
  }
}

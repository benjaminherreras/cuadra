import { BasePDFParser } from '../pdf/BasePDFParser.js'

const MESES: Record<string, string> = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12',
}

export class BanortePDFParser extends BasePDFParser {
  readonly banco = 'BANORTE'
  protected readonly markers = ['BANORTE', 'BANCO MERCANTIL DEL NORTE']

  protected parseDate(token: string): Date | null {
    const m = /^(\d{2})-([A-Z]{3})-(\d{2})$/.exec(token)
    if (!m) return null
    const mm = MESES[m[2]!]
    if (!mm) return null
    return new Date(`${parseInt(m[3]!) + 2000}-${mm}-${m[1]}`)
  }

  // Banorte layout: DEPOSITO | RETIRO | SALDO
  protected override calcMonto(amounts: number[], description: string, prevBalance: number | null): number {
    if (amounts.length === 3) {
      const dep = amounts[0]!
      const ret = amounts[1]!
      if (dep > 0 && ret === 0) return dep
      if (ret > 0 && dep === 0) return -ret
    }
    return super.calcMonto(amounts, description, prevBalance)
  }
}

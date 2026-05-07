import { BasePDFParser } from '../pdf/BasePDFParser.js'

export class MifelPDFParser extends BasePDFParser {
  readonly banco = 'MIFEL'
  protected readonly markers = ['MIFEL', 'BANCO MIFEL']

  protected parseDate(token: string): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(token)
    if (!m) return null
    return new Date(`${m[3]}-${m[2]}-${m[1]}`)
  }
}

import { parse } from 'csv-parse/sync'
import { v4 as uuidv4 } from 'uuid'
import { InvalidCSVError } from '../../../domain/errors/DomainErrors.js'
import type { IBankParser } from '../../../domain/interfaces/IBankParser.js'
import type { TransaccionBancaria } from '../../../domain/entities/TransaccionBancaria.js'

type Row = Record<string, string>

const MESES: Record<string, string> = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12',
}

function norm(k: string) {
  return k.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function parseAmount(v: string): number {
  const n = parseFloat(v.replace(/[$,\s]/g, ''))
  return isNaN(n) ? 0 : n
}

function parseDate(v: string): Date {
  const t = v.trim()
  // DD/MMM/YYYY
  const mSpanish = /^(\d{2})\/([A-Z]{3})\/(\d{4})$/i.exec(t)
  if (mSpanish) {
    const mm = MESES[mSpanish[2]!.toUpperCase()]
    if (mm) return new Date(`${mSpanish[3]}-${mm}-${mSpanish[1]}`)
  }
  // DD/MM/YYYY
  const mNum = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t)
  if (mNum) return new Date(`${mNum[3]}-${mNum[2]}-${mNum[1]}`)
  throw new InvalidCSVError(`Fecha Citibanamex no reconocida: ${v}`)
}

export class CitibanamexParser implements IBankParser {
  readonly banco = 'CITIBANAMEX'

  canParse(fileContent: Buffer): boolean {
    if (fileContent[0] === 0x25 && fileContent[1] === 0x50) return false
    const first = norm(fileContent.toString('utf-8').split('\n')[0] ?? '')
    return (first.includes('retiro') || first.includes('cargo')) &&
           (first.includes('deposito') || first.includes('abono'))
  }

  async parse(fileContent: Buffer, sessionId: string): Promise<TransaccionBancaria[]> {
    const csv = fileContent.toString('utf-8')
    const delim = csv.includes(';') ? ';' : ','
    let rows: Row[]
    try {
      rows = parse(csv, { delimiter: delim, columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Row[]
    } catch (e) {
      throw new InvalidCSVError(`CSV Citibanamex inválido: ${String(e)}`)
    }
    const out: TransaccionBancaria[] = []
    for (const row of rows) {
      const r: Row = {}
      for (const [k, v] of Object.entries(row)) r[norm(k)] = v
      if (!r['fecha']) continue
      const retiro = parseAmount(r['retiro'] ?? r['cargo'] ?? '0')
      const deposito = parseAmount(r['deposito'] ?? r['abono'] ?? '0')
      const monto = deposito > 0 ? deposito : -retiro
      if (monto === 0) continue
      out.push({ id: uuidv4(), sessionId, fecha: parseDate(r['fecha']!), descripcion: r['descripcion'] ?? r['concepto'] ?? '', monto, banco: this.banco, rawLine: Object.values(row).join(delim) })
    }
    return out
  }
}

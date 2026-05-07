import { parse } from 'csv-parse/sync'
import { v4 as uuidv4 } from 'uuid'
import { InvalidCSVError } from '../../../domain/errors/DomainErrors.js'
import type { IBankParser } from '../../../domain/interfaces/IBankParser.js'
import type { TransaccionBancaria } from '../../../domain/entities/TransaccionBancaria.js'

type Row = Record<string, string>

function norm(k: string) { return k.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim() }
function amt(v: string): number { const n = parseFloat(v.replace(/[$,\s]/g, '')); return isNaN(n) ? 0 : n }
function parseDate(v: string): Date {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim())
  if (!m) throw new InvalidCSVError(`Fecha Afirme no reconocida: ${v}`)
  return new Date(`${m[3]}-${m[2]}-${m[1]}`)
}

export class AfirmeParser implements IBankParser {
  readonly banco = 'AFIRME'
  canParse(fileContent: Buffer): boolean {
    if (fileContent[0] === 0x25 && fileContent[1] === 0x50) return false
    const first = norm(fileContent.toString('utf-8').split('\n')[0] ?? '')
    return first.includes('afirme')
  }
  async parse(fileContent: Buffer, sessionId: string): Promise<TransaccionBancaria[]> {
    const csv = fileContent.toString('utf-8')
    const delim = csv.includes(';') ? ';' : ','
    let rows: Row[]
    try { rows = parse(csv, { delimiter: delim, columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Row[] }
    catch (e) { throw new InvalidCSVError(`CSV Afirme inválido: ${String(e)}`) }
    const out: TransaccionBancaria[] = []
    for (const row of rows) {
      const r: Row = {}; for (const [k, v] of Object.entries(row)) r[norm(k)] = v
      if (!r['fecha']) continue
      const cargo = amt(r['cargo'] ?? r['retiro'] ?? '0'); const abono = amt(r['abono'] ?? r['deposito'] ?? '0')
      const monto = abono > 0 ? abono : -cargo
      if (monto === 0) continue
      out.push({ id: uuidv4(), sessionId, fecha: parseDate(r['fecha']!), descripcion: r['descripcion'] ?? r['concepto'] ?? '', monto, banco: this.banco, rawLine: Object.values(row).join(delim) })
    }
    return out
  }
}

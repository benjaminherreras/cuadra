import { parse } from 'csv-parse/sync'
import { v4 as uuidv4 } from 'uuid'
import { InvalidCSVError } from '../../../domain/errors/DomainErrors.js'
import type { IBankParser } from '../../../domain/interfaces/IBankParser.js'
import type { TransaccionBancaria } from '../../../domain/entities/TransaccionBancaria.js'

type ParsedRow = Record<string, string>

function parseAmount(val: string): number {
  if (!val || val.trim() === '' || val.trim() === '-') return 0
  const cleaned = val.replace(/[$,\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

function parseDate(val: string): Date {
  const trimmed = val.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return new Date(trimmed)
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy
    return new Date(`${y}-${m}-${d}`)
  }
  throw new InvalidCSVError(`Formato de fecha Banorte no reconocido: ${val}`)
}

function normalizeKey(k: string): string {
  return k
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export class BanorteParser implements IBankParser {
  readonly banco = 'BANORTE'

  canParse(fileContent: Buffer): boolean {
    if (fileContent[0] === 0x25 && fileContent[1] === 0x50) return false // %PDF
    const firstLine = normalizeKey(fileContent.toString('utf-8').split('\n')[0] ?? '')
    return firstLine.includes('deposito') && firstLine.includes('retiro')
  }

  async parse(fileContent: Buffer, sessionId: string): Promise<TransaccionBancaria[]> {
    const csvContent = fileContent.toString('utf-8')
    const delimiter = csvContent.includes(';') ? ';' : ','
    let rows: ParsedRow[]
    try {
      rows = parse(csvContent, {
        delimiter,
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }) as ParsedRow[]
    } catch (err) {
      throw new InvalidCSVError(`No se pudo parsear el CSV Banorte: ${String(err)}`)
    }

    if (rows.length === 0) throw new InvalidCSVError('CSV Banorte vacío o sin filas de datos')

    const transactions: TransaccionBancaria[] = []
    for (const row of rows) {
      const nr: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        nr[normalizeKey(k)] = v
      }

      const fechaRaw = nr['fecha'] ?? ''
      if (!fechaRaw) continue

      const deposito = parseAmount(nr['deposito'] ?? '0')
      const retiro = parseAmount(nr['retiro'] ?? '0')
      const monto = deposito > 0 ? deposito : -retiro

      if (monto === 0) continue

      transactions.push({
        id: uuidv4(),
        sessionId,
        fecha: parseDate(fechaRaw),
        descripcion: nr['concepto'] ?? nr['descripcion'] ?? '',
        monto,
        referencia: nr['referencia'] || undefined,
        banco: this.banco,
        rawLine: Object.values(row).join(delimiter),
      })
    }

    return transactions
  }
}

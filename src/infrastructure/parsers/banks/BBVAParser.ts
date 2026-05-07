import { parse } from 'csv-parse/sync'
import { v4 as uuidv4 } from 'uuid'
import { InvalidCSVError } from '../../../domain/errors/DomainErrors.js'
import type { IBankParser } from '../../../domain/interfaces/IBankParser.js'
import type { TransaccionBancaria } from '../../../domain/entities/TransaccionBancaria.js'

type ParsedRow = Record<string, string>

const BBVA_HEADERS = ['fecha', 'descripcion', 'referencia', 'cargo', 'abono', 'saldo']

function parseAmount(val: string): number {
  if (!val || val.trim() === '' || val.trim() === '-') return 0
  const cleaned = val.replace(/[$,\s]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

function parseDate(val: string): Date {
  const trimmed = val.trim()
  // Try ISO format: 2026-04-15
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return new Date(trimmed)
  // Try DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy
    return new Date(`${y}-${m}-${d}`)
  }
  throw new InvalidCSVError(`Formato de fecha no reconocido: ${val}`)
}

export class BBVAParser implements IBankParser {
  readonly banco = 'BBVA'

  canParse(fileContent: Buffer): boolean {
    if (fileContent[0] === 0x25 && fileContent[1] === 0x50) return false // %PDF
    const firstLine = fileContent.toString('utf-8').split('\n')[0]?.toLowerCase() ?? ''
    return firstLine.includes('fecha') && (firstLine.includes('abono') || firstLine.includes('cargo'))
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
      throw new InvalidCSVError(`No se pudo parsear el CSV BBVA: ${String(err)}`)
    }

    if (rows.length === 0) throw new InvalidCSVError('CSV vacío o sin filas de datos')

    const firstRow = rows[0]
    if (!firstRow) throw new InvalidCSVError('CSV sin filas de datos')

    const keys = Object.keys(firstRow).map((k) => k.toLowerCase().trim())
    const hasRequiredCols = BBVA_HEADERS.slice(0, 2).every((h) => keys.some((k) => k.includes(h)))
    if (!hasRequiredCols) {
      throw new InvalidCSVError(`CSV no tiene columnas esperadas BBVA. Encontradas: ${keys.join(', ')}`)
    }

    const transactions: TransaccionBancaria[] = []
    for (const row of rows) {
      const normalizedRow: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[k.toLowerCase().trim()] = v
      }

      const fechaRaw = normalizedRow['fecha'] ?? ''
      if (!fechaRaw) continue

      const cargo = parseAmount(normalizedRow['cargo'] ?? '0')
      const abono = parseAmount(normalizedRow['abono'] ?? '0')
      const monto = abono > 0 ? abono : -cargo

      if (monto === 0) continue

      transactions.push({
        id: uuidv4(),
        sessionId,
        fecha: parseDate(fechaRaw),
        descripcion: normalizedRow['descripcion'] ?? '',
        monto,
        referencia: normalizedRow['referencia'] || undefined,
        banco: this.banco,
        rawLine: Object.values(row).join(delimiter),
      })
    }

    return transactions
  }
}

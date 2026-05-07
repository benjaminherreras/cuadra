import { createRequire } from 'module'
import { v4 as uuidv4 } from 'uuid'
import { InvalidCSVError } from '../../../domain/errors/DomainErrors.js'
import type { IBankParser } from '../../../domain/interfaces/IBankParser.js'
import type { TransaccionBancaria } from '../../../domain/entities/TransaccionBancaria.js'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>


export function isPDF(buf: Buffer): boolean {
  return buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 // %P
}

function toNumber(val: string): number {
  const n = parseFloat(val.replace(/[$,\s]/g, ''))
  return isNaN(n) ? 0 : n
}

/** Extract every amount value from a line, even if concatenated: "58,000.0058,443.00" → [58000, 58443] */
function extractAmounts(line: string): number[] {
  const matches = line.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g)
  return matches ? matches.map(toNumber) : []
}

/** True when the entire line is one or more concatenated monetary values (no words). */
function isAmountsOnlyLine(line: string): boolean {
  return /^\d{1,3}(?:,\d{3})*\.\d{2}(?:\d{1,3}(?:,\d{3})*\.\d{2})*$/.test(line)
}

function isAmountToken(token: string): boolean {
  return /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(token.trim())
}

const NEG_KEYWORDS =
  /\b(PAGO|RETIRO|CARGO|CARGOS?|COMISION|COMISIONES|SPEI\s+ENVIADO|CHEQUE\s+(?:GIRADO|PAGADO)|TRANSFERENCIA\s+A|DISPOSICION|COMPRA|LIQUIDACION)\b/i
const POS_KEYWORDS =
  /\b(DEPOSITO|DEPÓSITO|ABONO|COBRO|SPEI\s+RECIBIDO|TRANSFERENCIA\s+DE|INTERBANCARIA\s+RECIBIDA|NOMINA)\b/i

export abstract class BasePDFParser implements IBankParser {
  abstract readonly banco: string

  /** Strings to search in the first 3 KB of the PDF to identify the bank. */
  protected abstract readonly markers: string[]

  /**
   * Parse the date from the first token of a transaction line.
   * Return null if the token is not a valid date for this bank.
   */
  protected abstract parseDate(token: string): Date | null

  /**
   * Given the numeric tokens at the end of a line and the description,
   * return the signed transaction amount (positive = deposit, negative = withdrawal).
   * Override in subclasses that have deterministic column layouts (e.g. 3-col Banorte).
   * The default implementation uses balance-delta when prevBalance is known,
   * falling back to keyword matching.
   */
  protected calcMonto(
    amounts: number[],
    description: string,
    prevBalance: number | null,
  ): number {
    const balance = amounts[amounts.length - 1]!

    if (amounts.length >= 3) {
      const a = amounts[0]!
      const b = amounts[1]!
      if (a > 0 && b === 0) return -a
      if (b > 0 && a === 0) return b
      if (a > 0 && b > 0) return b - a
    }

    const txAmount = amounts[0]!

    if (prevBalance !== null) {
      const delta = balance - prevBalance
      return delta >= 0 ? Math.abs(txAmount) : -Math.abs(txAmount)
    }

    if (NEG_KEYWORDS.test(description)) return -txAmount
    if (POS_KEYWORDS.test(description)) return txAmount
    return txAmount
  }

  canParse(fileContent: Buffer): boolean {
    if (!isPDF(fileContent)) return false
    const sample = fileContent.subarray(0, 3000).toString('latin1').toUpperCase()
    return this.markers.some((m) => sample.includes(m.toUpperCase()))
  }

  async parse(fileContent: Buffer, sessionId: string): Promise<TransaccionBancaria[]> {
    let text: string
    // pdf.js has a cold-start race condition on the first call in a fresh process.
    // Retry with increasing delays to handle slow cold starts (e.g. Render free tier).
    const delays = [500, 1500]
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const result = await pdfParse(fileContent)
        text = result.text
        break
      } catch (err) {
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]))
          continue
        }
        throw new InvalidCSVError(`No se pudo leer el PDF ${this.banco}: ${String(err)}`)
      }
    }
    return this.parseLines(text!.split('\n'), sessionId)
  }

  protected parseLines(rawLines: string[], sessionId: string): TransaccionBancaria[] {
    const transactions: TransaccionBancaria[] = []
    let prevBalance: number | null = null

    // Multi-line state: buffer date + description fragments until an amounts line arrives
    let pendingDate: Date | null = null
    let pendingDescParts: string[] = []
    let awaitingSaldoAnterior = false

    const pushTx = (fecha: Date, descripcion: string, amounts: number[]) => {
      const upper = descripcion.toUpperCase()
      if (/SIN\s+MOVIMIENTOS|SALDO\s+(ANTERIOR|FINAL|INICIAL)|^TOTAL/.test(upper)) return
      const monto = this.calcMonto(amounts, descripcion, prevBalance)
      prevBalance = amounts[amounts.length - 1]!
      if (monto === 0) return
      transactions.push({
        id: uuidv4(),
        sessionId,
        fecha,
        descripcion,
        monto,
        referencia: undefined,
        banco: this.banco,
        rawLine: descripcion,
      })
    }

    const flushPending = (amountLine: string) => {
      if (!pendingDate) return
      const amounts = extractAmounts(amountLine)
      if (amounts.length >= 2) {
        const desc = pendingDescParts.join(' ').trim()
        if (desc) pushTx(pendingDate, desc, amounts)
      }
      pendingDate = null
      pendingDescParts = []
    }

    for (const line of rawLines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // ── SALDO ANTERIOR ───────────────────────────────────────────────────────
      if (/SALDO\s+ANTERIOR/i.test(trimmed)) {
        // Inline balance: "SALDO ANTERIOR 443.00" or "30-ABR-24 SALDO ANTERIOR 443.00"
        const inlineM = /SALDO\s+ANTERIOR\s+([\d,]+\.\d{2})/i.exec(trimmed)
        if (inlineM) {
          prevBalance = toNumber(inlineM[1]!)
        } else {
          // Balance is on the next line
          awaitingSaldoAnterior = true
        }
        pendingDate = null
        pendingDescParts = []
        continue
      }

      // ── Consume deferred SALDO ANTERIOR balance ──────────────────────────────
      if (awaitingSaldoAnterior) {
        const ams = extractAmounts(trimmed)
        if (ams.length > 0) prevBalance = ams[0]!
        awaitingSaldoAnterior = false
        continue
      }

      // ── Amounts-only line (possibly concatenated: "58,000.0058,443.00") ──────
      if (isAmountsOnlyLine(trimmed)) {
        if (pendingDate) {
          flushPending(trimmed)
        } else {
          // Stray amounts line — update prevBalance to last value
          const ams = extractAmounts(trimmed)
          if (ams.length > 0) prevBalance = ams[ams.length - 1]!
        }
        continue
      }

      // ── Normalize: insert space when date is glued to description ────────────
      const spaced = trimmed.replace(
        /^(\d{2}[-/][A-Z0-9]{2,3}[-/]\d{2,4})([A-ZÁÉÍÓÚÜÑ])/,
        '$1 $2',
      )
      const tokens = spaced.split(/\s+/).filter(Boolean)
      if (!tokens.length) continue

      const fecha = this.parseDate(tokens[0]!)

      if (fecha) {
        // Flush any previous pending transaction
        if (pendingDate) flushPending('')

        if (tokens.length === 1) {
          // Date-only line → start multi-line accumulation
          pendingDate = fecha
          pendingDescParts = []
          continue
        }

        const rest = tokens.slice(1)
        const upper = rest.join(' ').toUpperCase()
        if (/SIN\s+MOVIMIENTOS|SALDO\s+(ANTERIOR|FINAL|INICIAL)|^TOTAL/.test(upper)) continue

        // Collect trailing amount tokens (single-line format)
        const amounts: number[] = []
        let descEnd = rest.length
        for (let i = rest.length - 1; i >= 0; i--) {
          if (isAmountToken(rest[i]!)) {
            amounts.unshift(toNumber(rest[i]!))
            descEnd = i
          } else break
        }

        if (amounts.length >= 2) {
          // Full single-line transaction
          const descripcion = rest.slice(0, descEnd).join(' ').trim()
          if (descripcion) pushTx(fecha, descripcion, amounts)
        } else {
          // Date + partial description, amounts on later lines
          pendingDate = fecha
          pendingDescParts = [rest.join(' ')]
        }
        continue
      }

      // ── No date: accumulate description fragments ────────────────────────────
      if (pendingDate) {
        pendingDescParts.push(trimmed)
      }
    }

    return transactions
  }
}

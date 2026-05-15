import { v4 as uuidv4 } from 'uuid'
import { BasePDFParser } from '../pdf/BasePDFParser.js'
import type { TransaccionBancaria } from '../../../domain/entities/TransaccionBancaria.js'

const MONTH_MAP: Record<string, number> = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
}

// Full single-line transaction: "dd MMM[spaces]DESC[REF]$AMOUNT$SALDO"
// e.g. "26 AGOSWEB TRANSF.INTERB SPEI00000000000000260825$300.00$819.46"
// e.g. "27 AGO  SWEB PAGO TARJETA DE CREDITO00000000001340865897$437.49$381.97"
// Also handles amounts without $ and with spaces between them.
const TX_FULL = /^(\d{2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s*(.*?)\s*(\$?[\d,]+\.\d{2})\s*(\$?[\d,]+\.\d{2})\s*$/i

// Multi-line: date+desc but amounts arrive on a later line
// e.g. "22 SEPTRASPASOS A OTROS BANCOS"
const TX_PARTIAL = /^(\d{2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s*(.+)$/i

// Amounts-only continuation line: "$5.00$2,338.85" or "5.00 2,338.85"
const AMOUNTS_LINE = /^\s*\$?([\d,]+\.\d{2})\s*\$?([\d,]+\.\d{2})\s*$/

function toNum(s: string): number {
  return parseFloat(s.replace(/[$,]/g, '')) || 0
}

function cleanDesc(desc: string): string {
  // Strip long numeric reference strings (CLABE, SPEI refs, etc.)
  return desc.replace(/\d{10,}/g, '').replace(/\s+/g, ' ').trim()
}

export class ScotiabankPDFParser extends BasePDFParser {
  readonly banco = 'SCOTIABANK'
  protected readonly markers = ['SCOTIABANK', 'SCOTIABANK INVERLAT']

  protected parseDate(token: string): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(token)
    if (!m) return null
    return new Date(`${m[3]}-${m[2]}-${m[1]}`)
  }

  protected override parseLines(rawLines: string[], sessionId: string): TransaccionBancaria[] {
    const transactions: TransaccionBancaria[] = []
    const year = this.extractYear(rawLines)
    let prevBalance: number | null = this.extractInitialBalance(rawLines)

    let pendingDate: Date | null = null
    let pendingDesc = ''

    const makeDate = (day: string, mon: string): Date => {
      const month = MONTH_MAP[mon.toUpperCase()]!
      const d = parseInt(day, 10)
      return new Date(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }

    const pushTx = (fecha: Date, rawDesc: string, amount: number, saldo: number) => {
      if (amount === 0) return
      let monto: number
      if (prevBalance !== null) {
        const delta = saldo - prevBalance
        // |delta + amount| ≈ 0 → retiro; |delta - amount| ≈ 0 → depósito
        monto = Math.abs(delta + amount) < Math.abs(delta - amount) ? -amount : amount
      } else {
        monto = amount
      }
      prevBalance = saldo
      if (monto === 0) return
      transactions.push({
        id: uuidv4(),
        sessionId,
        fecha,
        descripcion: cleanDesc(rawDesc),
        monto,
        referencia: undefined,
        banco: this.banco,
        rawLine: rawDesc,
      })
    }

    for (const raw of rawLines) {
      const line = raw.trim()
      if (!line) continue

      // Full transaction on one line (most common case)
      const full = TX_FULL.exec(line)
      if (full) {
        pendingDate = null
        pendingDesc = ''
        pushTx(makeDate(full[1]!, full[2]!), full[3] ?? '', toNum(full[4]!), toNum(full[5]!))
        continue
      }

      // Amounts-only continuation line for a pending multi-line transaction
      const amts = AMOUNTS_LINE.exec(line)
      if (amts && pendingDate) {
        pushTx(pendingDate, pendingDesc, toNum(amts[1]!), toNum(amts[2]!))
        pendingDate = null
        pendingDesc = ''
        continue
      }

      // Partial transaction: date+desc, amounts will arrive on a later line
      const partial = TX_PARTIAL.exec(line)
      if (partial) {
        pendingDate = makeDate(partial[1]!, partial[2]!)
        pendingDesc = partial[3] ?? ''
        continue
      }

      // Continuation/reference lines — already have what we need from the first line
    }

    return transactions
  }

  private extractYear(lines: string[]): number {
    for (const line of lines) {
      // Matches "24-SEP-25" or "26-AGO-25/24-SEP-25"
      const m = /\d{2}-(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)-(\d{2,4})/i.exec(line)
      if (m) {
        const yr = parseInt(m[2]!, 10)
        return yr < 100 ? 2000 + yr : yr
      }
    }
    return new Date().getFullYear()
  }

  private extractInitialBalance(lines: string[]): number | null {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      if (!/Saldo\s*inicial/i.test(line)) continue
      // Inline: "Saldo inicial = $1,119.46   Saldo final= ..."
      const inline = /\$([\d,]+\.\d{2})/.exec(line)
      if (inline) return toNum('$' + inline[1])
      // Balance on the next line: "$1,119.46"
      for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
        const next = lines[j]!.trim()
        if (/^\$[\d,]+\.\d{2}$/.test(next)) return toNum(next)
      }
    }
    return null
  }
}

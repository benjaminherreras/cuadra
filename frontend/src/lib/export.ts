import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SessionDetail } from './api'

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n).replace('MX$', '$')
}
function fmtDate(s: string) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(s))
}
function getNotes(sessionId: string, itemId: string): string {
  return localStorage.getItem(`cuadra_note_${sessionId}_${itemId}`) ?? ''
}

// ─── Paleta de colores ────────────────────────────────────────────────────────
const C = {
  black:    'FF111111',
  dark:     'FF1C1C1C',
  signal:   'FFE63B2E',
  green:    'FF16A34A',
  yellow:   'FFCA8A04',
  offwhite: 'FFF5F3EE',
  paper:    'FFE8E4DD',
  white:    'FFFFFFFF',
  row_alt:  'FFF8F7F4',
  muted:    'FF6B7280',
  note_bg:  'FFFFFBEB',
  note_border: 'FFFBBF24',
  green_light: 'FFD1FAE5',
  red_light:   'FFFFE4E1',
  yellow_light:'FFFEF9C3',
}

type HAlign = 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed'
type VAlign = 'top' | 'middle' | 'bottom' | 'distributed' | 'justify'

function cell(
  ws: ExcelJS.Worksheet,
  col: number,
  row: number,
  value: ExcelJS.CellValue,
  opts: {
    bold?: boolean
    italic?: boolean
    size?: number
    color?: string
    bg?: string
    align?: HAlign
    valign?: VAlign
    numFmt?: string
    wrap?: boolean
    border?: boolean
    borderColor?: string
  } = {},
) {
  const c = ws.getCell(row, col)
  c.value = value
  c.font = {
    name: 'Calibri',
    bold: opts.bold,
    italic: opts.italic,
    size: opts.size ?? 10,
    color: { argb: opts.color ?? C.dark },
  }
  if (opts.bg) {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } }
  }
  c.alignment = {
    horizontal: opts.align ?? 'left',
    vertical: opts.valign ?? 'middle',
    wrapText: opts.wrap,
  }
  if (opts.numFmt) c.numFmt = opts.numFmt
  if (opts.border) {
    const bc = { style: 'thin' as const, color: { argb: opts.borderColor ?? 'FFD1D5DB' } }
    c.border = { top: bc, bottom: bc, left: bc, right: bc }
  }
}

function headerRow(
  ws: ExcelJS.Worksheet,
  row: number,
  cols: string[],
  bgColor: string,
  colStart = 1,
) {
  cols.forEach((label, i) => {
    const c = ws.getCell(row, colStart + i)
    c.value = label
    c.font = { name: 'Calibri', bold: true, size: 10, color: { argb: C.white } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    c.alignment = { horizontal: 'center', vertical: 'middle' }
    c.border = {
      bottom: { style: 'medium', color: { argb: bgColor } },
    }
  })
  ws.getRow(row).height = 22
}

function dataRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  values: (string | number)[],
  isAlt: boolean,
  colStart = 1,
  overrides: Record<number, Partial<ExcelJS.Style>> = {},
) {
  const bg = isAlt ? C.row_alt : C.white
  values.forEach((val, i) => {
    const c = ws.getCell(rowIdx, colStart + i)
    c.value = val
    c.font = { name: 'Calibri', size: 10, color: { argb: C.dark } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    c.alignment = { vertical: 'middle' }
    c.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }
    if (overrides[i]) Object.assign(c, overrides[i])
  })
  ws.getRow(rowIdx).height = 18
}

// ─── EXCEL ────────────────────────────────────────────────────────────────────

export async function exportExcel(session: SessionDetail) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CUADRA'
  wb.created = new Date()
  const sid = session.sessionId

  // ── Hoja 1: Resumen ────────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: C.black } } })
  ws1.columns = [
    { width: 4 }, { width: 30 }, { width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
  ]

  // Título
  ws1.mergeCells('B1:G1')
  const title = ws1.getCell('B1')
  title.value = 'CUADRA — Reporte de Conciliación'
  title.font = { name: 'Calibri', bold: true, size: 16, color: { argb: C.white } }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.black } }
  title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws1.getRow(1).height = 40

  // Subtítulo
  ws1.mergeCells('B2:G2')
  const sub = ws1.getCell('B2')
  sub.value = `${session.banco}  ·  ${fmtDate(session.processedAt)}`
  sub.font = { name: 'Calibri', size: 11, color: { argb: C.white } }
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } }
  sub.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws1.getRow(2).height = 26

  // Sesión ID
  ws1.mergeCells('B3:G3')
  const sesId = ws1.getCell('B3')
  sesId.value = `Sesión: ${sid}`
  sesId.font = { name: 'Calibri', size: 8, italic: true, color: { argb: C.muted } }
  sesId.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.paper } }
  sesId.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws1.getRow(3).height = 16

  ws1.getRow(4).height = 10 // separador

  // Tarjetas de métricas (fila 5 = labels, fila 6 = valores)
  const metrics = [
    { label: 'Match Rate', value: `${session.summary.matchRate}%`, col: 'B', bg: C.black, fg: session.summary.matchRate >= 90 ? C.green : session.summary.matchRate >= 75 ? C.yellow : C.signal },
    { label: 'Conciliados', value: session.matched.length, col: 'C', bg: C.green, fg: C.white },
    { label: 'Sin Conciliar', value: session.unmatchedBank.length + session.unmatchedCFDI.length, col: 'D', bg: C.signal, fg: C.white },
    { label: 'Transacciones Banco', value: session.totalTransacciones, col: 'E', bg: C.dark, fg: C.white },
    { label: 'CFDIs Cargados', value: session.totalRegistros, col: 'F', bg: C.dark, fg: C.white },
  ]

  metrics.forEach(({ label, value, col, bg, fg }) => {
    const lCell = ws1.getCell(`${col}5`)
    lCell.value = label.toUpperCase()
    lCell.font = { name: 'Calibri', bold: true, size: 8, color: { argb: C.white } }
    lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    lCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws1.getRow(5).height = 16

    const vCell = ws1.getCell(`${col}6`)
    vCell.value = value
    vCell.font = { name: 'Calibri', bold: true, size: 20, color: { argb: fg } }
    vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    vCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws1.getRow(6).height = 40
  })

  ws1.getRow(7).height = 10

  // Detalle financiero
  cell(ws1, 2, 8, 'DETALLE FINANCIERO', { bold: true, size: 9, color: C.muted, bg: C.offwhite })
  ws1.mergeCells('B8:G8')
  ws1.getRow(8).height = 18

  const finRows = [
    ['Monto total conciliado', session.summary.totalMontoConciliado],
    ['Monto sin conciliar', session.summary.totalMontoSinConciliar],
  ]
  finRows.forEach(([label, amount], i) => {
    const r = 9 + i
    const isAlt = i % 2 === 1
    ws1.mergeCells(`B${r}:D${r}`)
    const lc = ws1.getCell(`B${r}`)
    lc.value = label
    lc.font = { name: 'Calibri', size: 10, color: { argb: C.dark } }
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? C.row_alt : C.white } }
    lc.alignment = { vertical: 'middle', indent: 1 }

    ws1.mergeCells(`E${r}:G${r}`)
    const ac = ws1.getCell(`E${r}`)
    ac.value = amount as number
    ac.numFmt = '"$"#,##0.00'
    ac.font = { name: 'Calibri', bold: true, size: 12, color: { argb: i === 0 ? C.green : C.signal } }
    ac.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? C.row_alt : C.white } }
    ac.alignment = { horizontal: 'right', vertical: 'middle' }
    ws1.getRow(r).height = 26
  })

  // ── Hoja 2: Conciliados ────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet('✓ Conciliados', { properties: { tabColor: { argb: C.green } } })
  ws2.columns = [
    { width: 40 }, { width: 16 }, { width: 35 }, { width: 16 }, { width: 16 }, { width: 9 },
  ]
  ws2.views = [{ state: 'frozen', ySplit: 2 }]

  ws2.mergeCells('A1:F1')
  const h2 = ws2.getCell('A1')
  h2.value = `✓ Movimientos Conciliados — ${session.banco}  ·  ${fmtDate(session.processedAt)}`
  h2.font = { name: 'Calibri', bold: true, size: 12, color: { argb: C.white } }
  h2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.green } }
  h2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws2.getRow(1).height = 28

  headerRow(ws2, 2, ['Descripción Banco', 'Monto Banco', 'Emisor CFDI', 'Monto CFDI', 'Monto Esperado', 'Score'], C.dark)
  ws2.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 6 } }

  session.matched.forEach((m, i) => {
    const r = 3 + i
    const isAlt = i % 2 === 1
    const bg = isAlt ? C.row_alt : C.white
    const score = m.score

    const scoreBg = score >= 90 ? C.green_light : score >= 75 ? C.yellow_light : C.red_light
    const scoreFg = score >= 90 ? C.green : score >= 75 ? C.yellow : C.signal

    const vals: (string | number)[] = [
      m.bankDescripcion ?? '—',
      m.bankMonto ?? 0,
      m.cfdiEmisorNombre ?? '—',
      m.cfdiTotal ?? 0,
      m.cfdiMontoEsperado ?? 0,
      score,
    ]
    vals.forEach((val, ci) => {
      const c = ws2.getCell(r, ci + 1)
      c.value = val
      c.font = { name: 'Calibri', size: 10, color: { argb: ci === 5 ? scoreFg : C.dark }, bold: ci === 5 }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ci === 5 ? scoreBg : bg } }
      c.alignment = { vertical: 'middle', horizontal: ci >= 1 && ci <= 4 ? 'right' : ci === 5 ? 'center' : 'left' }
      c.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }
      if (ci >= 1 && ci <= 4) c.numFmt = '"$"#,##0.00'
    })
    ws2.getRow(r).height = 18
  })

  // Leyenda de Score
  const legendRow = 3 + session.matched.length + 1
  ws2.getRow(legendRow).height = 10 // separador

  const legendData = [
    { range: '90 – 100', label: 'Alta confianza',  bg: C.green_light,  fg: C.green  },
    { range: '75 – 89',  label: 'Media confianza', bg: C.yellow_light, fg: C.yellow },
    { range: '0 – 74',   label: 'Baja confianza',  bg: C.red_light,    fg: C.signal },
  ]
  const lr = legendRow + 1
  ws2.mergeCells(lr, 1, lr, 6)
  const legendTitle = ws2.getCell(lr, 1)
  legendTitle.value = 'CÓMO SE CALCULA EL SCORE'
  legendTitle.font = { name: 'Calibri', bold: true, size: 8, color: { argb: C.muted } }
  legendTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.offwhite } }
  legendTitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws2.getRow(lr).height = 16

  legendData.forEach(({ range, label, bg, fg }, i) => {
    const r = lr + 1 + i
    // Rango (col 1)
    const rc = ws2.getCell(r, 1)
    rc.value = range
    rc.font = { name: 'Calibri', bold: true, size: 10, color: { argb: fg } }
    rc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    rc.alignment = { horizontal: 'center', vertical: 'middle' }
    // Etiqueta (col 2-3)
    ws2.mergeCells(r, 2, r, 3)
    const lc = ws2.getCell(r, 2)
    lc.value = label
    lc.font = { name: 'Calibri', size: 10, color: { argb: C.dark } }
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.offwhite } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    ws2.getRow(r).height = 18
  })

  // Ponderación del score
  const pr = lr + 1 + legendData.length
  ws2.mergeCells(pr, 1, pr, 6)
  const pc = ws2.getCell(pr, 1)
  pc.value = 'Ponderación:  Monto 50%  ·  Descripción del movimiento 30%  ·  Fecha 20%'
  pc.font = { name: 'Calibri', italic: true, size: 9, color: { argb: C.muted } }
  pc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.offwhite } }
  pc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws2.getRow(pr).height = 18

  // ── Hoja 3: Sin Conciliar — Banco ─────────────────────────────────────────
  const bankItems = session.unmatchedBankDetail ?? []
  const ws3 = wb.addWorksheet('⚠ Sin Conciliar — Banco', { properties: { tabColor: { argb: C.signal } } })
  ws3.columns = [
    { width: 12 }, { width: 42 }, { width: 16 }, { width: 24 }, { width: 44 },
  ]
  ws3.views = [{ state: 'frozen', ySplit: 2 }]

  ws3.mergeCells('A1:E1')
  const h3 = ws3.getCell('A1')
  h3.value = `⚠ Movimientos Bancarios Sin Conciliar — ${session.banco}`
  h3.font = { name: 'Calibri', bold: true, size: 12, color: { argb: C.white } }
  h3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.signal } }
  h3.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws3.getRow(1).height = 28

  headerRow(ws3, 2, ['Fecha', 'Descripción', 'Monto', 'Referencia', '📝 Notas del Contador'], C.dark)
  ws3.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 5 } }

  // Columna de notas con fondo amarillo
  const noteHeaderCell = ws3.getCell(2, 5)
  noteHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }
  noteHeaderCell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: C.dark } }

  bankItems.forEach((item, i) => {
    const r = 3 + i
    const isAlt = i % 2 === 1
    const bg = isAlt ? C.row_alt : C.white
    const note = getNotes(sid, item.id)

    const vals: (string | number)[] = [item.fecha, item.descripcion, item.monto, item.referencia ?? '', note]
    vals.forEach((val, ci) => {
      const c = ws3.getCell(r, ci + 1)
      c.value = val
      c.font = { name: 'Calibri', size: 10, color: { argb: C.dark }, italic: ci === 4 }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ci === 4 ? C.note_bg : bg } }
      c.alignment = {
        vertical: 'middle',
        horizontal: ci === 2 ? 'right' : 'left',
        wrapText: ci === 4,
      }
      c.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        ...(ci === 4 ? { left: { style: 'thin', color: { argb: C.note_border } } } : {}),
      }
      if (ci === 2) c.numFmt = '"$"#,##0.00'
    })
    ws3.getRow(r).height = note && note.length > 40 ? 32 : 18
  })

  // ── Hoja 4: Sin Conciliar — CFDI ──────────────────────────────────────────
  const cfdiItems = session.unmatchedCFDIDetail ?? []
  const ws4 = wb.addWorksheet('⚠ Sin Conciliar — CFDI', { properties: { tabColor: { argb: C.yellow } } })
  ws4.columns = [
    { width: 12 }, { width: 38 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 38 },
  ]
  ws4.views = [{ state: 'frozen', ySplit: 2 }]

  ws4.mergeCells('A1:F1')
  const h4 = ws4.getCell('A1')
  h4.value = `⚠ CFDIs Sin Conciliar — ${session.banco}`
  h4.font = { name: 'Calibri', bold: true, size: 12, color: { argb: C.white } }
  h4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.yellow } }
  h4.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws4.getRow(1).height = 28

  headerRow(ws4, 2, ['Fecha', 'Emisor', 'RFC', 'Total CFDI', 'Monto Esperado', 'UUID'], C.dark)
  ws4.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 6 } }

  cfdiItems.forEach((item, i) => {
    const r = 3 + i
    const isAlt = i % 2 === 1
    const bg = isAlt ? C.row_alt : C.white
    const vals: (string | number)[] = [item.fecha, item.emisorNombre, item.emisorRfc, item.total, item.montoEsperado, item.uuid]
    vals.forEach((val, ci) => {
      const c = ws4.getCell(r, ci + 1)
      c.value = val
      c.font = { name: 'Calibri', size: 10, color: { argb: C.dark } }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      c.alignment = { vertical: 'middle', horizontal: ci >= 3 && ci <= 4 ? 'right' : 'left' }
      c.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }
      if (ci >= 3 && ci <= 4) c.numFmt = '"$"#,##0.00'
    })
    ws4.getRow(r).height = 18
  })

  // Guardar
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = `cuadra_${session.banco}_${fmtDate(session.processedAt).replace(/\//g, '-')}.xlsx`
  saveAs(blob, filename)
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function exportPDF(session: SessionDetail) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const sid = session.sessionId
  const pageW = doc.internal.pageSize.getWidth()

  const SIGNAL = [230, 59, 46] as [number, number, number]
  const DARK   = [17, 17, 17] as [number, number, number]
  const MID    = [100, 100, 100] as [number, number, number]

  const addHeader = (title: string) => {
    doc.setFillColor(...DARK)
    doc.rect(0, 0, pageW, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text('CUADRA', 10, 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 180, 180)
    doc.text(`${session.banco}  ·  ${fmtDate(session.processedAt)}  ·  ${title}`, 38, 11)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(7)
    doc.text(sid, pageW - 10, 11, { align: 'right' })
  }

  addHeader('Reporte de Conciliación')

  doc.setFillColor(...SIGNAL)
  doc.rect(0, 18, 3, 180, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...DARK)
  doc.text(session.banco, 12, 36)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...MID)
  doc.text(`Conciliación bancaria · ${fmtDate(session.processedAt)}`, 12, 44)

  const stats = [
    { label: 'Match Rate', value: `${session.summary.matchRate}%`, color: session.summary.matchRate >= 90 ? [22, 163, 74] : session.summary.matchRate >= 75 ? [202, 138, 4] : SIGNAL },
    { label: 'Conciliados', value: String(session.matched.length), color: DARK },
    { label: 'Sin Conciliar', value: String(session.unmatchedBank.length + session.unmatchedCFDI.length), color: DARK },
    { label: 'Total Conciliado', value: fmt(session.summary.totalMontoConciliado), color: DARK },
  ]

  stats.forEach((s, i) => {
    const x = 12 + i * 66
    doc.setFillColor(245, 243, 238)
    doc.roundedRect(x, 54, 62, 22, 3, 3, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MID)
    doc.text(s.label.toUpperCase(), x + 4, 61)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...(s.color as [number, number, number]))
    doc.text(s.value, x + 4, 70)
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('Movimientos Conciliados', 12, 88)

  if (session.matched.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text('Sin pares conciliados', 12, 96)
  } else {
    autoTable(doc, {
      startY: 91,
      head: [['Descripción Banco', 'Monto Banco', 'Emisor CFDI', 'Monto CFDI', 'Esp.', 'Score']],
      body: session.matched.map((m) => [
        m.bankDescripcion ?? '—',
        m.bankMonto != null ? fmt(m.bankMonto) : '—',
        m.cfdiEmisorNombre ?? '—',
        m.cfdiTotal != null ? fmt(m.cfdiTotal) : '—',
        m.cfdiMontoEsperado != null ? fmt(m.cfdiMontoEsperado) : '—',
        String(m.score),
      ]),
      styles: { fontSize: 7, font: 'helvetica', cellPadding: 2.5 },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      columnStyles: {
        0: { cellWidth: 70 }, 1: { cellWidth: 28, halign: 'right' },
        2: { cellWidth: 55 }, 3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 14, halign: 'center' },
      },
      margin: { left: 12, right: 12 },
    })
  }

  const bankItems = session.unmatchedBankDetail ?? []
  if (bankItems.length > 0) {
    doc.addPage()
    addHeader('Sin Conciliar — Banco')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    doc.text('Movimientos bancarios sin conciliar', 12, 28)
    autoTable(doc, {
      startY: 31,
      head: [['Fecha', 'Descripción', 'Monto', 'Referencia', 'Notas del contador']],
      body: bankItems.map((item) => [
        item.fecha, item.descripcion, fmt(item.monto), item.referencia ?? '', getNotes(sid, item.id),
      ]),
      styles: { fontSize: 7, font: 'helvetica', cellPadding: 2.5 },
      headStyles: { fillColor: SIGNAL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 80 }, 2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 35 }, 4: { cellWidth: 'auto' },
      },
      margin: { left: 12, right: 12 },
    })
  }

  const cfdiItems = session.unmatchedCFDIDetail ?? []
  if (cfdiItems.length > 0) {
    doc.addPage()
    addHeader('Sin Conciliar — CFDI')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    doc.text('CFDIs sin conciliar', 12, 28)
    autoTable(doc, {
      startY: 31,
      head: [['Fecha', 'Emisor', 'RFC', 'Total CFDI', 'Monto Esperado', 'UUID']],
      body: cfdiItems.map((item) => [
        item.fecha, item.emisorNombre, item.emisorRfc, fmt(item.total), fmt(item.montoEsperado), item.uuid,
      ]),
      styles: { fontSize: 7, font: 'helvetica', cellPadding: 2.5 },
      headStyles: { fillColor: [202, 138, 4], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 60 }, 2: { cellWidth: 28 },
        3: { cellWidth: 28, halign: 'right' }, 4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 'auto', fontSize: 6 },
      },
      margin: { left: 12, right: 12 },
    })
  }

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MID)
    doc.text(`Página ${i} de ${total}`, pageW - 10, doc.internal.pageSize.getHeight() - 5, { align: 'right' })
    doc.text('Generado por CUADRA', 10, doc.internal.pageSize.getHeight() - 5)
  }

  const filename = `cuadra_${session.banco}_${fmtDate(session.processedAt).replace(/\//g, '-')}.pdf`
  doc.save(filename)
}

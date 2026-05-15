import * as XLSX from 'xlsx'
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

// ─── EXCEL ────────────────────────────────────────────────────────────────────

export function exportExcel(session: SessionDetail) {
  const wb = XLSX.utils.book_new()
  const sid = session.sessionId

  // Hoja 1 — Resumen
  const resumen = [
    ['CUADRA — Reporte de Conciliación'],
    [],
    ['Banco', session.banco],
    ['Fecha de procesamiento', fmtDate(session.processedAt)],
    ['Sesión', sid],
    [],
    ['RESUMEN', ''],
    ['Total transacciones banco', session.totalTransacciones],
    ['Total CFDIs cargados', session.totalRegistros],
    ['Conciliados', session.matched.length],
    ['Sin conciliar', session.unmatchedBank.length + session.unmatchedCFDI.length],
    ['Match Rate', `${session.summary.matchRate}%`],
    ['Monto total conciliado', fmt(session.summary.totalMontoConciliado)],
    ['Monto sin conciliar', fmt(session.summary.totalMontoSinConciliar)],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen)
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // Hoja 2 — Conciliados
  const concRows = [
    ['Descripción Banco', 'Fecha', 'Monto Banco', 'Emisor CFDI', 'RFC', 'Monto CFDI', 'Monto Esperado', 'Score'],
    ...session.matched.map((m) => [
      m.bankDescripcion ?? '',
      '',
      m.bankMonto ?? '',
      m.cfdiEmisorNombre ?? '',
      '',
      m.cfdiTotal ?? '',
      m.cfdiMontoEsperado ?? '',
      m.score,
    ]),
  ]
  const wsCon = XLSX.utils.aoa_to_sheet(concRows)
  wsCon['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsCon, 'Conciliados')

  // Hoja 3 — Sin Conciliar Banco
  const bankItems = session.unmatchedBankDetail ?? []
  const bankRows = [
    ['Fecha', 'Descripción', 'Monto', 'Referencia', 'Notas del contador'],
    ...bankItems.map((item) => [
      item.fecha,
      item.descripcion,
      item.monto,
      item.referencia ?? '',
      getNotes(sid, item.id),
    ]),
  ]
  const wsBank = XLSX.utils.aoa_to_sheet(bankRows)
  wsBank['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsBank, 'Sin Conciliar — Banco')

  // Hoja 4 — Sin Conciliar CFDI
  const cfdiItems = session.unmatchedCFDIDetail ?? []
  const cfdiRows = [
    ['Fecha', 'Emisor', 'RFC', 'Total CFDI', 'Monto Esperado', 'UUID'],
    ...cfdiItems.map((item) => [
      item.fecha,
      item.emisorNombre,
      item.emisorRfc,
      item.total,
      item.montoEsperado,
      item.uuid,
    ]),
  ]
  const wsCFDI = XLSX.utils.aoa_to_sheet(cfdiRows)
  wsCFDI['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 38 }]
  XLSX.utils.book_append_sheet(wb, wsCFDI, 'Sin Conciliar — CFDI')

  const filename = `cuadra_${session.banco}_${fmtDate(session.processedAt).replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, filename)
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

  // ── Página 1: Portada + Resumen ──────────────────────────────────────────
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

  // Tarjetas de resumen
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

  // ── Página 1 cont.: Tabla conciliados ───────────────────────────────────
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
        0: { cellWidth: 70 },
        1: { cellWidth: 28, halign: 'right' },
        2: { cellWidth: 55 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 14, halign: 'center' },
      },
      margin: { left: 12, right: 12 },
    })
  }

  // ── Página 2: Sin conciliar banco ────────────────────────────────────────
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
        item.fecha,
        item.descripcion,
        fmt(item.monto),
        item.referencia ?? '',
        getNotes(sid, item.id),
      ]),
      styles: { fontSize: 7, font: 'helvetica', cellPadding: 2.5 },
      headStyles: { fillColor: SIGNAL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 80 },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 35 },
        4: { cellWidth: 'auto' },
      },
      margin: { left: 12, right: 12 },
    })
  }

  // ── Página 3: Sin conciliar CFDIs ────────────────────────────────────────
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
        item.fecha,
        item.emisorNombre,
        item.emisorRfc,
        fmt(item.total),
        fmt(item.montoEsperado),
        item.uuid,
      ]),
      styles: { fontSize: 7, font: 'helvetica', cellPadding: 2.5 },
      headStyles: { fillColor: [202, 138, 4], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 60 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 'auto', fontSize: 6 },
      },
      margin: { left: 12, right: 12 },
    })
  }

  // Numeración de páginas
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MID)
    doc.text(`Página ${i} de ${total}`, pageW - 10, doc.internal.pageSize.getHeight() - 5, { align: 'right' })
    doc.text('Generado por CUADRA · cuadra.app', 10, doc.internal.pageSize.getHeight() - 5)
  }

  const filename = `cuadra_${session.banco}_${fmtDate(session.processedAt).replace(/\//g, '-')}.pdf`
  doc.save(filename)
}

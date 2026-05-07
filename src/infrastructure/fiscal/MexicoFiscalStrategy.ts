import type { IFiscalStrategy } from '../../domain/interfaces/IFiscalStrategy.js'
import type { Factura } from '../../domain/entities/Factura.js'

export class MexicoFiscalStrategy implements IFiscalStrategy {
  readonly country = 'MX'

  calcularMontoEsperado(factura: Factura): number {
    let ivaRetenido = 0
    let isrRetenido = 0

    for (const concepto of factura.conceptos) {
      for (const ret of concepto.impuestos?.retenciones ?? []) {
        if (ret.impuesto === '002') ivaRetenido += ret.importe
        if (ret.impuesto === '001') isrRetenido += ret.importe
      }
    }

    const montoEsperado = factura.total - ivaRetenido - isrRetenido
    return Math.round(montoEsperado * 100) / 100
  }
}

import type { Factura } from '../entities/Factura.js'

export interface IFiscalStrategy {
  readonly country: string
  calcularMontoEsperado(factura: Factura): number
}

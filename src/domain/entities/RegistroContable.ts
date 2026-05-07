export interface RegistroContable {
  id: string
  sessionId: string
  uuid: string
  fecha: Date
  emisorRfc: string
  emisorNombre: string
  receptorRfc: string
  subtotal: number
  ivaTraslado: number
  ivaRetenido: number
  isrRetenido: number
  total: number
  montoEsperadoDeposito: number
  tipoDeComprobante: string
}

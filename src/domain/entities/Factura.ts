import type { Concepto } from './Concepto.js'

export interface Emisor {
  rfc: string
  nombre: string
  regimenFiscal: string
}

export interface Receptor {
  rfc: string
  nombre: string
  domicilioFiscalReceptor: string
  regimenFiscalReceptor: string
  usoCFDI: string
}

export interface Timbrado {
  uuid: string
  fechaTimbrado: string
  rfcProvCertif: string
  version: string
}

export interface ImpuestosGlobales {
  totalImpuestosTrasladados?: number
  totalImpuestosRetenidos?: number
}

export interface Factura {
  version: string
  serie?: string
  folio?: string
  fecha: string
  sello: string
  formaPago?: string
  noCertificado: string
  certificado: string
  subTotal: number
  descuento?: number
  moneda: string
  tipoCambio?: number
  total: number
  tipoDeComprobante: string
  exportacion: string
  metodoPago?: string
  lugarExpedicion: string
  emisor: Emisor
  receptor: Receptor
  conceptos: Concepto[]
  impuestos?: ImpuestosGlobales
  timbrado: Timbrado
}

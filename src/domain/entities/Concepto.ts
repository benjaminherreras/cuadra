export interface ImpuestoTraslado {
  base: number
  impuesto: string
  tipoFactor: string
  tasaOCuota: number
  importe: number
}

export interface ImpuestoRetencion {
  base: number
  impuesto: string
  tipoFactor: string
  tasaOCuota: number
  importe: number
}

export interface ConceptoImpuestos {
  traslados: ImpuestoTraslado[]
  retenciones: ImpuestoRetencion[]
}

export interface Concepto {
  claveProdServ: string
  noIdentificacion?: string
  cantidad: number
  claveUnidad: string
  unidad?: string
  descripcion: string
  valorUnitario: number
  importe: number
  descuento?: number
  objetoImp: string
  impuestos?: ConceptoImpuestos
}

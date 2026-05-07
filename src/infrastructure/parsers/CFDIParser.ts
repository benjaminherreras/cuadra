import { XMLParser } from 'fast-xml-parser'
import { v4 as uuidv4 } from 'uuid'
import { InvalidXMLError } from '../../domain/errors/DomainErrors.js'
import type { Factura, Emisor, Receptor, Timbrado, ImpuestosGlobales } from '../../domain/entities/Factura.js'
import type { Concepto, ImpuestoTraslado, ImpuestoRetencion, ConceptoImpuestos } from '../../domain/entities/Concepto.js'
import type { RegistroContable } from '../../domain/entities/RegistroContable.js'
import type { IFiscalStrategy } from '../../domain/interfaces/IFiscalStrategy.js'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  removeNSPrefix: false,
  isArray: (name) => ['cfdi:Concepto', 'cfdi:Traslado', 'cfdi:Retencion'].includes(name),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attr(obj: Record<string, any>, key: string): string {
  const val = obj[`@_${key}`]
  return val !== undefined ? String(val) : ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attrNum(obj: Record<string, any>, key: string): number {
  const val = obj[`@_${key}`]
  if (val === undefined || val === '') return 0
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTraslados(trasladosNode: any): ImpuestoTraslado[] {
  if (!trasladosNode?.['cfdi:Traslado']) return []
  const items = trasladosNode['cfdi:Traslado']
  const arr = Array.isArray(items) ? items : [items]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arr.map((t: any) => ({
    base: attrNum(t, 'Base'),
    impuesto: attr(t, 'Impuesto'),
    tipoFactor: attr(t, 'TipoFactor'),
    tasaOCuota: attrNum(t, 'TasaOCuota'),
    importe: attrNum(t, 'Importe'),
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRetenciones(retencionesNode: any): ImpuestoRetencion[] {
  if (!retencionesNode?.['cfdi:Retencion']) return []
  const items = retencionesNode['cfdi:Retencion']
  const arr = Array.isArray(items) ? items : [items]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arr.map((r: any) => ({
    base: attrNum(r, 'Base'),
    impuesto: attr(r, 'Impuesto'),
    tipoFactor: attr(r, 'TipoFactor'),
    tasaOCuota: attrNum(r, 'TasaOCuota'),
    importe: attrNum(r, 'Importe'),
  }))
}

export function parseCFDIToFactura(xmlString: string): Factura {
  let parsed: Record<string, unknown>
  try {
    parsed = xmlParser.parse(xmlString) as Record<string, unknown>
  } catch {
    throw new InvalidXMLError('No se pudo parsear el XML')
  }

  const comprobante = parsed['cfdi:Comprobante'] as Record<string, unknown> | undefined
  if (!comprobante) throw new InvalidXMLError('No se encontró cfdi:Comprobante en el XML')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = comprobante as Record<string, any>
  const version = attr(c, 'Version')
  if (version !== '4.0') throw new InvalidXMLError(`Versión ${version} no soportada, se requiere CFDI 4.0`)

  const emisorNode = c['cfdi:Emisor']
  if (!emisorNode) throw new InvalidXMLError('Falta cfdi:Emisor')
  const receptorNode = c['cfdi:Receptor']
  if (!receptorNode) throw new InvalidXMLError('Falta cfdi:Receptor')
  const conceptosNode = c['cfdi:Conceptos']
  if (!conceptosNode) throw new InvalidXMLError('Falta cfdi:Conceptos')
  const complementoNode = c['cfdi:Complemento']
  if (!complementoNode) throw new InvalidXMLError('Falta cfdi:Complemento')
  const tfdNode = complementoNode['tfd:TimbreFiscalDigital']
  if (!tfdNode) throw new InvalidXMLError('Falta tfd:TimbreFiscalDigital')

  const uuid = attr(tfdNode, 'UUID')
  if (!uuid) throw new InvalidXMLError('UUID vacío en TimbreFiscalDigital')

  const emisor: Emisor = {
    rfc: attr(emisorNode, 'Rfc'),
    nombre: attr(emisorNode, 'Nombre'),
    regimenFiscal: attr(emisorNode, 'RegimenFiscal'),
  }

  const receptor: Receptor = {
    rfc: attr(receptorNode, 'Rfc'),
    nombre: attr(receptorNode, 'Nombre'),
    domicilioFiscalReceptor: attr(receptorNode, 'DomicilioFiscalReceptor'),
    regimenFiscalReceptor: attr(receptorNode, 'RegimenFiscalReceptor'),
    usoCFDI: attr(receptorNode, 'UsoCFDI'),
  }

  const timbrado: Timbrado = {
    uuid,
    fechaTimbrado: attr(tfdNode, 'FechaTimbrado'),
    rfcProvCertif: attr(tfdNode, 'RfcProvCertif'),
    version: attr(tfdNode, 'Version'),
  }

  const rawConceptos = conceptosNode['cfdi:Concepto']
  const conceptosArr = Array.isArray(rawConceptos) ? rawConceptos : rawConceptos ? [rawConceptos] : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conceptos: Concepto[] = conceptosArr.map((con: any) => {
    let impuestos: ConceptoImpuestos | undefined
    const impNode = con['cfdi:Impuestos']
    if (impNode) {
      impuestos = {
        traslados: parseTraslados(impNode['cfdi:Traslados']),
        retenciones: parseRetenciones(impNode['cfdi:Retenciones']),
      }
    }
    return {
      claveProdServ: attr(con, 'ClaveProdServ'),
      noIdentificacion: attr(con, 'NoIdentificacion') || undefined,
      cantidad: attrNum(con, 'Cantidad'),
      claveUnidad: attr(con, 'ClaveUnidad'),
      unidad: attr(con, 'Unidad') || undefined,
      descripcion: attr(con, 'Descripcion'),
      valorUnitario: attrNum(con, 'ValorUnitario'),
      importe: attrNum(con, 'Importe'),
      descuento: attrNum(con, 'Descuento') || undefined,
      objetoImp: attr(con, 'ObjetoImp'),
      impuestos,
    }
  })

  let impuestosGlobales: ImpuestosGlobales | undefined
  const impGlobNode = c['cfdi:Impuestos']
  if (impGlobNode) {
    impuestosGlobales = {
      totalImpuestosTrasladados: attrNum(impGlobNode, 'TotalImpuestosTrasladados') || undefined,
      totalImpuestosRetenidos: attrNum(impGlobNode, 'TotalImpuestosRetenidos') || undefined,
    }
  }

  return {
    version,
    serie: attr(c, 'Serie') || undefined,
    folio: attr(c, 'Folio') || undefined,
    fecha: attr(c, 'Fecha'),
    sello: attr(c, 'Sello'),
    formaPago: attr(c, 'FormaPago') || undefined,
    noCertificado: attr(c, 'NoCertificado'),
    certificado: attr(c, 'Certificado'),
    subTotal: attrNum(c, 'SubTotal'),
    descuento: attrNum(c, 'Descuento') || undefined,
    moneda: attr(c, 'Moneda'),
    tipoCambio: attrNum(c, 'TipoCambio') || undefined,
    total: attrNum(c, 'Total'),
    tipoDeComprobante: attr(c, 'TipoDeComprobante'),
    exportacion: attr(c, 'Exportacion'),
    metodoPago: attr(c, 'MetodoPago') || undefined,
    lugarExpedicion: attr(c, 'LugarExpedicion'),
    emisor,
    receptor,
    conceptos,
    impuestos: impuestosGlobales,
    timbrado,
  }
}

export function parseCFDIToRegistro(
  xmlString: string,
  sessionId: string,
  fiscalStrategy: IFiscalStrategy,
): RegistroContable {
  const factura = parseCFDIToFactura(xmlString)

  let ivaTraslado = 0
  let ivaRetenido = 0
  let isrRetenido = 0

  for (const concepto of factura.conceptos) {
    for (const tras of concepto.impuestos?.traslados ?? []) {
      if (tras.impuesto === '002') ivaTraslado += tras.importe
    }
    for (const ret of concepto.impuestos?.retenciones ?? []) {
      if (ret.impuesto === '002') ivaRetenido += ret.importe
      if (ret.impuesto === '001') isrRetenido += ret.importe
    }
  }

  return {
    id: uuidv4(),
    sessionId,
    uuid: factura.timbrado.uuid,
    fecha: new Date(factura.fecha),
    emisorRfc: factura.emisor.rfc,
    emisorNombre: factura.emisor.nombre,
    receptorRfc: factura.receptor.rfc,
    subtotal: factura.subTotal,
    ivaTraslado: Math.round(ivaTraslado * 100) / 100,
    ivaRetenido: Math.round(ivaRetenido * 100) / 100,
    isrRetenido: Math.round(isrRetenido * 100) / 100,
    total: factura.total,
    montoEsperadoDeposito: fiscalStrategy.calcularMontoEsperado(factura),
    tipoDeComprobante: factura.tipoDeComprobante,
  }
}

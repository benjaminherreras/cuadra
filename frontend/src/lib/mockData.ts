// Mock data layer — real API integration pending (GET /sessions from http://localhost:3001)
// Replace with actual fetch calls once the backend endpoint is live.

export interface MatchedPair {
  id: string
  bankDescription: string
  cfdiEmisor: string
  bankAmount: number
  cfdiAmount: number
  score: number
}

export interface UnmatchedBank {
  id: string
  description: string
  date: string
  amount: number
  reference: string
}

export interface UnmatchedCFDI {
  id: string
  emisor: string
  uuid: string
  amount: number
  fecha: string
}

export interface Session {
  id: string
  banco: string
  fecha: string
  transactions: number
  cfdis: number
  matchRate: number
  totalAmount: number
  matched: MatchedPair[]
  unmatchedBank: UnmatchedBank[]
  unmatchedCFDIs: UnmatchedCFDI[]
}

export const mockSessions: Session[] = [
  {
    id: 'ses_7gHk2mN4pQ',
    banco: 'BBVA',
    fecha: '2026-04-30',
    transactions: 142,
    cfdis: 138,
    matchRate: 97,
    totalAmount: 1_847_320.50,
    matched: [
      {
        id: 'm1',
        bankDescription: 'SPEI RECIBIDO AMAZON MX',
        cfdiEmisor: 'Amazon Mexico Services',
        bankAmount: 45_600.00,
        cfdiAmount: 45_600.00,
        score: 99,
      },
      {
        id: 'm2',
        bankDescription: 'TRANSFERENCIA NÓMINA',
        cfdiEmisor: 'Recursos Humanos SA de CV',
        bankAmount: 128_450.00,
        cfdiAmount: 128_450.00,
        score: 100,
      },
      {
        id: 'm3',
        bankDescription: 'CARGO SERVICIOS CLOUD',
        cfdiEmisor: 'Google Cloud México',
        bankAmount: 9_533.33,
        cfdiAmount: 9_533.33,
        score: 98,
      },
      {
        id: 'm4',
        bankDescription: 'PAGO PROVEEDOR ELECTRÓNICO',
        cfdiEmisor: 'Distribuidora Tech SA',
        bankAmount: 23_870.00,
        cfdiAmount: 23_870.00,
        score: 95,
      },
      {
        id: 'm5',
        bankDescription: 'DEPOSITO CLIENTE A',
        cfdiEmisor: 'Manufactura del Norte SA',
        bankAmount: 87_000.00,
        cfdiAmount: 86_999.99,
        score: 87,
      },
    ],
    unmatchedBank: [
      {
        id: 'ub1',
        description: 'CARGO NO IDENTIFICADO',
        date: '2026-04-15',
        amount: 3_420.00,
        reference: 'REF-8821-X',
      },
      {
        id: 'ub2',
        description: 'COMISION BANCARIA',
        date: '2026-04-30',
        amount: 285.00,
        reference: 'COM-2604',
      },
    ],
    unmatchedCFDIs: [
      {
        id: 'uc1',
        emisor: 'Servicios Logísticos SA',
        uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount: 15_600.00,
        fecha: '2026-04-22',
      },
    ],
  },
  {
    id: 'ses_3xRt9vL1wA',
    banco: 'Banorte',
    fecha: '2026-04-28',
    transactions: 89,
    cfdis: 94,
    matchRate: 88,
    totalAmount: 634_910.00,
    matched: [
      {
        id: 'm1',
        bankDescription: 'ABONO CLIENTE NORTE',
        cfdiEmisor: 'Industrias del Norte SA',
        bankAmount: 210_000.00,
        cfdiAmount: 210_000.00,
        score: 100,
      },
      {
        id: 'm2',
        bankDescription: 'PAGO HONORARIOS',
        cfdiEmisor: 'Consultoría Fiscal SA',
        bankAmount: 35_000.00,
        cfdiAmount: 35_000.00,
        score: 96,
      },
      {
        id: 'm3',
        bankDescription: 'SPEI PROVEEDOR MATERIALES',
        cfdiEmisor: 'Materiales Industriales SA',
        bankAmount: 67_800.00,
        cfdiAmount: 67_800.00,
        score: 91,
      },
    ],
    unmatchedBank: [
      {
        id: 'ub1',
        description: 'RETIRO VENTANILLA',
        date: '2026-04-10',
        amount: 50_000.00,
        reference: 'VEN-100',
      },
      {
        id: 'ub2',
        description: 'PAGO DIFERIDO',
        date: '2026-04-18',
        amount: 12_500.00,
        reference: 'DIF-4412',
      },
      {
        id: 'ub3',
        description: 'CARGO SEGURO EMPRESARIAL',
        date: '2026-04-28',
        amount: 8_750.00,
        reference: 'SEG-0042',
      },
    ],
    unmatchedCFDIs: [
      {
        id: 'uc1',
        emisor: 'Aseguradora Nacional SA',
        uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 8_750.00,
        fecha: '2026-04-25',
      },
      {
        id: 'uc2',
        emisor: 'Renta de Oficinas SA',
        uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        amount: 25_000.00,
        fecha: '2026-04-01',
      },
    ],
  },
  {
    id: 'ses_8pKm5nJ7eB',
    banco: 'Santander',
    fecha: '2026-04-25',
    transactions: 56,
    cfdis: 52,
    matchRate: 94,
    totalAmount: 298_450.75,
    matched: [
      {
        id: 'm1',
        bankDescription: 'DEPOSITO EFECTIVO',
        cfdiEmisor: 'Ventas Directas SA',
        bankAmount: 120_000.00,
        cfdiAmount: 120_000.00,
        score: 93,
      },
      {
        id: 'm2',
        bankDescription: 'TRANSFERENCIA RECIBIDA',
        cfdiEmisor: 'Cliente Premium SA',
        bankAmount: 78_450.75,
        cfdiAmount: 78_450.75,
        score: 99,
      },
    ],
    unmatchedBank: [
      {
        id: 'ub1',
        description: 'CARGO MANTENIMIENTO',
        date: '2026-04-20',
        amount: 1_200.00,
        reference: 'MNT-2026',
      },
    ],
    unmatchedCFDIs: [
      {
        id: 'uc1',
        emisor: 'Telecomunicaciones MX',
        uuid: 'd4e5f6a7-b8c9-0123-defa-234567890123',
        amount: 4_500.00,
        fecha: '2026-04-18',
      },
    ],
  },
  {
    id: 'ses_2cFw6hG8qD',
    banco: 'HSBC',
    fecha: '2026-04-20',
    transactions: 31,
    cfdis: 29,
    matchRate: 81,
    totalAmount: 156_230.00,
    matched: [
      {
        id: 'm1',
        bankDescription: 'PAGO INTERNACIONAL',
        cfdiEmisor: 'Importaciones SA',
        bankAmount: 95_000.00,
        cfdiAmount: 95_000.00,
        score: 88,
      },
    ],
    unmatchedBank: [
      {
        id: 'ub1',
        description: 'DIFERENCIA TIPO CAMBIO',
        date: '2026-04-15',
        amount: 2_340.00,
        reference: 'TC-USD-04',
      },
      {
        id: 'ub2',
        description: 'CARGO NO AUTORIZADO',
        date: '2026-04-19',
        amount: 890.00,
        reference: 'ERR-0091',
      },
    ],
    unmatchedCFDIs: [
      {
        id: 'uc1',
        emisor: 'Proveedor Global SA',
        uuid: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        amount: 28_000.00,
        fecha: '2026-04-12',
      },
      {
        id: 'uc2',
        emisor: 'Servicios Aduaneros SA',
        uuid: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
        amount: 14_500.00,
        fecha: '2026-04-17',
      },
    ],
  },
  {
    id: 'ses_5dQn4kH2rE',
    banco: 'BBVA',
    fecha: '2026-03-31',
    transactions: 198,
    cfdis: 201,
    matchRate: 96,
    totalAmount: 2_341_800.00,
    matched: [
      {
        id: 'm1',
        bankDescription: 'DEPOSITO NÓMINA MASIVO',
        cfdiEmisor: 'RRHH Corporativo SA',
        bankAmount: 450_000.00,
        cfdiAmount: 450_000.00,
        score: 100,
      },
      {
        id: 'm2',
        bankDescription: 'SPEI PROVEEDOR PRINCIPAL',
        cfdiEmisor: 'Proveedora Nacional SA',
        bankAmount: 280_000.00,
        cfdiAmount: 280_000.00,
        score: 99,
      },
      {
        id: 'm3',
        bankDescription: 'PAGO RENTA CORPORATIVO',
        cfdiEmisor: 'Inmobiliaria Empresarial SA',
        bankAmount: 85_000.00,
        cfdiAmount: 85_000.00,
        score: 97,
      },
    ],
    unmatchedBank: [
      {
        id: 'ub1',
        description: 'AJUSTE CONTABLE',
        date: '2026-03-31',
        amount: 5_600.00,
        reference: 'ADJ-MRZ',
      },
    ],
    unmatchedCFDIs: [
      {
        id: 'uc1',
        emisor: 'Asesoría Legal SA',
        uuid: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
        amount: 45_000.00,
        fecha: '2026-03-28',
      },
      {
        id: 'uc2',
        emisor: 'Publicidad Digital SA',
        uuid: 'b8c9d0e1-f2a3-4567-bcde-678901234567',
        amount: 18_900.00,
        fecha: '2026-03-25',
      },
    ],
  },
]

export function getSessionById(id: string): Session | undefined {
  return mockSessions.find((s) => s.id === id)
}

export function getAggregateStats() {
  const totalSessions = mockSessions.length
  const avgMatchRate = Math.round(
    mockSessions.reduce((sum, s) => sum + s.matchRate, 0) / totalSessions
  )
  const totalAmount = mockSessions.reduce((sum, s) => sum + s.totalAmount, 0)
  const lastSession = mockSessions.reduce((latest, s) =>
    s.fecha > latest.fecha ? s : latest
  )
  return { totalSessions, avgMatchRate, totalAmount, lastSession }
}

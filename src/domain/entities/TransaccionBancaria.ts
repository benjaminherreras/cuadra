export interface TransaccionBancaria {
  id: string
  sessionId: string
  fecha: Date
  descripcion: string
  monto: number
  referencia?: string
  banco: string
  rawLine: string
}

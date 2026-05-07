export type ErrorCode =
  | 'E1_INVALID_XML'
  | 'E2_INVALID_CSV'
  | 'E3_BANCO_NO_SOPORTADO'
  | 'E4_SESSION_NOT_FOUND'
  | 'E5_MATCH_NOT_FOUND'
  | 'E6_INTERNAL'

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly httpStatus: number = 400,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class InvalidXMLError extends DomainError {
  constructor(detail?: string) {
    super('E1_INVALID_XML', `XML no es CFDI 4.0 válido${detail ? ': ' + detail : ''}`, 400)
    this.name = 'InvalidXMLError'
  }
}

export class InvalidCSVError extends DomainError {
  constructor(detail?: string) {
    super('E2_INVALID_CSV', `CSV bancario inválido${detail ? ': ' + detail : ''}`, 400)
    this.name = 'InvalidCSVError'
  }
}

export class BancoNoSoportadoError extends DomainError {
  constructor(banco: string) {
    super('E3_BANCO_NO_SOPORTADO', `Banco no soportado: ${banco}`, 400)
    this.name = 'BancoNoSoportadoError'
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super('E4_SESSION_NOT_FOUND', `Sesión no encontrada: ${sessionId}`, 404)
    this.name = 'SessionNotFoundError'
  }
}

export class MatchNotFoundError extends DomainError {
  constructor(detail?: string) {
    super('E5_MATCH_NOT_FOUND', `Match no encontrado${detail ? ': ' + detail : ''}`, 404)
    this.name = 'MatchNotFoundError'
  }
}

export class RiflyApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "RiflyApiError";
    this.status = status;
    this.details = details;
  }
}

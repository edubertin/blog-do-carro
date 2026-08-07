export class AdminExpectedError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 422 | 503) {
    super(message);
    this.name = "AdminExpectedError";
  }
}

export function invalidInput(message: string): AdminExpectedError {
  return new AdminExpectedError(message, 422);
}

export function missingResource(message: string): AdminExpectedError {
  return new AdminExpectedError(message, 404);
}

export function conflictingResource(message: string): AdminExpectedError {
  return new AdminExpectedError(message, 409);
}

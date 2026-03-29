export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('CAPABILITY_NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ModelError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super('MODEL_ERROR', message, 502, details);
    this.name = 'ModelError';
  }
}

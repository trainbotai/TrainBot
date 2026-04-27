export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly title: string,
    public readonly detail?: string,
  ) {
    super(title);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(detail: string, public readonly fields?: Record<string, string[]>) {
    super(400, 'validation_error', 'Validation failed', detail);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail = 'Authentication required') {
    super(401, 'unauthorized', 'Unauthorized', detail);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = 'You are not allowed to do this') {
    super(403, 'forbidden', 'Forbidden', detail);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'not_found', 'Not found', `Resource '${resource}' not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(detail: string) {
    super(409, 'conflict', 'Conflict', detail);
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(detail = 'Rate limit exceeded') {
    super(429, 'too_many_requests', 'Too many requests', detail);
    this.name = 'TooManyRequestsError';
  }
}

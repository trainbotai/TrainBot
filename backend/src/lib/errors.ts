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

export class BadRequestError extends AppError {
  constructor(detail: string) {
    super(400, 'bad_request', 'Bad request', detail);
    this.name = 'BadRequestError';
  }
}

export class LLMQuotaExceededError extends AppError {
  constructor(limit: number) {
    super(
      429,
      'llm/quota_exceeded',
      'Quota exceeded',
      `Ai folosit toate ${limit} de mesaje pe azi. Revino mâine.`,
    );
    this.name = 'LLMQuotaExceededError';
  }
}

export class LLMContentBlockedInputError extends AppError {
  constructor(reason?: string) {
    super(
      400,
      'llm/content_blocked_input',
      'Content blocked',
      reason ?? 'Întrebarea conține cuvinte care nu sunt potrivite. Reformulează.',
    );
    this.name = 'LLMContentBlockedInputError';
  }
}

export class LLMContentBlockedOutputError extends AppError {
  constructor() {
    super(
      502,
      'llm/content_blocked_output',
      'Output blocked',
      'Robotul nu a putut răspunde la această întrebare. Încearcă altceva.',
    );
    this.name = 'LLMContentBlockedOutputError';
  }
}

export class LLMSessionNotFoundError extends AppError {
  constructor() {
    super(404, 'llm/session_not_found', 'Session not found', 'Botul nu a fost găsit.');
    this.name = 'LLMSessionNotFoundError';
  }
}

export class LLMProviderUnavailableError extends AppError {
  constructor() {
    super(
      503,
      'llm/groq_unavailable',
      'LLM provider unavailable',
      'Robotul nu poate răspunde acum. Încearcă peste un minut.',
    );
    this.name = 'LLMProviderUnavailableError';
  }
}

export class LLMExamplesInvalidError extends AppError {
  constructor(detail: string) {
    super(400, 'llm/examples_invalid', 'Invalid examples', detail);
    this.name = 'LLMExamplesInvalidError';
  }
}

export class LLMTeacherBotNotFoundError extends AppError {
  constructor() {
    super(404, 'llm/teacher_bot_not_found', 'Teacher bot not found', 'Bot-ul nu a fost găsit.');
    this.name = 'LLMTeacherBotNotFoundError';
  }
}

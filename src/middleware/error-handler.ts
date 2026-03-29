import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const reqId = (res.locals.requestId as string) || req.body?.request_id || 'unknown';
  const capability = req.body?.capability || 'unknown';
  const startTime = (res.locals.startTime as number) || performance.now();
  const elapsedMs = Math.round(performance.now() - startTime);

  // Handle malformed JSON from express.json()
  if ('type' in err && (err as Record<string, unknown>).type === 'entity.parse.failed') {
    res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON in request body',
        details: {},
      },
      meta: {
        request_id: reqId,
        capability,
        elapsed_ms: elapsedMs,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        request_id: reqId,
        capability,
        elapsed_ms: elapsedMs,
      },
    });
    return;
  }

  // Unexpected errors — do not leak internals
  console.error('[UNHANDLED]', err);
  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: {},
    },
    meta: {
      request_id: reqId,
      capability,
      elapsed_ms: elapsedMs,
    },
  });
}

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const reqId = (res.locals.requestId as string) || req.body?.request_id || 'unknown';
  const capability = req.body?.capability || 'unknown';
  const startTime = (res.locals.startTime as number) || performance.now();
  const elapsedMs = Math.round(performance.now() - startTime);

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

import { Router, type Router as RouterType } from 'express';
import crypto from 'node:crypto';
import { getCapability, listCapabilities } from '../capabilities/registry.js';
import type { SuccessResponse, ErrorResponse } from '../types/index.js';

const router: RouterType = Router();

router.post('/v1/capabilities/run', async (req, res, next) => {
  const startTime = performance.now();
  const { capability, input, request_id } = req.body;
  const reqId: string = request_id || crypto.randomUUID();

  // Persist for error handler
  res.locals.requestId = reqId;
  res.locals.startTime = startTime;

  if (!capability || typeof capability !== 'string') {
    const errorResp: ErrorResponse = {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'capability field is required and must be a string',
        details: {},
      },
      meta: {
        request_id: reqId,
        capability: capability || 'unknown',
        elapsed_ms: Math.round(performance.now() - startTime),
      },
    };
    res.status(400).json(errorResp);
    return;
  }

  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    const errorResp: ErrorResponse = {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'input must be an object',
        details: {},
      },
      meta: {
        request_id: reqId,
        capability,
        elapsed_ms: Math.round(performance.now() - startTime),
      },
    };
    res.status(400).json(errorResp);
    return;
  }

  try {
    const cap = getCapability(capability);
    cap.validate(input || {});
    const data = await cap.execute(input || {});

    const successResp: SuccessResponse = {
      ok: true,
      data,
      meta: {
        request_id: reqId,
        capability,
        elapsed_ms: Math.round(performance.now() - startTime),
      },
    };
    res.json(successResp);
  } catch (err) {
    next(err);
  }
});

router.get('/v1/capabilities', (_req, res) => {
  res.json({ ok: true, capabilities: listCapabilities() });
});

const capabilitiesRouter: RouterType = router;
export { capabilitiesRouter };

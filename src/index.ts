import express from 'express';
import { config } from './config.js';

// Register capabilities (side-effect imports)
import './capabilities/text-summary.js';

import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { capabilitiesRouter } from './routes/capabilities.js';

import type { Express } from 'express';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use(capabilitiesRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`[ai-capability-service] listening on :${config.port} (model: ${config.useRealModel ? 'real' : 'mock'})`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 5s if connections linger
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { app };

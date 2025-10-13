// Minimal Fastify + Socket.io API (placeholder). Replace with your full API.
// No secrets are hardcoded; values read from environment variables.

import Fastify from 'fastify';
import { Server as IOServer } from 'socket.io';

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

const port = parseInt(process.env.API_PORT || '3000', 10);
const host = process.env.API_HOST || '0.0.0.0';

// Healthcheck
fastify.get('/api/health', async () => ({ ok: true, ts: Date.now() }));

// Example REST endpoint (placeholder)
fastify.get('/api/version', async () => ({
  name: 'Backgammon API',
  version: '0.1.0',
  env: process.env.NODE_ENV || 'development',
}));

// Attach Socket.io BEFORE listen()
const io = new IOServer(fastify.server, {
  path: '/socket.io',
  serveClient: false,
  cors: {
    origin: (origin, cb) => {
      // If ALLOWED_ORIGINS unset, allow same-origin only (since Nginx terminates).
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (allowed.length === 0 || !origin) return cb(null, true);
      return cb(null, allowed.includes(origin));
    },
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  fastify.log.info(`Socket connected: ${socket.id}`);
  socket.emit('hello', { t: Date.now() });
  socket.on('disconnect', (reason) => fastify.log.info(`Socket ${socket.id} disconnected: ${reason}`));
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port, host });
    fastify.log.info(`API listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

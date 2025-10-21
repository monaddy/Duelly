// Ops-Runner skeleton API
import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOG_BASE = process.env.DUELLY_LOG_DIR || '/root/duelly/.duelly/logs';
const DUELLY_DIR = process.env.DUELLY_DIR || '/root/duelly/.duelly';
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/root/backgammon-mini-app';
const ALLOWLIST = process.env.ALLOWLIST || path.join(PROJECT_ROOT, 'ops/runner/allowlist.yml');
const PORT = parseInt(process.env.PORT || '4001', 10);

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });
fs.mkdirSync(LOG_BASE, { recursive: true });

const JOBS = new Map(); // id -> {status, stepId, logFile, pid?, cmd?}

app.get('/api/v2/ops/healthz', async () => ({ ok: true, allowlist: fs.existsSync(ALLOWLIST) }));

app.post('/api/v2/ops/jobs', async (req, reply) => {
  const { jobId } = req.body || {};
  if (!jobId) return reply.code(400).send({ ok: false, error: 'jobId required' });
  const id = nanoid(10);
  const stepId = `ops-job-${jobId}-${id}`;
  const logFile = path.join(LOG_BASE, `${stepId}-${new Date().toISOString().replace(/[:.]/g,'')}.log`);
  const runner = path.join(PROJECT_ROOT, 'ops/runner/bin/run_job.sh');

  const child = spawn('bash', ['-lc', `"${runner}" "${jobId}"`], {
    stdio: ['ignore', 'ignore', 'ignore'],
    shell: true,
    env: { ...process.env, DUELLY_DIR, ALLOWLIST }
  });
  JOBS.set(id, { status: 'running', stepId, logFile, pid: child.pid, jobId });

  child.on('exit', (code) => {
    const rec = JOBS.get(id);
    if (rec) rec.status = code === 0 ? 'ok' : `error:${code}`;
  });

  return { ok: true, id, stepId, logFile };
});

app.get('/api/v2/ops/jobs/:id', async (req, reply) => {
  const rec = JOBS.get(req.params.id);
  if (!rec) return reply.code(404).send({ ok: false, error: 'not_found' });
  return { ok: true, ...rec };
});

app.get('/api/v2/ops/jobs/:id/logs/tail', async (req, reply) => {
  const rec = JOBS.get(req.params.id);
  if (!rec) return reply.code(404).send({ ok: false, error: 'not_found' });
  if (!fs.existsSync(rec.logFile)) return reply.code(204).send();
  const buf = fs.readFileSync(rec.logFile, 'utf8');
  return reply.type('text/plain').send(buf.slice(-10000));
});

app.listen({ host: '0.0.0.0', port: PORT }).then(() => {
  app.log.info({ PORT, ALLOWLIST, LOG_BASE }, 'ops-runner listening');
}).catch((e) => {
  app.log.error(e, 'failed to start'); process.exit(1);
});

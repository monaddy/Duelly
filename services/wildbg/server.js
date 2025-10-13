// Minimal HTTP stub for wildbg. Replace with a real wildbg HTTP server when ready.
import http from 'http';

const port = parseInt(process.env.WILDBG_PORT || '9000', 10);

const respondJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/health') {
    return respondJson(res, 200, { ok: true, engine: 'wildbg-stub', ts: Date.now() });
  }

  if (method === 'POST' && url === '/move') {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      let input = {};
      try { input = raw ? JSON.parse(raw) : {}; } catch {}
      // Return a deterministic placeholder move; replace with wildbg result.
      const reply = {
        move: { action: 'roll', dice: [1, 1], note: 'stub: replace with wildbg output' },
        input,
        ts: Date.now(),
      };
      return respondJson(res, 200, reply);
    });
    return;
  }

  respondJson(res, 404, { error: 'Not found' });
});

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`wildbg stub listening on :${port}`);
});

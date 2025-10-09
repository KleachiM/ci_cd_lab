const http = require('http');

function createMockServer() {
  let requestCount = 0;

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/data')) {
      requestCount += 1;
      const payload = {
        message: 'Hello from mock server',
        requestId: requestCount,
        timestamp: Date.now(),
      };
      const body = JSON.stringify(payload);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      });
      res.end(body);
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/delay')) {
      requestCount += 1;
      const delayMatch = /delay=(\d+)/.exec(req.url);
      const delay = delayMatch ? Number(delayMatch[1]) : 100;
      setTimeout(() => {
        const payload = {
          status: 'delayed',
          delay,
          requestId: requestCount,
        };
        const body = JSON.stringify(payload);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        });
        res.end(body);
      }, delay);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  function start(port = 0) {
    return new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', reject);
        const address = server.address();
        const actualPort = typeof address === 'string' ? port : address.port;
        resolve(actualPort);
      });
    });
  }

  function stop() {
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  return {
    start,
    stop,
    getRequestCount: () => requestCount,
    resetRequestCount: () => {
      requestCount = 0;
    },
    server,
  };
}

module.exports = { createMockServer };

if (require.main === module) {
  const port = process.env.MOCK_SERVER_PORT ? Number(process.env.MOCK_SERVER_PORT) : 4000;
  const instance = createMockServer();
  instance
    .start(port)
    .then((actualPort) => {
      console.log(`Mock server listening on port ${actualPort}`);
    })
    .catch((error) => {
      console.error('Failed to start mock server:', error);
      process.exitCode = 1;
    });

  const shutdown = () => {
    instance
      .stop()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Failed to stop mock server:', error);
        process.exit(1);
      });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

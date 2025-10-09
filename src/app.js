const express = require('express');
const { Cache } = require('./cache');
const { HttpClient } = require('./httpClient');

function createHttpClient(options = {}) {
  const cache = options.cache || new Cache({ defaultTtlMs: options.defaultTtlMs });
  return new HttpClient({ cache, defaultTtlMs: options.defaultTtlMs });
}

function createServer({ cacheTtlMs, host = '127.0.0.1' } = {}) {
  const cache = new Cache({ defaultTtlMs: cacheTtlMs });
  const httpClient = new HttpClient({ cache, defaultTtlMs: cacheTtlMs });
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url || process.env.API_URL;
    if (!targetUrl) {
      res.status(400).json({ error: 'Missing target URL. Provide ?url=... or set API_URL.' });
      return;
    }

    const skipCache = req.query.skipCache === 'true';

    try {
      const result = await httpClient.get(targetUrl, {
        responseType: 'json',
        skipCache,
      });

      res.set('X-From-Cache', result.fromCache ? '1' : '0');
      res.status(result.status).json({
        data: result.data,
        fromCache: result.fromCache,
        status: result.status,
      });
    } catch (error) {
      res.status(502).json({ error: error.message });
    }
  });

  return { app, httpClient, cache, host };
}

async function startServer({ port = Number(process.env.PORT) || 3000, host = '127.0.0.1', cacheTtlMs } = {}) {
  const { app } = createServer({ cacheTtlMs, host });

  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      const addressInfo = server.address();
      const actualPort = typeof addressInfo === 'string' ? port : addressInfo.port;
      console.log(`HTTP client server listening on http://${host}:${actualPort}`);
      resolve({ server, port: actualPort });
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start HTTP client server:', error);
    process.exitCode = 1;
  });
}

module.exports = { createHttpClient, createServer, startServer, HttpClient, Cache };

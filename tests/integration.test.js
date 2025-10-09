const http = require('http');
const { createServer } = require('../src/app');
const { createMockServer } = require('./mockServer');

const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
};

describe('Express integration', () => {
  let mock;
  let mockPort;
  let mockBaseUrl;
  let server;
  let appBaseUrl;

  beforeAll(async () => {
    mock = createMockServer();
    mockPort = await mock.start(0);
    mockBaseUrl = `http://127.0.0.1:${mockPort}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await mock.stop();
  });

  beforeEach(async () => {
    mock.resetRequestCount();
    const { app } = createServer({ cacheTtlMs: 200 });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        appBaseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      server = null;
    }
  });

  test('proxy endpoint caches responses from external API', async () => {
    const targetUrl = `${mockBaseUrl}/data`;
    const firstResponse = await makeRequest(`${appBaseUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);
    const secondResponse = await makeRequest(`${appBaseUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);

    expect(firstResponse.body.fromCache).toBe(false);
    expect(secondResponse.body.fromCache).toBe(true);
    expect(secondResponse.body.data.requestId).toBe(firstResponse.body.data.requestId);
    expect(mock.getRequestCount()).toBe(1);
  });

  test('proxy endpoint can bypass cache when requested', async () => {
    const targetUrl = `${mockBaseUrl}/data`;
    await makeRequest(`${appBaseUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);
    const bypassResponse = await makeRequest(`${appBaseUrl}/proxy?url=${encodeURIComponent(targetUrl)}&skipCache=true`);

    expect(bypassResponse.body.fromCache).toBe(false);
    expect(mock.getRequestCount()).toBe(2);
  });
});

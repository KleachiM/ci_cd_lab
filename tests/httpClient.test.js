const { Cache } = require('../src/cache');
const { HttpClient } = require('../src/httpClient');
const { createMockServer } = require('./mockServer');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('HttpClient with caching', () => {
  let server;
  let port;
  let baseUrl;

  beforeAll(async () => {
    server = createMockServer();
    port = await server.start(0);
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    server.resetRequestCount();
  });

  test('caches successful GET responses', async () => {
    const client = new HttpClient({
      cache: new Cache({ defaultTtlMs: 500 }),
      defaultTtlMs: 500,
    });

    const first = await client.get(`${baseUrl}/data`, { responseType: 'json' });
    const second = await client.get(`${baseUrl}/data`, { responseType: 'json' });

    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(second.data.requestId).toBe(first.data.requestId);
    expect(server.getRequestCount()).toBe(1);
  });

  test('refreshes cache entry after ttl expiration', async () => {
    const client = new HttpClient({
      cache: new Cache({ defaultTtlMs: 40 }),
      defaultTtlMs: 40,
    });

    const first = await client.get(`${baseUrl}/data`, { responseType: 'json' });
    await sleep(60);
    const second = await client.get(`${baseUrl}/data`, { responseType: 'json' });

    expect(second.fromCache).toBe(false);
    expect(server.getRequestCount()).toBe(2);
    expect(second.data.requestId).toBeGreaterThan(first.data.requestId);
  });

  test('allows bypassing the cache', async () => {
    const client = new HttpClient({
      cache: new Cache({ defaultTtlMs: 500 }),
      defaultTtlMs: 500,
    });

    await client.get(`${baseUrl}/data`, { responseType: 'json' });
    const second = await client.get(`${baseUrl}/data`, { responseType: 'json', skipCache: true });

    expect(second.fromCache).toBe(false);
    expect(server.getRequestCount()).toBe(2);
  });

  test('throws on request timeout', async () => {
    const client = new HttpClient({
      cache: new Cache({ defaultTtlMs: 500 }),
      defaultTtlMs: 500,
    });

    await expect(
      client.get(`${baseUrl}/delay?delay=200`, {
        responseType: 'json',
        timeout: 50,
      })
    ).rejects.toThrow('Request timed out');
  });
});

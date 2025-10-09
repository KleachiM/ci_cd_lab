const { Cache } = require('../src/cache');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Cache', () => {
  test('stores and retrieves values', () => {
    const cache = new Cache({ defaultTtlMs: 1_000 });
    cache.set('foo', 'bar');
    expect(cache.get('foo')).toBe('bar');
  });

  test('expires values based on ttl', async () => {
    const cache = new Cache({ defaultTtlMs: 50 });
    cache.set('expiring', 'value', 30);
    expect(cache.get('expiring')).toBe('value');
    await sleep(40);
    expect(cache.get('expiring')).toBeUndefined();
  });

  test('supports manual eviction', () => {
    const cache = new Cache({ defaultTtlMs: 1_000 });
    cache.set('key', 'value');
    cache.delete('key');
    expect(cache.has('key')).toBe(false);
  });
});

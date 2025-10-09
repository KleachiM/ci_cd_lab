const DEFAULT_TTL_MS = 60_000;

/**
 * Simple in-memory cache with TTL support.
 */
class Cache {
  constructor({ defaultTtlMs = DEFAULT_TTL_MS } = {}) {
    if (defaultTtlMs <= 0 && defaultTtlMs !== Infinity) {
      throw new Error('defaultTtlMs must be a positive number or Infinity');
    }
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const ttl = ttlMs === undefined ? this.defaultTtlMs : ttlMs;
    if (ttl !== Infinity && (typeof ttl !== 'number' || ttl <= 0)) {
      throw new Error('ttlMs must be a positive number or Infinity');
    }

    const expiresAt = ttl === Infinity ? Infinity : Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
    return value;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt !== Infinity && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  getWithMetadata(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    const expired = entry.expiresAt !== Infinity && entry.expiresAt <= Date.now();
    if (expired) {
      this.store.delete(key);
      return undefined;
    }
    return { value: entry.value, expiresAt: entry.expiresAt };
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  pruneExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== Infinity && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

module.exports = { Cache, DEFAULT_TTL_MS };

const axios = require('axios');
const { Cache, DEFAULT_TTL_MS } = require('./cache');

class HttpClient {
  constructor({ cache = new Cache(), defaultTtlMs = DEFAULT_TTL_MS } = {}) {
    this.cache = cache;
    this.defaultTtlMs = defaultTtlMs;
  }

  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, options = {}) {
    return this.request(url, { ...options, method: 'POST' });
  }

  async request(url, {
    method = 'GET',
    headers = {},
    body,
    cacheKey,
    skipCache = false,
    responseType = 'auto',
    timeout,
  } = {}) {
    const normalizedMethod = method.toUpperCase();
    const normalizedHeaders = { ...(headers || {}) };
    const key = cacheKey || this.#buildCacheKey(normalizedMethod, url, normalizedHeaders, body);

    if (!skipCache) {
      const cached = this.cache.get(key);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    const payload = this.#prepareRequestPayload(body, normalizedHeaders);

    const axiosOptions = {
      method: normalizedMethod,
      url,
      headers: normalizedHeaders,
      timeout,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    };

    if (payload !== undefined) {
      axiosOptions.data = payload;
    }

    let response;
    try {
      response = await axios(axiosOptions);
    } catch (error) {
      if (timeout && (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || ''))) {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    }

    const rawBody = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data);

    const parsedData = this.#parseBody(
      rawBody,
      response.headers['content-type'] || '',
      responseType
    );

    const result = {
      status: response.status,
      headers: response.headers,
      data: parsedData,
      rawBody,
    };

    const isCacheable = !skipCache && response.status >= 200 && response.status < 400;
    if (isCacheable) {
      this.cache.set(key, result, this.defaultTtlMs);
    }

    return { ...result, fromCache: false };
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  clearCache() {
    this.cache.clear();
  }

  #buildCacheKey(method, url, headers, body) {
    const headerEntries = Object.entries(headers || {})
      .map(([k, v]) => [k.toLowerCase(), v])
      .sort(([a], [b]) => a.localeCompare(b));

    const serializedHeaders = JSON.stringify(headerEntries);
    let serializedBody = '';
    if (body !== undefined && body !== null) {
      if (Buffer.isBuffer(body)) {
        serializedBody = body.toString('base64');
      } else if (typeof body === 'object') {
        serializedBody = JSON.stringify(body);
      } else {
        serializedBody = String(body);
      }
    }

    return `${method}::${url}::${serializedHeaders}::${serializedBody}`;
  }

  #prepareRequestPayload(body, headers) {
    if (body === undefined || body === null) {
      return undefined;
    }

    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (typeof body === 'object') {
      this.#ensureHeader(headers, 'content-type', 'application/json');
      return JSON.stringify(body);
    }

    this.#ensureHeader(headers, 'content-type', 'text/plain');
    return String(body);
  }

  #ensureHeader(headers, name, value) {
    const existing = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
    if (!existing) {
      headers[name] = value;
    }
  }

  #parseBody(buffer, contentType, responseType) {
    if (responseType === 'buffer') {
      return buffer;
    }

    const text = buffer.toString('utf8');

    if (responseType === 'text') {
      return text;
    }

    const lowerContentType = (contentType || '').toLowerCase();
    const shouldParseJson = responseType === 'json' ||
      (responseType === 'auto' && lowerContentType.includes('application/json'));

    if (shouldParseJson) {
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error(`Failed to parse JSON response: ${err.message}`);
      }
    }

    return text;
  }
}

module.exports = { HttpClient };

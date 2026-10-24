import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import { app } from '../app';
import { assertAuthConfig } from '../middleware/auth';
import { connectDB } from '../config/db';

describe('Production configuration requirements', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects a missing or weak JWT secret', () => {
    vi.stubEnv('JWT_SECRET', 'too-short');
    expect(assertAuthConfig).toThrow(/at least 32 characters/);
  });

  it('requires a configured database URI in production without attempting a connection', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MONGODB_URI', '');

    await expect(connectDB()).rejects.toThrow(/MONGODB_URI is required in production/);
  });

  it('fails closed for production API requests when the database is disconnected', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const server = app.listen(0);

    try {
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const { port } = server.address() as AddressInfo;

      const health = await fetch(`http://127.0.0.1:${port}/api/health`);
      const products = await fetch(`http://127.0.0.1:${port}/api/products`);

      expect(health.status).toBe(503);
      expect((await health.json()).database).toBe('disconnected');
      expect(products.status).toBe(503);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('locks down cross-origin access and sets conservative security headers', async () => {
    vi.stubEnv('PUBLIC_APP_URL', 'https://shop.example.com');
    const server = app.listen(0);

    try {
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const { port } = server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}/api/health`;

      const allowed = await fetch(url, {
        headers: { Origin: 'https://shop.example.com' },
      });
      const blocked = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil.example',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect(allowed.headers.get('access-control-allow-origin')).toBe('https://shop.example.com');
      expect(allowed.headers.get('x-content-type-options')).toBe('nosniff');
      expect(allowed.headers.get('x-frame-options')).toBe('DENY');
      expect(blocked.status).toBe(403);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

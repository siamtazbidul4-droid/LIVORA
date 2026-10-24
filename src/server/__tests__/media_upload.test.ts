import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import { app } from '../app';

describe('admin image upload access control', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('requires an authenticated staff session before accepting an upload', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const server = app.listen(0);
    try {
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const address = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/media`, {
        method: 'POST',
      });
      expect(response.status).toBe(401);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

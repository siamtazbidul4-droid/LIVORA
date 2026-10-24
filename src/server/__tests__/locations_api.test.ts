import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { app } from '../app';

describe('Public Bangladesh locations API', () => {
  let server: ReturnType<typeof app.listen> | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
      server = undefined;
    }
  });

  it('serves the verified hierarchy without requiring a database connection', async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => server!.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/api/locations/bangladesh`);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.counts).toMatchObject({
      divisions: 8,
      districts: 64,
      upazilas: 504,
      unions: 4964,
    });
    expect(result.locations[0].districts[0].upazilas[0].unions.length).toBeGreaterThan(0);
  });
});

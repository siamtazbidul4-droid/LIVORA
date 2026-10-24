import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';

const database = vi.hoisted(() => ({ connected: true }));

vi.mock('../config/db', () => ({
  isDbConnected: () => database.connected,
}));

import { app } from '../app';
import { UserModel } from '../models/User';
import { generateToken } from '../middleware/auth';

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = app.listen(0);
  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('staff portal authentication', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    database.connected = true;
  });

  it('accepts configured admin credentials and never returns the configured password', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('ADMIN_PASSWORD', 'a-strong-admin-password');
    vi.stubEnv('JWT_SECRET', 'test-auth-secret-with-at-least-32-characters');
    const admin = new UserModel({
      name: 'Environment Administrator',
      email: 'admin@example.com',
      role: 'super_admin',
      tokenVersion: 0,
    });
    vi.spyOn(UserModel, 'findOne').mockResolvedValue(admin as never);

    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ' ADMIN@example.com ',
          password: 'a-strong-admin-password',
        }),
      });
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.user.role).toBe('super_admin');
      expect(payload.token).toBeTruthy();
      expect(JSON.stringify(payload)).not.toContain('a-strong-admin-password');
    });
  });

  it('rejects incorrect configured passwords and customer accounts', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('ADMIN_PASSWORD', 'a-strong-admin-password');
    const customer = new UserModel({
      name: 'Customer',
      email: 'admin@example.com',
      role: 'customer',
      tokenVersion: 0,
    });
    vi.spyOn(UserModel, 'findOne').mockResolvedValue(customer as never);

    await withServer(async (baseUrl) => {
      const wrongPassword = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'wrong-password' }),
      });
      expect(wrongPassword.status).toBe(401);

      const customerLogin = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'a-strong-admin-password',
        }),
      });
      expect(customerLogin.status).toBe(401);
    });
  });

  it('blocks the configured admin from using the customer login endpoint', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('ADMIN_PASSWORD', 'a-strong-admin-password');
    const findOne = vi.spyOn(UserModel, 'findOne');

    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'a-strong-admin-password',
        }),
      });
      expect(response.status).toBe(401);
      expect(findOne).not.toHaveBeenCalled();
    });
  });

  it('does not authenticate an administrator when environment credentials are missing', async () => {
    vi.stubEnv('ADMIN_EMAIL', '');
    vi.stubEnv('ADMIN_PASSWORD', '');
    database.connected = false;

    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'any-password-here' }),
      });

      expect(response.status).toBe(503);
    });
  });

  it('rejects anonymous and customer access to protected product operations', async () => {
    vi.stubEnv('JWT_SECRET', 'test-auth-secret-with-at-least-32-characters');
    const customer = new UserModel({
      name: 'Customer',
      email: 'customer@example.com',
      role: 'customer',
      tokenVersion: 0,
    });
    vi.spyOn(UserModel, 'findById').mockReturnValue({
      select: () => Promise.resolve(customer),
    } as never);
    const customerToken = generateToken(customer._id.toString(), 'customer', 0);

    await withServer(async (baseUrl) => {
      const anonymous = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(anonymous.status).toBe(401);

      const customerResponse = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({}),
      });
      expect(customerResponse.status).toBe(403);
    });
  });
});

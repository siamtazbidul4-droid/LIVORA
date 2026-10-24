import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ensureConfiguredAdminAccount,
  getConfiguredAdminCredentials,
  isConfiguredAdminEmail,
  timingSafeStringEqual,
} from '../services/adminAccount';

describe('environment administrator configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not provision an administrator when credentials are missing', async () => {
    vi.stubEnv('ADMIN_EMAIL', '');
    vi.stubEnv('ADMIN_PASSWORD', '');

    expect(getConfiguredAdminCredentials()).toBeNull();
    await expect(ensureConfiguredAdminAccount()).resolves.toBeUndefined();
  });

  it('requires both variables and validates email and password without changing the password', () => {
    vi.stubEnv('ADMIN_EMAIL', ' Admin@Example.com ');
    expect(() => getConfiguredAdminCredentials()).toThrow(/both be configured/);

    vi.stubEnv('ADMIN_PASSWORD', '  correct horse battery staple  ');
    expect(getConfiguredAdminCredentials()).toEqual({
      email: 'admin@example.com',
      password: '  correct horse battery staple  ',
    });
    expect(isConfiguredAdminEmail('admin@example.com')).toBe(true);
    expect(timingSafeStringEqual('expected-password', 'expected-password')).toBe(true);
    expect(timingSafeStringEqual('expected-password', 'incorrect-password')).toBe(false);
  });

  it('rejects malformed email addresses and weak configured passwords', () => {
    vi.stubEnv('ADMIN_EMAIL', 'not-an-email');
    vi.stubEnv('ADMIN_PASSWORD', 'long-enough-password');
    expect(() => getConfiguredAdminCredentials()).toThrow(/must be valid/);

    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('ADMIN_PASSWORD', 'too-short');
    expect(() => getConfiguredAdminCredentials()).toThrow(/at least 12 characters/);
  });
});

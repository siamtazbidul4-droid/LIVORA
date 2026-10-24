import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { UserModel, type IUser } from '../models/User';

export interface ConfiguredAdminCredentials {
  email: string;
  password: string;
}

const STAFF_ROLES: IUser['role'][] = [
  'super_admin',
  'admin',
  'order_manager',
  'inventory_manager',
  'catalog_manager',
  'customer_support',
  'finance',
];

export function getConfiguredAdminCredentials(): ConfiguredAdminCredentials | null {
  const rawEmail = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!rawEmail && !password) return null;
  if (!rawEmail || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must both be configured.');
  }

  const email = rawEmail.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 1024
  ) {
    throw new Error('ADMIN_EMAIL must be valid and ADMIN_PASSWORD must be at least 12 characters.');
  }

  return { email, password };
}

export function assertAdminConfig(): void {
  if (!getConfiguredAdminCredentials()) {
    console.warn('Administrator sign-in is disabled until ADMIN_EMAIL and ADMIN_PASSWORD are configured.');
  }
}

export function isConfiguredAdminEmail(email: string): boolean {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() === email;
}

export function timingSafeStringEqual(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left, 'utf8').digest();
  const rightDigest = createHash('sha256').update(right, 'utf8').digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export async function ensureConfiguredAdminAccount(): Promise<void> {
  const credentials = getConfiguredAdminCredentials();
  if (!credentials) return;

  const existing = await UserModel.findOne({ email: credentials.email });
  if (existing) {
    if (!STAFF_ROLES.includes(existing.role)) {
      throw new Error('ADMIN_EMAIL already belongs to a non-staff account; no account was changed.');
    }
    return;
  }

  const unusablePassword = randomBytes(48).toString('base64url');
  try {
    await UserModel.create({
      name: 'Environment Administrator',
      email: credentials.email,
      password: unusablePassword,
      role: 'super_admin',
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      const createdByAnotherInstance = await UserModel.findOne({ email: credentials.email });
      if (createdByAnotherInstance && STAFF_ROLES.includes(createdByAnotherInstance.role)) return;
      throw new Error('ADMIN_EMAIL could not be provisioned as a staff account.');
    }
    throw error;
  }
}

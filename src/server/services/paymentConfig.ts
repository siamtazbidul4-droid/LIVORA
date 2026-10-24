import { bkashService } from './bkashService';

function publicBaseUrl(name: 'PUBLIC_API_URL' | 'PUBLIC_APP_URL'): string | null {
  const value = process.env[name];
  if (!value) return null;

  try {
    const url = new URL(value);
    const production = process.env.NODE_ENV === 'production';
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      (production && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getPublicApiUrl(): string | null {
  return publicBaseUrl('PUBLIC_API_URL');
}

export function getPublicAppUrl(): string | null {
  return publicBaseUrl('PUBLIC_APP_URL');
}

export function isBkashCheckoutAvailable(): boolean {
  return Boolean(bkashService.isConfigured() && getPublicApiUrl() && getPublicAppUrl());
}

export function getAvailablePaymentMethods() {
  return {
    cod: true,
    bkash: isBkashCheckoutAvailable(),
    nagad: false,
    card: false,
  };
}

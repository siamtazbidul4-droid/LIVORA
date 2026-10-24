import { afterEach, describe, expect, it, vi } from 'vitest';
import { BkashService } from '../services/bkashService';
import { getAvailablePaymentMethods } from '../services/paymentConfig';

const sandboxBaseUrl = 'https://tokenized.sandbox.bka.sh/v2/tokenized-checkout';

function configureBkash() {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('BKASH_BASE_URL', sandboxBaseUrl);
  vi.stubEnv('BKASH_APP_KEY', 'test-app-key');
  vi.stubEnv('BKASH_APP_SECRET', 'test-app-secret');
  vi.stubEnv('BKASH_USERNAME', 'test-user');
  vi.stubEnv('BKASH_PASSWORD', 'test-password');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('bKash Tokenized Checkout v2 service', () => {
  it('uses the documented v2 grant, create, and execute endpoints', async () => {
    configureBkash();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        requests.push({ url, init });
        if (url.endsWith('/auth/grant-token')) {
          return Response.json({ statusCode: '0000', id_token: 'access-token', expires_in: 3600 });
        }
        if (url.endsWith('/payment/create')) {
          return Response.json({
            paymentId: 'gateway-payment-1',
            bkashURL: 'https://sandbox.payment.bkash.com/checkout',
            transactionStatus: 'Initiated',
            amount: '4500.00',
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: 'NOV-2610-1001',
          });
        }
        if (url.endsWith('/payment/execute')) {
          return Response.json({
            paymentId: 'gateway-payment-1',
            trxId: 'trx-1',
            transactionStatus: 'Completed',
            amount: '4500.00',
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: 'NOV-2610-1001',
          });
        }
        throw new Error(`Unexpected endpoint ${url}`);
      })
    );

    const service = new BkashService();
    expect(service.isConfigured()).toBe(true);
    const initiated = await service.createPayment({
      amount: 4500,
      orderNumber: 'NOV-2610-1001',
      callbackUrl: 'https://shop.example/api/payments/bkash/callback',
      payerReference: 'customer@shop.example',
    });
    const executed = await service.executePayment(initiated.paymentID);

    expect(initiated.paymentID).toBe('gateway-payment-1');
    expect(initiated.amount).toBe('4500.00');
    expect(executed).toMatchObject({
      paymentID: 'gateway-payment-1',
      trxID: 'trx-1',
      transactionStatus: 'Completed',
      amount: '4500.00',
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: 'NOV-2610-1001',
      statusCode: '0000',
    });
    expect(requests.map(({ url }) => url)).toEqual([
      `${sandboxBaseUrl}/auth/grant-token`,
      `${sandboxBaseUrl}/payment/create`,
      `${sandboxBaseUrl}/payment/execute`,
    ]);
    expect(requests[1].init?.headers).toMatchObject({
      Authorization: 'access-token',
      'X-App-Key': 'test-app-key',
    });
    expect(JSON.parse(String(requests[1].init?.body))).toMatchObject({
      amount: '4500.00',
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: 'NOV-2610-1001',
    });
  });

  it('normalizes trailing slashes and rejects noncanonical provider endpoints', async () => {
    configureBkash();
    vi.stubEnv('BKASH_BASE_URL', `${sandboxBaseUrl}/`);
    const requests: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        requests.push(url);
        if (url.endsWith('/auth/grant-token')) {
          return Response.json({ statusCode: '0000', id_token: 'access-token', expires_in: 3600 });
        }
        return Response.json({
          paymentId: 'gateway-payment-3',
          bkashURL: 'https://sandbox.payment.bkash.com/checkout',
          transactionStatus: 'Initiated',
          amount: '100.00',
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: 'NOV-2610-1003',
        });
      })
    );

    const service = new BkashService();
    expect(service.isConfigured()).toBe(true);
    await service.createPayment({
      amount: 100,
      orderNumber: 'NOV-2610-1003',
      callbackUrl: 'https://shop.example/api/payments/bkash/callback',
      payerReference: 'customer',
    });
    expect(requests).toEqual([
      `${sandboxBaseUrl}/auth/grant-token`,
      `${sandboxBaseUrl}/payment/create`,
    ]);

    vi.stubEnv('BKASH_BASE_URL', `${sandboxBaseUrl}:8443`);
    expect(new BkashService().isConfigured()).toBe(false);
    vi.stubEnv('BKASH_BASE_URL', `https://merchant@${sandboxBaseUrl.slice('https://'.length)}`);
    expect(new BkashService().isConfigured()).toBe(false);
    vi.stubEnv('BKASH_APP_SECRET', '   ');
    expect(new BkashService().isConfigured()).toBe(false);
  });

  it('queries provider state for uncertain execution results', async () => {
    configureBkash();
    const requests: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        requests.push(url);
        if (url.endsWith('/auth/grant-token')) {
          return Response.json({ statusCode: '0000', id_token: 'access-token', expires_in: 3600 });
        }
        return Response.json({
          paymentId: 'gateway-payment-2',
          trxId: 'trx-2',
          transactionStatus: 'Completed',
          verificationStatus: 'Complete',
          amount: '250.00',
          currency: 'BDT',
          intent: 'sale',
          merchantInvoice: 'NOV-2610-1002',
        });
      })
    );

    const result = await new BkashService().queryPayment('gateway-payment-2');
    expect(result).toMatchObject({
      paymentID: 'gateway-payment-2',
      trxID: 'trx-2',
      transactionStatus: 'Completed',
      merchantInvoiceNumber: 'NOV-2610-1002',
    });
    expect(requests[1]).toBe(`${sandboxBaseUrl}/query/payment`);
  });

  it('never simulates payments and rejects missing or wrong-environment configuration', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('BKASH_APP_KEY', '');
    const unconfigured = new BkashService();
    expect(unconfigured.isConfigured()).toBe(false);
    await expect(
      unconfigured.createPayment({
        amount: 100,
        orderNumber: 'NOV-2610-1003',
        callbackUrl: 'https://shop.example/api/payments/bkash/callback',
        payerReference: 'customer',
      })
    ).rejects.toThrow(/configuration are invalid/);

    configureBkash();
    vi.stubEnv('BKASH_BASE_URL', '');
    expect(new BkashService().isConfigured()).toBe(false);

    configureBkash();
    vi.stubEnv('NODE_ENV', 'production');
    const wrongEnvironment = new BkashService();
    expect(wrongEnvironment.isConfigured()).toBe(false);
  });
});

describe('available payment methods', () => {
  it('never enables Nagad or card without verified integrations', () => {
    expect(getAvailablePaymentMethods()).toMatchObject({
      cod: true,
      nagad: false,
      card: false,
    });
  });
});

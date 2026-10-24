export interface BkashConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
}

export interface BkashPaymentCreateResult {
  paymentID: string;
  bkashURL: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  transactionStatus: string;
}

export interface BkashPaymentExecuteResult {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

type BkashResponse = Record<string, unknown>;

export class BkashService {
  private readonly config: BkashConfig;
  private idToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor() {
    this.config = {
      baseUrl: process.env.BKASH_BASE_URL || '',
      appKey: process.env.BKASH_APP_KEY || '',
      appSecret: process.env.BKASH_APP_SECRET || '',
      username: process.env.BKASH_USERNAME || '',
      password: process.env.BKASH_PASSWORD || '',
    };
    this.config.baseUrl = this.config.baseUrl.replace(/\/+$/, '');
  }

  public isConfigured(): boolean {
    let endpoint: URL;
    try {
      endpoint = new URL(this.config.baseUrl);
    } catch {
      return false;
    }

    const expectedOrigin =
      process.env.NODE_ENV === 'production'
        ? 'https://tokenized.pay.bka.sh'
        : 'https://tokenized.sandbox.bka.sh';

    return Boolean(
      this.config.appKey.trim() &&
        this.config.appSecret.trim() &&
        this.config.username.trim() &&
        this.config.password.trim() &&
        endpoint.protocol === 'https:' &&
        endpoint.origin === expectedOrigin &&
        endpoint.pathname === '/v2/tokenized-checkout' &&
        !endpoint.username &&
        !endpoint.password &&
        !endpoint.search &&
        !endpoint.hash
    );
  }

  private async request(path: string, body: Record<string, string>, token?: string): Promise<BkashResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = token;
      headers['X-App-Key'] = this.config.appKey;
    } else {
      headers.username = this.config.username;
      headers.password = this.config.password;
    }

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const data: unknown = await response.json();

    if (!response.ok || !data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('bKash request failed. Check the merchant configuration and provider status.');
    }

    const result = data as BkashResponse;
    if (typeof result.errorMessageEn === 'string' || typeof result.statusMessage === 'string') {
      const message = result.errorMessageEn || result.statusMessage;
      if (result.statusCode !== '0000') {
        throw new Error(`bKash request rejected: ${String(message)}`);
      }
    }
    return result;
  }

  private async grantToken(): Promise<string> {
    if (this.idToken && Date.now() < this.tokenExpiresAt - 60_000) return this.idToken;
    if (!this.isConfigured()) {
      throw new Error('bKash merchant credentials or environment configuration are invalid.');
    }

    const data = await this.request('/auth/grant-token', {
      app_key: this.config.appKey,
      app_secret: this.config.appSecret,
    });
    if (typeof data.id_token !== 'string' || !data.id_token) {
      throw new Error('bKash did not return an authorization token.');
    }

    this.idToken = data.id_token;
    this.tokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
    return this.idToken;
  }

  public async createPayment(params: {
    amount: number;
    orderNumber: string;
    callbackUrl: string;
    payerReference: string;
  }): Promise<BkashPaymentCreateResult> {
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      throw new Error('The bKash payment amount is invalid.');
    }
    const token = await this.grantToken();
    const data = await this.request(
      '/payment/create',
      {
        payerReference: params.payerReference,
        callbackURL: params.callbackUrl,
        amount: params.amount.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: params.orderNumber,
      },
      token
    );

    let redirectUrl: URL;
    try {
      redirectUrl = new URL(String(data.bkashURL || ''));
    } catch {
      throw new Error('bKash returned an invalid checkout URL.');
    }
    const expectedRedirectHost =
      process.env.NODE_ENV === 'production'
        ? 'payment.bkash.com'
        : 'sandbox.payment.bkash.com';
    if (
      typeof data.paymentId !== 'string' ||
      typeof data.bkashURL !== 'string' ||
      redirectUrl.protocol !== 'https:' ||
      redirectUrl.hostname !== expectedRedirectHost ||
      data.transactionStatus !== 'Initiated'
    ) {
      throw new Error('bKash returned an invalid payment initiation response.');
    }

    return {
      paymentID: data.paymentId,
      bkashURL: data.bkashURL,
      amount: String(data.amount),
      currency: String(data.currency),
      intent: String(data.intent),
      merchantInvoiceNumber: String(data.merchantInvoiceNumber),
      transactionStatus: String(data.transactionStatus),
    };
  }

  public async executePayment(paymentID: string): Promise<BkashPaymentExecuteResult> {
    const token = await this.grantToken();
    const data = await this.request('/payment/execute', { paymentId: paymentID }, token);

    return {
      paymentID: String(data.paymentId || ''),
      trxID: String(data.trxId || ''),
      transactionStatus: String(data.transactionStatus || ''),
      amount: String(data.amount || ''),
      currency: String(data.currency || ''),
      intent: String(data.intent || ''),
      merchantInvoiceNumber: String(data.merchantInvoiceNumber || ''),
      statusCode: String(data.statusCode || (data.transactionStatus === 'Completed' ? '0000' : '')),
      statusMessage: String(data.errorMessageEn || data.statusMessage || ''),
    };
  }

  public async queryPayment(paymentID: string): Promise<BkashPaymentExecuteResult> {
    const token = await this.grantToken();
    const data = await this.request('/query/payment', { paymentId: paymentID }, token);

    return {
      paymentID: String(data.paymentId || ''),
      trxID: String(data.trxId || ''),
      transactionStatus: String(data.transactionStatus || ''),
      amount: String(data.amount || ''),
      currency: String(data.currency || ''),
      intent: String(data.intent || ''),
      merchantInvoiceNumber: String(data.merchantInvoiceNumber || data.merchantInvoice || ''),
      statusCode: String(data.statusCode || (data.paymentId ? '0000' : '')),
      statusMessage: String(data.errorMessageEn || data.statusMessage || ''),
    };
  }
}

export const bkashService = new BkashService();

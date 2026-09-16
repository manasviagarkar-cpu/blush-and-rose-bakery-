import crypto from 'crypto';

export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  isDeposit: boolean;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentId: string;
  paymentUrl: string;
  isMock: boolean;
  message?: string;
}

export interface PaymentVerificationParams {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  isMock?: boolean;
}

export interface PaymentVerificationResult {
  verified: boolean;
  paymentId?: string;
  transactionId?: string;
  isMock: boolean;
  message: string;
}

export interface IPaymentAdapter {
  createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
  verifyWebhook(payload: string, signature: string): boolean;
}

/**
 * Mock / Test Mode Payment Adapter
 * Safely simulates Razorpay payment links and validation for development and demonstrations
 */
export class MockPaymentAdapter implements IPaymentAdapter {
  async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult> {
    const mockPaymentId = `mock_pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Generates a mock checkout URL with order parameters
    const paymentUrl = `${appUrl}/payment/checkout?orderId=${params.orderId}&paymentId=${mockPaymentId}&amount=${params.amount}&isMock=true`;

    return {
      success: true,
      paymentId: mockPaymentId,
      paymentUrl,
      isMock: true,
      message: '[TEST MODE] Mock payment link generated safely. Real funds will not be charged.',
    };
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    if (params.isMock || (params.razorpayPaymentId && params.razorpayPaymentId.startsWith('mock_'))) {
      return {
        verified: true,
        paymentId: params.razorpayPaymentId || `mock_${Date.now()}`,
        transactionId: `tx_${params.razorpayPaymentId || Date.now()}`,
        isMock: true,
        message: '[TEST MODE] Simulated test payment verified successfully.',
      };
    }

    return {
      verified: false,
      isMock: true,
      message: 'Unrecognized test payment parameters.',
    };
  }

  verifyWebhook(_payload: string, _signature: string): boolean {
    return true;
  }
}

/**
 * Razorpay Payment Adapter
 * Communicates with Razorpay Standard Checkout & Payment Links when valid API keys exist
 */
export class RazorpayPaymentAdapter implements IPaymentAdapter {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult> {
    if (!this.keyId || !this.keySecret || this.keyId.includes('placeholder')) {
      // Fallback to mock adapter if credentials are placeholder
      const mockAdapter = new MockPaymentAdapter();
      return mockAdapter.createPayment(params);
    }

    try {
      const basicAuth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // in smallest currency unit (cents / paise)
          currency: params.currency || 'USD',
          accept_partial: false,
          reference_id: `${params.orderNumber}-${params.isDeposit ? 'DEP' : 'BAL'}-${Date.now()}`,
          description: params.description,
          customer: {
            name: params.customerName,
            email: params.customerEmail,
            contact: params.customerPhone,
          },
          notify: {
            sms: true,
            email: true,
          },
          reminder_enable: true,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/callback?orderId=${params.orderId}`,
          callback_method: 'get',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.description || 'Failed to generate Razorpay payment link');
      }

      return {
        success: true,
        paymentId: data.id,
        paymentUrl: data.short_url,
        isMock: false,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown payment error';
      // Fallback safely to mock if live request fails
      const fallback = new MockPaymentAdapter();
      const result = await fallback.createPayment(params);
      result.message = `[TEST MODE - FALLBACK: ${errorMsg}]`;
      return result;
    }
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    if (params.isMock || !this.keySecret || this.keySecret.includes('placeholder')) {
      const mock = new MockPaymentAdapter();
      return mock.verifyPayment(params);
    }

    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return {
          verified: false,
          isMock: false,
          message: 'Missing Razorpay signature verification parameters',
        };
      }

      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      const verified = generatedSignature === razorpaySignature;
      return {
        verified,
        paymentId: razorpayPaymentId,
        transactionId: razorpayPaymentId,
        isMock: false,
        message: verified ? 'Payment verified successfully via Razorpay signature.' : 'Invalid payment signature.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Verification error';
      return {
        verified: false,
        isMock: false,
        message: errorMsg,
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return expectedSignature === signature;
  }
}

/**
 * Return payment adapter depending on environment
 */
export function getPaymentAdapter(): IPaymentAdapter {
  const mode = process.env.PAYMENT_MODE || 'test';
  const hasLiveKeys =
    process.env.RAZORPAY_KEY_ID &&
    !process.env.RAZORPAY_KEY_ID.includes('placeholder') &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_SECRET.includes('placeholder');

  if (mode === 'live' && hasLiveKeys) {
    return new RazorpayPaymentAdapter();
  }

  return new MockPaymentAdapter();
}

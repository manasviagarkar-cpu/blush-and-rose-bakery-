import crypto from 'crypto';

export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in INR
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
  message?: string;
}

export interface PaymentVerificationParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  paymentId?: string;
  transactionId?: string;
  message: string;
}

export interface IPaymentAdapter {
  createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
  verifyWebhook(payload: string, signature: string): boolean;
}

/**
 * Razorpay Payment Adapter
 * Communicates with Razorpay Payment Links API using server-side credentials.
 * Currency is always INR.
 *
 * In PAYMENT_MODE=test, this uses test credentials (rzp_test_*) which process
 * real Razorpay test flows — no fake client-side buttons.
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
    if (!this.keyId || !this.keySecret) {
      throw new Error(
        'Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      );
    }

    const basicAuth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // paise
        currency: 'INR',
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
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/checkout?orderId=${params.orderId}`,
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
    };
  }

  async verifyPayment(
    params: PaymentVerificationParams
  ): Promise<PaymentVerificationResult> {
    if (!this.keySecret) {
      return {
        verified: false,
        message: 'Razorpay key secret is not configured.',
      };
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return {
        verified: false,
        message: 'Missing required Razorpay verification parameters.',
      };
    }

    const generatedSignatureHex = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Timing-safe comparison
    const generatedBuffer = Buffer.from(generatedSignatureHex, 'hex');
    let signatureBuffer: Buffer;
    try {
      signatureBuffer = Buffer.from(razorpaySignature, 'hex');
    } catch {
      return { verified: false, message: 'Invalid signature format.' };
    }

    if (
      generatedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(generatedBuffer, signatureBuffer)
    ) {
      return {
        verified: false,
        paymentId: razorpayPaymentId,
        message: 'Payment signature verification failed.',
      };
    }

    return {
      verified: true,
      paymentId: razorpayPaymentId,
      transactionId: razorpayPaymentId,
      message: 'Payment verified successfully via Razorpay signature.',
    };
  }

  /**
   * Verify Razorpay webhook signature using timing-safe comparison.
   */
  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return false;

    const expectedHex = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    try {
      const expectedBuffer = Buffer.from(expectedHex, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');
      return (
        expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
      );
    } catch {
      return false;
    }
  }
}

/**
 * Return the payment adapter.
 *
 * Always returns RazorpayPaymentAdapter.
 * In development with NODE_ENV=development, missing credentials will cause
 * createPayment() to throw — which is intentional. Set test credentials in .env.
 *
 * PAYMENT_MODE=test → use rzp_test_* credentials (no mock, real Razorpay test flow)
 * PAYMENT_MODE=live → use rzp_live_* credentials
 *
 * Mock payment is not available in any environment via this adapter.
 */
export function getPaymentAdapter(): IPaymentAdapter {
  return new RazorpayPaymentAdapter();
}

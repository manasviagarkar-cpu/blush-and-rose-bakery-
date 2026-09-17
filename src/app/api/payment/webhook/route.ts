import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { getPaymentAdapter } from '@/lib/payment';

/**
 * Razorpay Webhook Handler
 *
 * Configure in Razorpay Dashboard:
 *   URL: https://yourdomain.com/api/payment/webhook
 *   Secret: (same value as RAZORPAY_WEBHOOK_SECRET env var)
 *   Events: payment_link.paid
 *
 * This endpoint is the authoritative source of payment confirmation.
 * Orders are NEVER confirmed from browser redirects alone.
 */
export async function POST(req: Request) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body.' }, { status: 400 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 });
  }

  // Verify webhook signature using timing-safe comparison
  const adapter = getPaymentAdapter();
  const isValid = adapter.verifyWebhook(rawBody, signature);
  if (!isValid) {
    console.warn('Razorpay webhook: invalid signature received');
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  let event: {
    event: string;
    payload?: {
      payment_link?: {
        entity?: {
          id?: string;
          reference_id?: string;
          amount_paid?: number;
          currency?: string;
          status?: string;
        };
      };
      payment?: {
        entity?: {
          id?: string;
          amount?: number;
          currency?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  // Only handle payment_link.paid events
  if (event.event !== 'payment_link.paid') {
    return NextResponse.json({ received: true, skipped: true });
  }

  const paymentLinkEntity = event.payload?.payment_link?.entity;
  const paymentEntity = event.payload?.payment?.entity;

  const razorpayPaymentLinkId = paymentLinkEntity?.id;
  const referenceId = paymentLinkEntity?.reference_id; // e.g. "BR26-1234-DEP-1234567890"
  const razorpayPaymentId = paymentEntity?.id;
  const amountPaidPaise = paymentEntity?.amount ?? paymentLinkEntity?.amount_paid ?? 0;
  const currency = paymentEntity?.currency ?? paymentLinkEntity?.currency ?? 'INR';

  if (!referenceId || !razorpayPaymentId) {
    console.warn('Webhook: missing reference_id or payment id in payload');
    return NextResponse.json({ received: true, skipped: true });
  }

  // Extract order number from reference_id (format: "BR26-1234-DEP-timestamp")
  const orderNumberMatch = referenceId.match(/^(BR\d{2}-\d+)/);
  if (!orderNumberMatch) {
    console.warn('Webhook: could not parse order number from reference_id:', referenceId);
    return NextResponse.json({ received: true, skipped: true });
  }
  const orderNumber = orderNumberMatch[1];

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: true },
  });

  if (!order) {
    console.warn('Webhook: order not found for orderNumber:', orderNumber);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Idempotency: skip if this payment was already recorded
  const alreadyRecorded = order.payments.some(
    (p) => p.status === 'SUCCESS' && p.transactionId === razorpayPaymentId
  );
  if (alreadyRecorded) {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  // Verify the paid amount matches the expected deposit (in paise)
  const expectedPaise = Math.round(order.depositAmount * 100);
  if (currency !== 'INR' || amountPaidPaise !== expectedPaise) {
    console.error(
      `Webhook amount mismatch: expected ₹${order.depositAmount} (${expectedPaise} paise, INR), ` +
      `received ${amountPaidPaise} paise ${currency} for order ${orderNumber}`
    );
    // Record a failed payment and do NOT confirm the order
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: amountPaidPaise / 100,
        currency,
        paymentMethod: 'RAZORPAY',
        transactionId: razorpayPaymentId,
        status: 'FAILED',
        isDeposit: true,
        notes: `Webhook amount/currency mismatch. Expected ₹${order.depositAmount} INR, got ${amountPaidPaise / 100} ${currency}`,
      },
    });
    return NextResponse.json({ received: true, error: 'Amount mismatch' }, { status: 200 });
  }

  // Record the successful payment
  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.depositAmount,
      currency: 'INR',
      paymentMethod: 'RAZORPAY',
      transactionId: razorpayPaymentId,
      status: 'SUCCESS',
      isDeposit: true,
      notes: `Razorpay webhook confirmed. Payment Link ID: ${razorpayPaymentLinkId}`,
    },
  });

  // Confirm the order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUSES.CONFIRMED,
      paymentStatus: 'DEPOSIT_PAID',
      statusHistory: {
        create: {
          fromStatus: order.status,
          toStatus: ORDER_STATUSES.CONFIRMED,
          notes: `Deposit of ₹${order.depositAmount} confirmed via Razorpay webhook.`,
          changedBy: 'SYSTEM',
        },
      },
    },
  });

  // Notify baker
  await prisma.notification.create({
    data: {
      orderId: order.id,
      type: 'DEPOSIT_PAID',
      title: `Deposit Confirmed #${order.orderNumber}`,
      message: `${order.customerName} paid ₹${order.depositAmount} deposit via Razorpay. Order is now Confirmed.`,
    },
  });

  return NextResponse.json({ received: true, confirmed: true });
}

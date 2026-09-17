import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    // isMock is intentionally NOT accepted from the public client.
    // amount and status are NOT trusted from the browser — we use stored values.

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature).' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Idempotency: if this Razorpay payment ID was already recorded as SUCCESS, return early
    const existingSuccess = order.payments.find(
      (p) => p.status === 'SUCCESS' && p.transactionId === razorpayPaymentId
    );
    if (existingSuccess) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: 'This payment has already been verified and recorded.',
      });
    }

    // Verify signature server-side using timing-safe HMAC
    const adapter = getPaymentAdapter();
    const verification = await adapter.verifyPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!verification.verified) {
      // Record the failed attempt without marking the order paid
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.depositAmount,
          currency: 'INR',
          paymentMethod: 'RAZORPAY',
          transactionId: razorpayPaymentId,
          status: 'FAILED',
          isDeposit: true,
          notes: `Signature verification failed: ${verification.message}`,
        },
      });

      return NextResponse.json(
        { error: 'Payment verification failed.', message: verification.message },
        { status: 400 }
      );
    }

    // Record verified payment using the order's stored depositAmount (not browser-supplied amount)
    const paymentRecord = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.depositAmount,
        currency: 'INR',
        paymentMethod: 'RAZORPAY',
        transactionId: verification.transactionId,
        status: 'SUCCESS',
        isDeposit: true,
        notes: `Razorpay payment verified. Razorpay Order ID: ${razorpayOrderId}`,
      },
    });

    // Update order status to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUSES.CONFIRMED,
        paymentStatus: 'DEPOSIT_PAID',
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: ORDER_STATUSES.CONFIRMED,
            notes: `Deposit of ₹${order.depositAmount} received via Razorpay. Order confirmed.`,
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
        title: `Deposit Paid #${order.orderNumber}`,
        message: `${order.customerName} completed deposit payment of ₹${order.depositAmount} via Razorpay. Order is now Confirmed!`,
      },
    });

    return NextResponse.json({
      success: true,
      payment: paymentRecord,
      order: updatedOrder,
      message: 'Deposit verified and order confirmed successfully.',
    });
  } catch (err: unknown) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ error: 'Server payment verification error.' }, { status: 500 });
  }
}

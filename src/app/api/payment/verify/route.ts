import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      paymentId,
      amount,
      status = 'SUCCESS',
      isMock = false,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Server-side payment verification via adapter
    const adapter = getPaymentAdapter();
    const verification = await adapter.verifyPayment({
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || paymentId,
      razorpaySignature,
      isMock: Boolean(isMock),
    });

    if (!verification.verified || status !== 'SUCCESS') {
      // Record failed attempt
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: amount || order.depositAmount,
          currency: 'USD',
          paymentMethod: isMock ? 'MOCK_TEST' : 'RAZORPAY',
          transactionId: verification.transactionId || `failed_${Date.now()}`,
          status: 'FAILED',
          isDeposit: true,
          notes: verification.message || 'Payment verification failed',
        },
      });

      return NextResponse.json(
        { error: 'Payment verification failed', message: verification.message },
        { status: 400 }
      );
    }

    // Duplicate payment protection
    const existingSuccess = order.payments.some(
      (p) => p.status === 'SUCCESS' && p.transactionId === verification.transactionId
    );

    if (existingSuccess) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: 'This payment has already been verified and recorded.',
      });
    }

    // Record verified payment
    const paymentRecord = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: amount || order.depositAmount,
        currency: 'USD',
        paymentMethod: isMock ? 'MOCK_TEST' : 'RAZORPAY',
        transactionId: verification.transactionId,
        status: 'SUCCESS',
        isDeposit: true,
        notes: isMock ? '[TEST MODE] Simulated deposit payment' : 'Verified via Razorpay',
      },
    });

    // Update order status: Deposit paid orders are now officially CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUSES.CONFIRMED,
        paymentStatus: 'DEPOSIT_PAID',
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: ORDER_STATUSES.CONFIRMED,
            notes: `Deposit of $${amount || order.depositAmount} received (${isMock ? 'Test Mode' : 'Razorpay'}). Order confirmed.`,
            changedBy: 'SYSTEM',
          },
        },
      },
    });

    // Create Notification for baker
    await prisma.notification.create({
      data: {
        orderId: order.id,
        type: 'DEPOSIT_PAID',
        title: `Deposit Paid #${order.orderNumber}`,
        message: `${order.customerName} completed deposit payment of $${amount || order.depositAmount}. Order is now Confirmed!`,
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
    return NextResponse.json({ error: 'Server payment verification error' }, { status: 500 });
  }
}

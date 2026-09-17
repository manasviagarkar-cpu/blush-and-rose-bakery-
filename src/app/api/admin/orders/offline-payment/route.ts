import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ORDER_STATUSES } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, amount, paymentMethod = 'CASH', notes } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Order ID and amount are required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Record payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: Number(amount),
        currency: 'INR',
        paymentMethod,
        transactionId: `offline_${paymentMethod.toLowerCase()}_${Date.now()}`,
        status: 'SUCCESS',
        isDeposit: order.paymentStatus === 'PENDING',
        notes: notes || `Offline payment recorded by ${session.name}`,
      },
    });

    // Calculate total successful payments so far
    const allSuccessful = order.payments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0) + Number(amount);

    let newPaymentStatus = order.paymentStatus;
    let newOrderStatus = order.status;

    if (allSuccessful >= order.totalAmount) {
      newPaymentStatus = 'FULLY_PAID';
    } else if (allSuccessful >= order.depositAmount) {
      newPaymentStatus = 'DEPOSIT_PAID';
      if (order.status === ORDER_STATUSES.DEPOSIT_PENDING || order.status === ORDER_STATUSES.NEW_REQUEST) {
        newOrderStatus = ORDER_STATUSES.CONFIRMED;
      }
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newPaymentStatus,
        status: newOrderStatus,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: newOrderStatus,
            notes: `Offline payment of ₹${amount} (${paymentMethod}) recorded by ${session.name}`,
            changedBy: 'BAKER',
          },
        },
      },
      include: {
        items: true,
        customCakeRequest: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    console.error('Offline payment error:', err);
    return NextResponse.json({ error: 'Failed to record offline payment' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ORDER_STATUSES } from '@/lib/constants';
import { calculatePaymentBreakdown } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, totalAmount, bakerNotes } = await req.json();

    if (!orderId || !totalAmount) {
      return NextResponse.json({ error: 'Order ID and totalAmount are required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customCakeRequest: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const breakdown = calculatePaymentBreakdown(Number(totalAmount), 40);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: breakdown.total,
        depositAmount: breakdown.deposit,
        balanceAmount: breakdown.balance,
        bakerNotes,
        status: ORDER_STATUSES.PRICE_SENT,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: ORDER_STATUSES.PRICE_SENT,
            notes: `Price quote of $${breakdown.total} (40% deposit: $${breakdown.deposit}) sent to customer for review`,
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
    console.error('Quote error:', err);
    return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 });
  }
}

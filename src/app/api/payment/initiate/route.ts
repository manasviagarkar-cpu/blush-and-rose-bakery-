import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const { orderId, isDeposit = true } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const amount = isDeposit ? order.depositAmount : order.balanceAmount;

    const adapter = getPaymentAdapter();
    const result = await adapter.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      description: `${isDeposit ? 'Deposit' : 'Remaining balance'} payment for #${order.orderNumber}`,
      isDeposit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Payment initiation error:', err);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}

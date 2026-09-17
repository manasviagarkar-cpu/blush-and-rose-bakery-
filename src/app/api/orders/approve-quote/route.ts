import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const { orderId, token } = await req.json();

    if (!orderId || !token) {
      return NextResponse.json({ error: 'Order ID and tracking token are required.' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
        trackingToken: token,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Update status to Deposit Pending
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        customerApproved: true,
        status: ORDER_STATUSES.DEPOSIT_PENDING,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: ORDER_STATUSES.DEPOSIT_PENDING,
            notes: 'Customer reviewed and approved the design and price quotation',
            changedBy: 'CUSTOMER',
          },
        },
      },
      include: {
        items: true,
        customCakeRequest: true,
        payments: true,
        statusHistory: true,
      },
    });

    // Notify baker
    await prisma.notification.create({
      data: {
        orderId: order.id,
        type: 'PRICE_APPROVAL_REQUIRED',
        title: `Quote Approved for #${order.orderNumber}`,
        message: `${order.customerName} approved the design and quotation of ₹${order.totalAmount}. Deposit pending.`,
      },
    });

    // Generate deposit payment link
    const adapter = getPaymentAdapter();
    const paymentResult = await adapter.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.depositAmount,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      description: `Deposit payment for custom cake #${order.orderNumber}`,
      isDeposit: true,
    });

    return NextResponse.json({
      success: true,
      order: updated,
      paymentUrl: paymentResult.paymentUrl,
    });
  } catch (err: unknown) {
    console.error('Approve quote error:', err);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, pickupDate, pickupTimeSlot } = await req.json();

    if (!orderId || !pickupDate || !pickupTimeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        pickupDate,
        pickupTimeSlot,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            notes: `Pickup rescheduled from ${order.pickupDate} (${order.pickupTimeSlot}) to ${pickupDate} (${pickupTimeSlot}) by ${session.name}`,
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
    console.error('Reschedule error:', err);
    return NextResponse.json({ error: 'Failed to reschedule order' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, bakerNotes } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { bakerNotes },
      include: {
        items: true,
        customCakeRequest: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    console.error('Notes update error:', err);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, internalNotes } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { internalNotes },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to update customer notes' }, { status: 500 });
  }
}

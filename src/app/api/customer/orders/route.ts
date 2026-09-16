import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { customerEmail: email.trim().toLowerCase() },
      include: {
        items: true,
        customCakeRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to find orders' }, { status: 500 });
  }
}

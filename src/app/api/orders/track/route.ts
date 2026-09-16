import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');

    if (!orderId || !token) {
      return NextResponse.json(
        { error: 'Both orderId/orderNumber and tracking token are required.' },
        { status: 400 }
      );
    }

    const found = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
        trackingToken: token,
      },
      include: {
        items: true,
        customCakeRequest: true,
        payments: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!found) {
      return NextResponse.json(
        { error: 'No order found matching this reference and tracking token.' },
        { status: 404 }
      );
    }

    const order = {
      ...found,
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
      items: found.items.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
      payments: found.payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      statusHistory: found.statusHistory.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      customDetails: found.customCakeRequest
        ? {
            size: found.customCakeRequest.size,
            shape: found.customCakeRequest.shape,
            tiers: found.customCakeRequest.tiers,
            flavor: found.customCakeRequest.flavor,
            filling: found.customCakeRequest.filling,
            frostingType: found.customCakeRequest.frostingType,
            frostingColor: found.customCakeRequest.frostingColor,
            designStyle: found.customCakeRequest.designStyle,
            toppings: found.customCakeRequest.toppings,
            isEggless: found.customCakeRequest.isEggless,
            occasion: found.customCakeRequest.occasion,
            cakeMessage: found.customCakeRequest.cakeMessage || '',
            specialInstructions: found.customCakeRequest.specialInstructions || '',
            allergies: found.customCakeRequest.allergies || '',
            referenceImageUrl: found.customCakeRequest.referenceImageUrl || undefined,
          }
        : null,
    };

    return NextResponse.json({ order });
  } catch (err: unknown) {
    console.error('Track API error:', err);
    return NextResponse.json({ error: 'Tracking lookup failed' }, { status: 500 });
  }
}

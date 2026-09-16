import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OrderDetailClient } from './OrderDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const orderDb = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      items: true,
      customCakeRequest: true,
      payments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!orderDb) {
    notFound();
  }

  const order = {
    ...orderDb,
    createdAt: orderDb.createdAt.toISOString(),
    updatedAt: orderDb.updatedAt.toISOString(),
    items: orderDb.items.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
    payments: orderDb.payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    statusHistory: orderDb.statusHistory.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
    customDetails: orderDb.customCakeRequest
      ? {
          size: orderDb.customCakeRequest.size,
          shape: orderDb.customCakeRequest.shape,
          tiers: orderDb.customCakeRequest.tiers,
          flavor: orderDb.customCakeRequest.flavor,
          filling: orderDb.customCakeRequest.filling,
          frostingType: orderDb.customCakeRequest.frostingType,
          frostingColor: orderDb.customCakeRequest.frostingColor,
          designStyle: orderDb.customCakeRequest.designStyle,
          toppings: orderDb.customCakeRequest.toppings,
          isEggless: orderDb.customCakeRequest.isEggless,
          occasion: orderDb.customCakeRequest.occasion,
          cakeMessage: orderDb.customCakeRequest.cakeMessage || '',
          specialInstructions: orderDb.customCakeRequest.specialInstructions || '',
          allergies: orderDb.customCakeRequest.allergies || '',
          referenceImageUrl: orderDb.customCakeRequest.referenceImageUrl || undefined,
        }
      : null,
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <OrderDetailClient initialOrder={order as any} />
    </div>
  );
}

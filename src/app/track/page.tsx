import React from 'react';
import { prisma } from '@/lib/db';
import { TrackingClient } from './TrackingClient';

interface Props {
  searchParams: Promise<{
    orderId?: string;
    token?: string;
  }>;
}

export default async function TrackOrderPage({ searchParams }: Props) {
  const { orderId, token } = await searchParams;

  let initialOrder = null;

  if (orderId && token) {
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

    if (found) {
      initialOrder = {
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
    }
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto 2.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Real-Time Bakery Status
        </span>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.5rem' }}>
          Track Your Order
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Follow your cake from recipe review to the decorating table and final packaging for pickup.
        </p>
      </div>

      <TrackingClient
        initialOrder={initialOrder as any}
        defaultOrderId={orderId || ''}
        defaultToken={token || ''}
      />
    </div>
  );
}

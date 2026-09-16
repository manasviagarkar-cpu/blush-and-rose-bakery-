import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OrderListClient } from './OrderListClient';

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const ordersDb = await prisma.order.findMany({
    include: {
      items: true,
      customCakeRequest: true,
      payments: true,
    },
    orderBy: { pickupDate: 'asc' },
  });

  const orders = ordersDb.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
    payments: o.payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  }));

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Order Management
        </span>
        <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
          All Bakery Orders & Custom Bookings
        </h1>
      </div>

      <OrderListClient initialOrders={orders} />
    </div>
  );
}

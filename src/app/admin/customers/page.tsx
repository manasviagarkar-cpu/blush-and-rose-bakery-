import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CustomersClient } from './CustomersClient';

export default async function AdminCustomersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const customersDb = await prisma.customer.findMany({
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          pickupDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const customers = customersDb.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    orders: c.orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
  }));

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Client Relationship
        </span>
        <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
          Customer Records & Order History
        </h1>
      </div>

      <CustomersClient initialCustomers={customers} />
    </div>
  );
}

import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CalendarClient } from './CalendarClient';

export default async function AdminCalendarPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
  const holidayDates: string[] = JSON.parse(profile?.holidayDates || '[]');

  const ordersDb = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      pickupDate: true,
      pickupTimeSlot: true,
      status: true,
      totalAmount: true,
      type: true,
    },
    orderBy: { pickupDate: 'asc' },
  });

  const slotsDb = await prisma.pickupSlot.findMany();

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Capacity & Scheduling
        </span>
        <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
          Pickup Schedule & Calendar
        </h1>
      </div>

      <CalendarClient
        initialOrders={ordersDb}
        initialHolidays={holidayDates}
        initialSlots={slotsDb}
        defaultCapacity={profile?.defaultSlotCapacity || 4}
      />
    </div>
  );
}

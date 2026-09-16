import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { DashboardClient } from './DashboardClient';

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Fetch metrics in parallel
  const [
    todayOrders,
    tomorrowOrders,
    awaitingReviewOrders,
    awaitingApprovalOrders,
    depositPendingOrders,
    inPrepOrders,
    readyOrders,
    allOrders,
    products,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { pickupDate: todayStr },
      include: { items: true, customCakeRequest: true },
      orderBy: { pickupTimeSlot: 'asc' },
    }),
    prisma.order.findMany({
      where: { pickupDate: tomorrowStr },
      include: { items: true, customCakeRequest: true },
      orderBy: { pickupTimeSlot: 'asc' },
    }),
    prisma.order.findMany({
      where: { status: ORDER_STATUSES.AWAITING_BAKER_REVIEW },
      include: { customCakeRequest: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { status: ORDER_STATUSES.PRICE_SENT },
          { status: ORDER_STATUSES.AWAITING_CUSTOMER_APPROVAL },
        ],
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { status: ORDER_STATUSES.DEPOSIT_PENDING },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { status: ORDER_STATUSES.IN_PREPARATION },
      orderBy: { pickupDate: 'asc' },
    }),
    prisma.order.findMany({
      where: { status: ORDER_STATUSES.READY_FOR_PICKUP },
      orderBy: { pickupDate: 'asc' },
    }),
    prisma.order.findMany({
      include: { items: true, customCakeRequest: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.product.findMany({
      select: { id: true, name: true, price: true },
    }),
  ]);

  // Serializing for client
  const serializeOrder = (o: any) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: (o.items || []).map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
  });

  const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalDepositsCollected = allOrders.reduce((sum, o) => {
    const paid = o.payments
      ?.filter((p) => p.status === 'SUCCESS')
      .reduce((s, p) => s + p.amount, 0);
    return sum + (paid || 0);
  }, 0);

  return (
    <DashboardClient
      todayPickups={todayOrders.map(serializeOrder)}
      tomorrowPickups={tomorrowOrders.map(serializeOrder)}
      awaitingReview={awaitingReviewOrders.map(serializeOrder)}
      awaitingApproval={awaitingApprovalOrders.map(serializeOrder)}
      depositPending={depositPendingOrders.map(serializeOrder)}
      inPrep={inPrepOrders.map(serializeOrder)}
      readyForPickup={readyOrders.map(serializeOrder)}
      recentOrders={allOrders.slice(0, 10).map(serializeOrder)}
      products={products}
      metrics={{
        totalOrders: allOrders.length,
        totalSales,
        totalDepositsCollected,
        todayCount: todayOrders.length,
        tomorrowCount: tomorrowOrders.length,
      }}
    />
  );
}

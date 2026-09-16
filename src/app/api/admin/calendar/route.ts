import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

// GET calendar data: orders, slots, blocked dates
export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM

    const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
    const holidayDates: string[] = JSON.parse(profile?.holidayDates || '[]');

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        pickupDate: true,
        pickupTimeSlot: true,
        status: true,
        totalAmount: true,
        type: true,
      },
      orderBy: { pickupDate: 'asc' },
    });

    const slots = await prisma.pickupSlot.findMany({
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ orders, slots, holidayDates, defaultCapacity: profile?.defaultSlotCapacity || 4 });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}

// POST block/unblock date or set slot capacity
export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, date, timeSlot, capacity, isBlocked } = body;

    if (action === 'TOGGLE_DATE_BLOCK') {
      const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
      const currentHolidays: string[] = JSON.parse(profile?.holidayDates || '[]');

      let updatedHolidays: string[];
      if (currentHolidays.includes(date)) {
        updatedHolidays = currentHolidays.filter((d) => d !== date);
      } else {
        updatedHolidays = [...currentHolidays, date];
      }

      await prisma.bakeryProfile.update({
        where: { id: 'default' },
        data: { holidayDates: JSON.stringify(updatedHolidays) },
      });

      return NextResponse.json({ success: true, holidayDates: updatedHolidays });
    }

    if (action === 'SET_SLOT_CAPACITY') {
      const slot = await prisma.pickupSlot.upsert({
        where: {
          date_timeSlot: { date, timeSlot },
        },
        update: {
          capacity: Number(capacity),
          isBlocked: Boolean(isBlocked),
        },
        create: {
          date,
          timeSlot,
          capacity: Number(capacity),
          isBlocked: Boolean(isBlocked),
        },
      });

      return NextResponse.json({ success: true, slot });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Calendar update error:', err);
    return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
  }
}

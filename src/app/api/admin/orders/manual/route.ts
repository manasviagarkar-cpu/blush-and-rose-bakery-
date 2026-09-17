import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ORDER_STATUSES } from '@/lib/constants';
import { generateOrderNumber, generateTrackingToken, calculatePaymentBreakdown } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail = 'walkin@blushandrosebakery.com',
      productName,
      price,
      pickupDate,
      pickupTimeSlot,
      notes,
    } = body;

    if (!customerName || !customerPhone || !productName || !price || !pickupDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();
    const trackingToken = generateTrackingToken();
    const breakdown = calculatePaymentBreakdown(price, 40);

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || `customer_${Date.now()}@example.com`,
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        trackingToken,
        type: 'STANDARD',
        customerName,
        customerPhone,
        customerEmail: customer.email,
        customerId: customer.id,
        status: ORDER_STATUSES.CONFIRMED,
        pickupDate,
        pickupTimeSlot,
        totalAmount: price,
        depositAmount: breakdown.deposit,
        balanceAmount: breakdown.balance,
        paymentStatus: 'DEPOSIT_PAID',
        customerNotes: notes,
        bakerNotes: 'Created manually by baker in atelier',
        customerApproved: true,
        items: {
          create: [
            {
              productName,
              unitPrice: price,
              quantity: 1,
              totalPrice: price,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: breakdown.deposit,
              currency: 'INR',
              paymentMethod: 'CASH',
              status: 'SUCCESS',
              isDeposit: true,
              notes: 'Deposit received in-person / manual entry',
            },
          ],
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: ORDER_STATUSES.CONFIRMED,
              notes: `Manual order created by ${session.name}`,
              changedBy: 'BAKER',
            },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    console.error('Manual order error:', err);
    return NextResponse.json({ error: 'Failed to create manual order' }, { status: 500 });
  }
}

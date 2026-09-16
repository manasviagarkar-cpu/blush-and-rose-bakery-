import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { generateOrderNumber, generateTrackingToken, calculatePaymentBreakdown, isValidBookingDate } from '@/lib/utils';
import { validateStandardCheckout } from '@/lib/validators';
import { getPaymentAdapter } from '@/lib/payment';
import { CartItem } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      pickupDate,
      pickupTimeSlot,
      customerNotes,
      items,
      depositPercentage = 40,
    } = body;

    // 1. Validation
    const errors = validateStandardCheckout({
      customerName,
      customerPhone,
      customerEmail,
      pickupDate,
      pickupTimeSlot,
      itemCount: items?.length || 0,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].message }, { status: 400 });
    }

    // 2. Validate bakery profile rules (advance notice, holidays)
    const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
    const minAdvanceDays = profile?.minAdvanceNoticeDays || 2;
    const holidayDates: string[] = JSON.parse(profile?.holidayDates || '[]');

    const dateCheck = isValidBookingDate(pickupDate, minAdvanceDays, holidayDates);
    if (!dateCheck.valid) {
      return NextResponse.json({ error: dateCheck.reason }, { status: 400 });
    }

    // 3. Compute totals
    const totalAmount = items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );
    const breakdown = calculatePaymentBreakdown(totalAmount, depositPercentage);

    const orderNumber = generateOrderNumber();
    const trackingToken = generateTrackingToken();

    // 4. Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: customerEmail.trim().toLowerCase() },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim().toLowerCase(),
        },
      });
    }

    // 5. Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        trackingToken,
        type: 'STANDARD',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerId: customer.id,
        status: ORDER_STATUSES.DEPOSIT_PENDING,
        pickupDate,
        pickupTimeSlot,
        totalAmount: breakdown.total,
        depositAmount: breakdown.deposit,
        balanceAmount: breakdown.balance,
        paymentStatus: 'PENDING',
        customerNotes,
        customerApproved: true,
        items: {
          create: items.map((i: CartItem) => ({
            productId: i.productId.startsWith('cart_') ? null : i.productId,
            productName: i.name,
            variantName: i.variantName || null,
            unitPrice: i.price,
            quantity: i.quantity,
            totalPrice: i.price * i.quantity,
            cakeMessage: i.cakeMessage || null,
            specialInstructions: i.specialInstructions || null,
          })),
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: ORDER_STATUSES.NEW_REQUEST,
              notes: 'Pre-order basket submitted by customer',
              changedBy: 'CUSTOMER',
            },
            {
              fromStatus: ORDER_STATUSES.NEW_REQUEST,
              toStatus: ORDER_STATUSES.DEPOSIT_PENDING,
              notes: `Awaiting ${depositPercentage}% deposit payment`,
              changedBy: 'SYSTEM',
            },
          ],
        },
      },
    });

    // 6. Create in-app notification for baker
    await prisma.notification.create({
      data: {
        orderId: order.id,
        type: 'REQUEST_RECEIVED',
        title: `New Order #${order.orderNumber}`,
        message: `${customerName} placed an order for ${pickupDate} (${items.length} items, total: $${totalAmount}).`,
      },
    });

    // 7. Initiate payment link via Payment Adapter
    const paymentAdapter = getPaymentAdapter();
    const paymentResult = await paymentAdapter.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.depositAmount,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      description: `Blush & Rose Bakery deposit for Order #${order.orderNumber}`,
      isDeposit: true,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingToken: order.trackingToken,
      paymentUrl: paymentResult.paymentUrl,
      isMock: paymentResult.isMock,
    });
  } catch (error: unknown) {
    console.error('Checkout API error:', error);
    const msg = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

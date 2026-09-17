import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { generateOrderNumber, generateTrackingToken, calculatePaymentBreakdown, isValidBookingDate } from '@/lib/utils';
import { validateStandardCheckout } from '@/lib/validators';
import { getPaymentAdapter } from '@/lib/payment';

interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  cakeMessage?: string | null;
  specialInstructions?: string | null;
}

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
    } = body;

    // 1. Validate contact and required fields (items count)
    const errors = validateStandardCheckout({
      customerName,
      customerPhone,
      customerEmail,
      pickupDate,
      pickupTimeSlot,
      itemCount: Array.isArray(items) ? items.length : 0,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].message }, { status: 400 });
    }

    // 2. Validate that items array has valid structure
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    for (const item of items as CheckoutItemInput[]) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Invalid item in cart: missing productId.' }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return NextResponse.json({ error: 'Item quantity must be between 1 and 99.' }, { status: 400 });
      }
    }

    // 3. Validate bakery profile rules (advance notice, holidays)
    const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
    const minAdvanceDays = profile?.minAdvanceNoticeDays ?? 2;
    const holidayDates: string[] = JSON.parse(profile?.holidayDates ?? '[]');
    const depositPercentage = profile?.depositPercentage ?? 40;

    const dateCheck = isValidBookingDate(pickupDate, minAdvanceDays, holidayDates);
    if (!dateCheck.valid) {
      return NextResponse.json({ error: dateCheck.reason }, { status: 400 });
    }

    // 4. Check slot capacity
    const existingSlot = await prisma.pickupSlot.findUnique({
      where: { date_timeSlot: { date: pickupDate, timeSlot: pickupTimeSlot } },
    });
    const slotCapacity = existingSlot?.capacity ?? (profile?.defaultSlotCapacity ?? 4);
    const bookedCount = existingSlot?.bookedCount ?? 0;

    if (existingSlot?.isBlocked) {
      return NextResponse.json(
        { error: 'The selected pickup slot is blocked. Please choose a different time.' },
        { status: 409 }
      );
    }
    if (bookedCount >= slotCapacity) {
      return NextResponse.json(
        { error: 'The selected pickup slot is fully booked. Please choose a different time or date.' },
        { status: 409 }
      );
    }

    // 5. Load product and variant prices from DB — browser prices are ignored
    const resolvedItems: Array<{
      productId: string | null;
      productName: string;
      variantName: string | null;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      cakeMessage: string | null;
      specialInstructions: string | null;
    }> = [];

    for (const item of items as CheckoutItemInput[]) {
      const qty = Number(item.quantity);

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (!product.isAvailable) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not currently available.` },
          { status: 400 }
        );
      }

      let unitPrice = product.price;
      let variantName: string | null = null;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `Variant not found for product "${product.name}".` },
            { status: 400 }
          );
        }
        if (!variant.isAvailable) {
          return NextResponse.json(
            { error: `Variant "${variant.name}" of "${product.name}" is not available.` },
            { status: 400 }
          );
        }
        unitPrice = variant.price;
        variantName = variant.name;
      }

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        variantName,
        unitPrice,
        quantity: qty,
        totalPrice: unitPrice * qty,
        cakeMessage: item.cakeMessage ?? null,
        specialInstructions: item.specialInstructions ?? null,
      });
    }

    // 6. Calculate totals on the server
    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero.' }, { status: 400 });
    }

    const breakdown = calculatePaymentBreakdown(totalAmount, depositPercentage);
    const orderNumber = generateOrderNumber();
    const trackingToken = generateTrackingToken();

    // 7. Find or create customer
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

    // 8. Create Order
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
          create: resolvedItems,
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: ORDER_STATUSES.NEW_REQUEST,
              notes: 'Order submitted by customer',
              changedBy: 'CUSTOMER',
            },
            {
              fromStatus: ORDER_STATUSES.NEW_REQUEST,
              toStatus: ORDER_STATUSES.DEPOSIT_PENDING,
              notes: `Awaiting ${depositPercentage}% deposit payment (₹${breakdown.deposit})`,
              changedBy: 'SYSTEM',
            },
          ],
        },
      },
    });

    // 9. Increment slot capacity atomically
    await prisma.pickupSlot.upsert({
      where: { date_timeSlot: { date: pickupDate, timeSlot: pickupTimeSlot } },
      update: { bookedCount: { increment: 1 } },
      create: {
        date: pickupDate,
        timeSlot: pickupTimeSlot,
        capacity: slotCapacity,
        bookedCount: 1,
      },
    });

    // 10. In-app notification for baker
    await prisma.notification.create({
      data: {
        orderId: order.id,
        type: 'REQUEST_RECEIVED',
        title: `New Order #${order.orderNumber}`,
        message: `${customerName} placed an order for ${pickupDate} (${resolvedItems.length} item(s), total: ₹${totalAmount}).`,
      },
    });

    // 11. Initiate Razorpay payment link
    const paymentAdapter = getPaymentAdapter();
    let paymentUrl: string | null = null;

    try {
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
      paymentUrl = paymentResult.paymentUrl;
    } catch (paymentErr: unknown) {
      const msg = paymentErr instanceof Error ? paymentErr.message : 'Payment initiation failed';
      console.error('Payment initiation error:', msg);
      // Do NOT roll back the order; the customer can pay later from tracking page.
      // Return the tracking URL so they are not left stranded.
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingToken: order.trackingToken,
        paymentUrl: null,
        paymentError: 'Payment link could not be generated right now. Please use your tracking link to pay later.',
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingToken: order.trackingToken,
      paymentUrl,
    });
  } catch (error: unknown) {
    console.error('Checkout API error:', error);
    const msg = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

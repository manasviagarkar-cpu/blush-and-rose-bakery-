import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUSES } from '@/lib/constants';
import { generateOrderNumber, generateTrackingToken, isValidBookingDate } from '@/lib/utils';
import { validateCustomCakeRequest } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      size,
      shape = 'Round',
      tiers = '1 Tier',
      flavor,
      filling = 'Classic Vanilla Buttercream',
      frostingType = 'Swiss Meringue Buttercream',
      frostingColor = 'Warm Cream & Ivory',
      designStyle = 'Vintage Lambeth / Ruffle Piping',
      toppings = '',
      isEggless = false,
      occasion = 'Birthday',
      cakeMessage = '',
      pickupDate,
      pickupTimeSlot,
      specialInstructions = '',
      allergies = '',
      referenceImageUrl,
    } = body;

    // 1. Validation
    const errors = validateCustomCakeRequest({
      customerName,
      customerPhone,
      customerEmail,
      size,
      flavor,
      pickupDate,
      pickupTimeSlot,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].message }, { status: 400 });
    }

    // 2. Validate bakery profile rules
    const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
    const minAdvanceDays = profile?.minAdvanceNoticeDays ?? 2;
    const holidayDates: string[] = JSON.parse(profile?.holidayDates ?? '[]');

    const dateCheck = isValidBookingDate(pickupDate, minAdvanceDays, holidayDates);
    if (!dateCheck.valid) {
      return NextResponse.json({ error: dateCheck.reason }, { status: 400 });
    }

    // 3. Sanitize reference image URL — accept only safe http/https URLs
    let safeReferenceImageUrl: string | null = null;
    if (referenceImageUrl && typeof referenceImageUrl === 'string') {
      const trimmed = referenceImageUrl.trim();
      if (
        trimmed.length > 0 &&
        trimmed.length <= 2048 &&
        /^https?:\/\//i.test(trimmed)
      ) {
        safeReferenceImageUrl = trimmed;
      }
      // javascript:, data:, and other schemes are silently dropped
    }

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

    // 5. Create Order with status AWAITING_BAKER_REVIEW
    //    Price is intentionally set to 0 — only the baker can set the final price.
    //    The browser-supplied estimatedBasePrice is deliberately NOT used here.
    const order = await prisma.order.create({
      data: {
        orderNumber,
        trackingToken,
        type: 'CUSTOM_CAKE',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerId: customer.id,
        status: ORDER_STATUSES.AWAITING_BAKER_REVIEW,
        pickupDate,
        pickupTimeSlot,
        totalAmount: 0,
        depositAmount: 0,
        balanceAmount: 0,
        paymentStatus: 'PENDING',
        customerNotes: specialInstructions,
        customerApproved: false,
        customCakeRequest: {
          create: {
            size,
            shape,
            tiers,
            flavor,
            filling,
            frostingType,
            frostingColor,
            designStyle,
            toppings,
            isEggless: Boolean(isEggless),
            occasion,
            cakeMessage,
            specialInstructions,
            allergies,
            referenceImageUrl: safeReferenceImageUrl,
          },
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: ORDER_STATUSES.NEW_REQUEST,
              notes: 'Custom cake design request submitted online',
              changedBy: 'CUSTOMER',
            },
            {
              fromStatus: ORDER_STATUSES.NEW_REQUEST,
              toStatus: ORDER_STATUSES.AWAITING_BAKER_REVIEW,
              notes: 'Queued for baker inspection, decoration feasibility, and quotation',
              changedBy: 'SYSTEM',
            },
          ],
        },
      },
    });

    // 6. In-app notification for baker
    await prisma.notification.create({
      data: {
        orderId: order.id,
        type: 'REQUEST_RECEIVED',
        title: `Custom Cake Request #${order.orderNumber}`,
        message: `${customerName} submitted a ${tiers} (${size}) custom ${flavor} cake request for ${pickupDate}.`,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingToken: order.trackingToken,
    });
  } catch (error: unknown) {
    console.error('Custom request API error:', error);
    const msg = error instanceof Error ? error.message : 'Custom request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

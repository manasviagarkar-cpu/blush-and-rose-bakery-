import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const profile = await prisma.bakeryProfile.findUnique({ where: { id: 'default' } });
    return NextResponse.json({ profile });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      bakeryName,
      tagline,
      description,
      address,
      phone,
      email,
      openingHours,
      pickupInstructions,
      noticeBanner,
      minAdvanceNoticeDays,
      depositPercentage,
      cancellationPolicy,
      defaultSlotCapacity,
      heroImageUrl,
    } = body;

    const updated = await prisma.bakeryProfile.upsert({
      where: { id: 'default' },
      update: {
        bakeryName,
        tagline,
        description,
        address,
        phone,
        email,
        openingHours,
        pickupInstructions,
        noticeBanner: noticeBanner || null,
        minAdvanceNoticeDays: Number(minAdvanceNoticeDays),
        depositPercentage: Number(depositPercentage),
        cancellationPolicy,
        defaultSlotCapacity: Number(defaultSlotCapacity),
        heroImageUrl,
      },
      create: {
        id: 'default',
        bakeryName,
        tagline,
        description,
        address,
        phone,
        email,
        openingHours,
        pickupInstructions,
        noticeBanner: noticeBanner || null,
        minAdvanceNoticeDays: Number(minAdvanceNoticeDays),
        depositPercentage: Number(depositPercentage),
        cancellationPolicy,
        defaultSlotCapacity: Number(defaultSlotCapacity),
        heroImageUrl,
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: unknown) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

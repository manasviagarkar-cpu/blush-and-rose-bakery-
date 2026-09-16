import React from 'react';
import { prisma } from '@/lib/db';
import { CartClient } from './CartClient';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const profile = await prisma.bakeryProfile.findUnique({
    where: { id: 'default' },
  });

  const depositPercentage = profile?.depositPercentage || 40;
  const minAdvanceDays = profile?.minAdvanceNoticeDays || 2;
  const cancellationPolicy =
    profile?.cancellationPolicy ||
    'Cancellations made 72 hours prior to pickup are eligible for a full deposit refund. Later cancellations are non-refundable.';
  const holidayDates: string[] = JSON.parse(profile?.holidayDates || '[]');

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto 2.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Atelier Checkout
        </span>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.5rem' }}>
          Your Basket & Pickup Booking
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review your selected artisanal treats, choose your pickup appointment, and pay the {depositPercentage}% booking deposit.
        </p>
      </div>

      <CartClient
        depositPercentage={depositPercentage}
        minAdvanceDays={minAdvanceDays}
        cancellationPolicy={cancellationPolicy}
        holidayDates={holidayDates}
      />
    </div>
  );
}

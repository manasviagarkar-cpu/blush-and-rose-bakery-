import React from 'react';
import { prisma } from '@/lib/db';
import { CustomCakeForm } from './CustomCakeForm';

export default async function CustomCakePage() {
  const profile = await prisma.bakeryProfile.findUnique({
    where: { id: 'default' },
  });

  const minAdvanceDays = profile?.minAdvanceNoticeDays || 2;
  const holidayDates: string[] = JSON.parse(profile?.holidayDates || '[]');

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto 2.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Bespoke Atelier Commissions
        </span>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
          Custom Celebration Cake Booking
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Design your dream centerpiece. Every tier, flavor, piping detail, and color is customized to your celebration.
          Our head baker will personally review your specifications and supply a verified quote.
        </p>
      </div>

      <CustomCakeForm minAdvanceDays={minAdvanceDays} holidayDates={holidayDates} />
    </div>
  );
}

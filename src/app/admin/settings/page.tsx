import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsClient } from './SettingsClient';

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const profile = await prisma.bakeryProfile.findUnique({
    where: { id: 'default' },
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Configuration
        </span>
        <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
          Bakery Atelier Settings
        </h1>
      </div>

      <SettingsClient initialProfile={profile as any} />
    </div>
  );
}

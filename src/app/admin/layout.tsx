import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminNav } from './AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // If not logged in, we let the page handle login or redirect if accessing protected admin subroutes
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--header-height))', backgroundColor: 'var(--bg-main)' }}>
      {session ? (
        <>
          <div className="hide-mobile">
            <AdminNav adminEmail={session.email} adminName={session.name} />
          </div>
          <div style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
            {children}
          </div>
        </>
      ) : (
        <div style={{ flex: 1 }}>{children}</div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminNavProps {
  adminEmail: string;
  adminName: string;
}

export function AdminNav({ adminEmail, adminName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: '📊 Dashboard', href: '/admin' },
    { label: '📦 Orders', href: '/admin/orders' },
    { label: '📅 Calendar & Slots', href: '/admin/calendar' },
    { label: '🧁 Products', href: '/admin/products' },
    { label: '👥 Customers', href: '/admin/customers' },
    { label: '⚙️ Bakery Settings', href: '/admin/settings' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--border-color)',
      padding: '1.75rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - var(--header-height))',
    }}>
      {/* Baker info */}
      <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)', fontWeight: 700 }}>
          Atelier Management
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
          {adminName}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '2px' }}>
          {adminEmail}
        </div>
      </div>

      {/* Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
                transition: 'var(--transition)',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link href="/" target="_blank" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>↗</span> View Customer Store
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  bakeryName?: string;
  noticeBanner?: string | null;
}

export function Header({
  bakeryName = 'Blush & Rose Bakery',
  noticeBanner = '🌸 Custom celebration cakes require a minimum 2 days advance notice.',
}: HeaderProps) {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(253, 249, 245, 0.96)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border-color)' }}>
      {noticeBanner && (
        <div className="notice-banner">
          {noticeBanner}
        </div>
      )}

      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'var(--header-height)' }}>
        {/* Brand / Logo */}
        <Link href="/" style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {bakeryName}
          </span>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginTop: '2px' }}>
            Artisan Pâtisserie & Bespoke Cakes
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Home
          </Link>
          <Link href="/products" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Products & Cakes
          </Link>
          <Link href="/custom-cake" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            ✨ Custom Cake Booking
          </Link>
          <Link href="/track" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Track Order
          </Link>
        </nav>

        {/* Actions (Cart & Baker Admin) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/cart" className="btn btn-secondary btn-sm" style={{ position: 'relative', padding: '0.5rem 1.1rem' }}>
            <span>🛒 Cart</span>
            {itemCount > 0 && (
              <span style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '0.75rem',
                fontWeight: 700,
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}>
                {itemCount}
              </span>
            )}
          </Link>

          <Link href="/admin" className="btn btn-outline-rose btn-sm hide-mobile" title="Baker Administration Panel">
            Baker Admin 🔒
          </Link>

          {/* Mobile hamburger toggle */}
          <button
            className="hide-desktop btn btn-secondary btn-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{ padding: '0.5rem 0.8rem' }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="hide-desktop" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-color)', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 500 }}>
            Home
          </Link>
          <Link href="/products" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 500 }}>
            Products & Cakes
          </Link>
          <Link href="/custom-cake" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--color-primary)' }}>
            ✨ Custom Cake Booking
          </Link>
          <Link href="/track" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 500 }}>
            Track Order
          </Link>
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', color: 'var(--color-primary)' }}>
            Baker Admin 🔒
          </Link>
        </div>
      )}
    </header>
  );
}

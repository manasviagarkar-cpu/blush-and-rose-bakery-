import React from 'react';
import Link from 'next/link';

interface FooterProps {
  bakeryName?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  pickupInstructions?: string;
  cancellationPolicy?: string;
}

export function Footer({
  bakeryName = 'Blush & Rose Bakery',
  address = '142 Rosewood Lane, Suite 4, Old Town',
  phone = '+1 (555) 234-5678',
  email = 'orders@blushandrosebakery.com',
  openingHours = 'Tuesday - Saturday: 8:00 AM - 6:30 PM | Sunday: 9:00 AM - 3:00 PM | Monday: Closed',
  pickupInstructions = 'Please ring the doorbell at the side entrance. Have your order number and photo ID ready.',
  cancellationPolicy = 'Cancellations made 72 hours prior to pickup are eligible for a full deposit refund. Later cancellations are non-refundable.',
}: FooterProps) {
  return (
    <footer style={{ backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)', paddingTop: '4rem', paddingBottom: '3rem', marginTop: 'auto' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          {/* Brand & Story */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              {bakeryName}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Bespoke celebration cakes, artisan pastries, and French-inspired confectionery. Freshly baked in small batches with love.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div>📍 {address}</div>
              <div style={{ marginTop: '0.35rem' }}>📞 {phone}</div>
              <div style={{ marginTop: '0.35rem' }}>✉️ {email}</div>
            </div>
          </div>

          {/* Bakery Hours */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
              Opening & Pickup Hours
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
              {openingHours}
            </p>
            <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>🚗 Pickup Guide:</strong>
              {pickupInstructions}
            </div>
          </div>

          {/* Quick Links & Policy */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
              Customer Services
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <li>
                <Link href="/products" style={{ color: 'var(--text-muted)' }}>
                  Browse All Products
                </Link>
              </li>
              <li>
                <Link href="/custom-cake" style={{ color: 'var(--text-muted)' }}>
                  Custom Celebration Cake Request
                </Link>
              </li>
              <li>
                <Link href="/track" style={{ color: 'var(--text-muted)' }}>
                  Track Your Order Status
                </Link>
              </li>
              <li>
                <Link href="/admin" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  Baker Administration Login →
                </Link>
              </li>
            </ul>

            <div style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-light)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <strong>Cancellation & Deposit Policy:</strong>
              <p style={{ marginTop: '0.25rem' }}>{cancellationPolicy}</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-light)' }}>
          <div>
            © {new Date().getFullYear()} {bakeryName}. All rights reserved. Handcrafted with care.
          </div>
          <div>
            Single-Bakery Management & Custom Cake System
          </div>
        </div>
      </div>
    </footer>
  );
}

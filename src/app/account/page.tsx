import React from 'react';
import { AccountClient } from './AccountClient';

export default function CustomerAccountPage() {
  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto 2.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Client Atelier Portal
        </span>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.5rem' }}>
          Customer Account & Orders
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          View your active bookings, past orders, and quickly reorder your favorite signature cakes.
        </p>
      </div>

      <AccountClient />
    </div>
  );
}

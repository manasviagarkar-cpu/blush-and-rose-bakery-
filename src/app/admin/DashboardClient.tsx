'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { formatCurrency } from '@/lib/utils';
import { PICKUP_TIME_SLOTS } from '@/lib/constants';

interface DashboardClientProps {
  todayPickups: any[];
  tomorrowPickups: any[];
  awaitingReview: any[];
  awaitingApproval: any[];
  depositPending: any[];
  inPrep: any[];
  readyForPickup: any[];
  recentOrders: any[];
  products: { id: string; name: string; price: number }[];
  metrics: {
    totalOrders: number;
    totalSales: number;
    totalDepositsCollected: number;
    todayCount: number;
    tomorrowCount: number;
  };
}

export function DashboardClient({
  todayPickups,
  tomorrowPickups,
  awaitingReview,
  awaitingApproval,
  depositPending,
  inPrep,
  readyForPickup,
  recentOrders,
  products,
  metrics,
}: DashboardClientProps) {
  const router = useRouter();
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual order form state
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualProduct, setManualProduct] = useState(products[0]?.name || 'Custom Sponge Cake');
  const [manualPrice, setManualPrice] = useState(products[0]?.price || 50);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualSlot, setManualSlot] = useState(PICKUP_TIME_SLOTS[0]);
  const [manualNotes, setManualNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: manualName,
          customerPhone: manualPhone,
          customerEmail: manualEmail,
          productName: manualProduct,
          price: Number(manualPrice),
          pickupDate: manualDate,
          pickupTimeSlot: manualSlot,
          notes: manualNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }

      setShowManualModal(false);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating manual order');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
            Operational Overview
          </span>
          <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
            Baker Atelier Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="btn btn-primary"
          >
            + Create Manual Order
          </button>
          <Link href="/admin/calendar" className="btn btn-secondary">
            📅 View Pickup Calendar
          </Link>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Today's Pickups
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginTop: '0.25rem', color: 'var(--text-main)' }}>
            {todayPickups.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scheduled for collection today</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Tomorrow's Pickups
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginTop: '0.25rem', color: 'var(--text-main)' }}>
            {tomorrowPickups.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Require baking & staging</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            New Custom Requests
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginTop: '0.25rem', color: '#6D28D9' }}>
            {awaitingReview.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Awaiting your price quote</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            In Baking / Prep
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginTop: '0.25rem', color: '#047857' }}>
            {inPrep.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active in kitchen atelier</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #EC4899' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>
            Ready for Pickup
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginTop: '0.25rem', color: '#BE185D' }}>
            {readyForPickup.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Boxed & awaiting customer</span>
        </div>
      </div>

      {/* Priority Action: Custom Requests Awaiting Review */}
      {awaitingReview.length > 0 && (
        <div className="card" style={{ marginBottom: '2.5rem', backgroundColor: '#FFFDF9', borderColor: '#FDE68A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#B45309' }}>
                ⚠️ Custom Cake Requests Needing Review ({awaitingReview.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                These requests are waiting for you to verify design feasibility, set the final price, and send quotes to customers.
              </p>
            </div>
            <Link href="/admin/orders?status=Awaiting+baker+review" className="btn btn-secondary btn-sm">
              View All Requests →
            </Link>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Cake Spec</th>
                  <th>Pickup Date</th>
                  <th>Estimated Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {awaitingReview.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td>
                      <div>{order.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{order.customerPhone}</div>
                    </td>
                    <td>
                      <div>{order.customCakeRequest?.tiers} • {order.customCakeRequest?.flavor}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{order.customCakeRequest?.designStyle}</div>
                    </td>
                    <td>{order.pickupDate} ({order.pickupTimeSlot})</td>
                    <td><strong>{formatCurrency(order.totalAmount)}</strong></td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-primary btn-sm">
                        Review & Quote →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled Pickups for Today & Tomorrow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Today */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Today's Pickup Schedule</h3>
            <span className="badge badge-prep">{todayPickups.length} Pickups</span>
          </div>

          {todayPickups.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              No scheduled pickups for today. Kitchen prep or rest day! 🌸
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todayPickups.map((order) => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      {order.pickupTimeSlot} — {order.customerName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{order.orderNumber} • {order.items?.[0]?.productName || 'Custom Cake'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <OrderStatusBadge status={order.status} />
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tomorrow */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Tomorrow's Pickup Schedule</h3>
            <span className="badge badge-review">{tomorrowPickups.length} Pickups</span>
          </div>

          {tomorrowPickups.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              No scheduled pickups for tomorrow.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tomorrowPickups.map((order) => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      {order.pickupTimeSlot} — {order.customerName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{order.orderNumber} • {order.items?.[0]?.productName || 'Custom Cake'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <OrderStatusBadge status={order.status} />
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Order Creation Modal */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Create Manual Order (Walk-in / Phone)</h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product / Cake *</label>
                  <input
                    type="text"
                    required
                    value={manualProduct}
                    onChange={(e) => setManualProduct(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Pickup Date *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot *</label>
                  <select
                    value={manualSlot}
                    onChange={(e) => setManualSlot(e.target.value)}
                    className="form-select"
                  >
                    {PICKUP_TIME_SLOTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Order Notes / Custom Details</label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary"
                >
                  {isCreating ? 'Saving Order...' : 'Confirm Manual Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

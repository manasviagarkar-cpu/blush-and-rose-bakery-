'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { ORDER_STATUS_LIST, ORDER_STATUSES, PICKUP_TIME_SLOTS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderDetailClientProps {
  initialOrder: Order;
}

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);

  // Baker editable state
  const [status, setStatus] = useState<string>(order.status);
  const [bakerNotes, setBakerNotes] = useState<string>(order.bakerNotes || '');
  const [quotePrice, setQuotePrice] = useState<number>(order.totalAmount);
  const [proposedNotes, setProposedNotes] = useState<string>(order.bakerNotes || '');

  // Reschedule state
  const [newPickupDate, setNewPickupDate] = useState<string>(order.pickupDate);
  const [newPickupSlot, setNewPickupSlot] = useState<string>(order.pickupTimeSlot);
  const [showReschedule, setShowReschedule] = useState<boolean>(false);

  // Offline payment state
  const [offlineAmount, setOfflineAmount] = useState<number>(order.balanceAmount || order.depositAmount);
  const [offlineMethod, setOfflineMethod] = useState<'CASH' | 'CARD_OFFLINE'>('CASH');
  const [showOfflinePay, setShowOfflinePay] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const isCustom = order.type === 'CUSTOM_CAKE';

  // API caller helper
  const updateOrder = async (endpoint: string, payload: any) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrder(data.order);
      setStatus(data.order.status);
      setMessage('✓ Changes saved successfully!');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  // 1. Send price quotation to customer
  const handleSendQuote = async () => {
    await updateOrder('/api/admin/orders/quote', {
      totalAmount: Number(quotePrice),
      bakerNotes: proposedNotes,
    });
  };

  // 2. Change status
  const handleChangeStatus = async (newStatus: string) => {
    await updateOrder('/api/admin/orders/status', {
      status: newStatus,
      notes: `Status changed by baker to ${newStatus}`,
    });
  };

  // 3. Save internal baker notes
  const handleSaveNotes = async () => {
    await updateOrder('/api/admin/orders/notes', {
      bakerNotes,
    });
  };

  // 4. Record offline payment
  const handleRecordOfflinePayment = async () => {
    await updateOrder('/api/admin/orders/offline-payment', {
      amount: Number(offlineAmount),
      paymentMethod: offlineMethod,
    });
    setShowOfflinePay(false);
  };

  // 5. Reschedule pickup date/time
  const handleReschedule = async () => {
    await updateOrder('/api/admin/orders/reschedule', {
      pickupDate: newPickupDate,
      pickupTimeSlot: newPickupSlot,
    });
    setShowReschedule(false);
  };

  // 6. Resend or copy payment link
  const handleCopyPaymentLink = async () => {
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, isDeposit: order.paymentStatus === 'PENDING' }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        await navigator.clipboard.writeText(data.paymentUrl);
        alert(`Payment URL copied to clipboard:\n${data.paymentUrl}`);
      }
    } catch (e) {
      alert('Failed to generate payment link');
    }
  };

  return (
    <div>
      {/* Top Breadcrumb & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/admin/orders" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>
            ← Back to Order List
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <h1 style={{ fontSize: '1.85rem' }}>Order #{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyPaymentLink}
            className="btn btn-secondary btn-sm"
          >
            🔗 Copy Payment Link
          </button>
          <button
            type="button"
            onClick={() => setShowOfflinePay(true)}
            className="btn btn-secondary btn-sm"
          >
            💵 Record Offline Payment
          </button>
          <button
            type="button"
            onClick={() => setShowReschedule(true)}
            className="btn btn-secondary btn-sm"
          >
            📅 Reschedule Pickup
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          backgroundColor: 'var(--status-confirmed-bg)',
          color: 'var(--status-confirmed-text)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          fontWeight: 600,
        }}>
          {message}
        </div>
      )}

      {/* Visual Timeline */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <StatusTimeline currentStatus={order.status} orderType={order.type} />
      </div>

      {/* Custom Cake Review & Quotation Workflow Panel */}
      {isCustom && (order.status === ORDER_STATUSES.AWAITING_BAKER_REVIEW || order.status === ORDER_STATUSES.NEW_REQUEST) && (
        <div className="card" style={{ backgroundColor: '#FFFDF9', borderColor: '#FDE68A', marginBottom: '2rem', padding: '1.75rem' }}>
          <h3 style={{ color: '#B45309', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
            👩‍🍳 Custom Cake Design Review & Quote Builder
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Inspect the customer’s design specifications below. Set the final quoted price and add design notes to send for their approval.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div className="form-group">
              <label className="form-label">Final Quoted Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={quotePrice}
                onChange={(e) => setQuotePrice(Number(e.target.value))}
                className="form-input"
                style={{ fontSize: '1.1rem', fontWeight: 700 }}
              />
              <span className="form-hint">Deposit will automatically calculate at 40% ({formatCurrency(quotePrice * 0.4)})</span>
            </div>

            <div className="form-group">
              <label className="form-label">Baker’s Design Notes / Decoration Feedback</label>
              <textarea
                placeholder="e.g. Design accepted with fresh blush garden roses and 24k gold leaf accents. Piping will follow delicate Lambeth scrollwork."
                value={proposedNotes}
                onChange={(e) => setProposedNotes(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '80px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={loading}
              onClick={handleSendQuote}
              className="btn btn-primary"
            >
              {loading ? 'Sending Quote...' : '✓ Send Price Quote & Request Customer Approval'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleChangeStatus(ORDER_STATUSES.REJECTED)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#B91C1C' }}
            >
              Reject Request
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Details & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left: Specifications & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Custom Cake Specs or Line items */}
          {isCustom && order.customDetails ? (
            <div className="card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                🎂 Cake Design Specifications
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.88rem' }}>
                <div><strong>Size / Servings:</strong> <div>{order.customDetails.size}</div></div>
                <div><strong>Tiers:</strong> <div>{order.customDetails.tiers}</div></div>
                <div><strong>Shape:</strong> <div>{order.customDetails.shape}</div></div>
                <div><strong>Flavor:</strong> <div>{order.customDetails.flavor}</div></div>
                <div><strong>Filling:</strong> <div>{order.customDetails.filling}</div></div>
                <div><strong>Frosting:</strong> <div>{order.customDetails.frostingType}</div></div>
                <div><strong>Color Palette:</strong> <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{order.customDetails.frostingColor}</div></div>
                <div><strong>Design Theme:</strong> <div>{order.customDetails.designStyle}</div></div>
                <div><strong>Toppings:</strong> <div>{order.customDetails.toppings || 'None specified'}</div></div>
                <div><strong>Dietary:</strong> <div>{order.customDetails.isEggless ? '🌱 Eggless' : 'Standard'}</div></div>
                <div><strong>Occasion:</strong> <div>{order.customDetails.occasion}</div></div>
                <div><strong>Allergens noted:</strong> <div style={{ color: '#B91C1C' }}>{order.customDetails.allergies || 'None'}</div></div>
              </div>

              {order.customDetails.cakeMessage && (
                <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: 'var(--bg-warm-tint)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <strong>Piped Message:</strong> “{order.customDetails.cakeMessage}”
                </div>
              )}

              {order.customDetails.specialInstructions && (
                <div style={{ marginTop: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <strong>Customer Instructions:</strong> {order.customDetails.specialInstructions}
                </div>
              )}

              {order.customDetails.referenceImageUrl && (
                <div style={{ marginTop: '1.25rem' }}>
                  <strong>Reference Photo:</strong>
                  <div style={{ marginTop: '0.5rem', width: '220px', height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={order.customDetails.referenceImageUrl} alt="Reference photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                📦 Line Items
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      {item.variantName && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Variant: {item.variantName}</div>}
                      {item.cakeMessage && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>Plaque: “{item.cakeMessage}”</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Qty: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status & Activity Log */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              📜 Status & Audit History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order.statusHistory?.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-light)', minWidth: '110px' }}>
                    {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <span className="badge badge-new" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }}>
                      {h.changedBy}
                    </span>
                    <strong>{h.toStatus}</strong>
                    {h.notes && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>— {h.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Operational Controls, Customer & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Changer */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
              Update Order Status
            </h3>
            <div className="form-group">
              <label className="form-label">Current Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  handleChangeStatus(e.target.value);
                }}
                className="form-select"
                disabled={loading}
              >
                {ORDER_STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer & Pickup Logistics */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              Customer & Pickup
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div><strong>Name:</strong> {order.customerName}</div>
              <div><strong>Phone:</strong> <a href={`tel:${order.customerPhone}`} style={{ color: 'var(--color-primary)' }}>{order.customerPhone}</a></div>
              <div><strong>Email:</strong> <a href={`mailto:${order.customerEmail}`} style={{ color: 'var(--color-primary)' }}>{order.customerEmail}</a></div>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <strong>Scheduled Pickup:</strong>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatDate(order.pickupDate)}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Slot: {order.pickupTimeSlot}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown & Payments */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              Financial Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Amount:</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}>
                <span>Deposit Amount:</span>
                <strong>{formatCurrency(order.depositAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Remaining Balance:</span>
                <span>{formatCurrency(order.balanceAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 600 }}>
                <span>Payment State:</span>
                <span style={{ color: order.paymentStatus === 'FULLY_PAID' || order.paymentStatus === 'DEPOSIT_PAID' ? '#047857' : '#B45309' }}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Payments list */}
            {order.payments && order.payments.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment History:</strong>
                {order.payments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    <span>{p.paymentMethod} • {formatCurrency(p.amount)}</span>
                    <span style={{ color: p.status === 'SUCCESS' ? '#047857' : '#B91C1C', fontWeight: 600 }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Baker Notes */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
              Internal Baker Notes
            </h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <textarea
                placeholder="Private notes (recipes, flower vendor, delivery reminders)..."
                value={bakerNotes}
                onChange={(e) => setBakerNotes(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '90px' }}
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveNotes}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              Save Baker Notes
            </button>
          </div>
        </div>
      </div>

      {/* Offline Payment Recording Modal */}
      {showOfflinePay && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Record Offline Payment</h3>
              <button type="button" onClick={() => setShowOfflinePay(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                value={offlineAmount}
                onChange={(e) => setOfflineAmount(Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                value={offlineMethod}
                onChange={(e) => setOfflineMethod(e.target.value as any)}
                className="form-select"
              >
                <option value="CASH">Cash (In Atelier)</option>
                <option value="CARD_OFFLINE">Card Terminal / POS</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowOfflinePay(false)} className="btn btn-secondary">Cancel</button>
              <button type="button" disabled={loading} onClick={handleRecordOfflinePayment} className="btn btn-primary">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Reschedule Pickup Appointment</h3>
              <button type="button" onClick={() => setShowReschedule(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">New Pickup Date *</label>
              <input
                type="date"
                value={newPickupDate}
                onChange={(e) => setNewPickupDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Time Slot *</label>
              <select
                value={newPickupSlot}
                onChange={(e) => setNewPickupSlot(e.target.value)}
                className="form-select"
              >
                {PICKUP_TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowReschedule(false)} className="btn btn-secondary">Cancel</button>
              <button type="button" disabled={loading} onClick={handleReschedule} className="btn btn-primary">
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

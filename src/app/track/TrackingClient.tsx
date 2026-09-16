'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/constants';

interface TrackingClientProps {
  initialOrder: Order | null;
  defaultOrderId: string;
  defaultToken: string;
}

export function TrackingClient({
  initialOrder,
  defaultOrderId,
  defaultToken,
}: TrackingClientProps) {
  const router = useRouter();

  const [orderInput, setOrderInput] = useState(defaultOrderId);
  const [tokenInput, setTokenInput] = useState(defaultToken);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim() || !tokenInput.trim()) {
      setErrorMsg('Please enter both your Order Number and Tracking Token.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderInput.trim())}&token=${encodeURIComponent(tokenInput.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Order not found with the provided details.');
      }

      setCurrentOrder(data.order);
      router.replace(`/track?orderId=${encodeURIComponent(data.order.orderNumber)}&token=${encodeURIComponent(data.order.trackingToken)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lookup failed.';
      setErrorMsg(msg);
      setCurrentOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer price and design approval
  const handleApproveQuote = async () => {
    if (!currentOrder) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/orders/approve-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrder.id,
          token: currentOrder.trackingToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve quote.');
      }

      // If a payment link was generated, redirect to pay deposit
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Refresh local order state
        setCurrentOrder(data.order);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Approval error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle pay deposit directly
  const handlePayDeposit = async () => {
    if (!currentOrder) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrder.id,
          isDeposit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate deposit payment.');
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Payment error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Lookup Card */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Find Your Booking
        </h3>
        <form onSubmit={handleLookup} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) 140px', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Order Number</label>
            <input
              type="text"
              placeholder="e.g. BR25-1042"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tracking Security Token</label>
            <input
              type="text"
              placeholder="e.g. cst789tk01234567"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ height: '44px' }}
          >
            {loading ? 'Searching...' : 'Track →'}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: '1rem', color: '#B91C1C', fontSize: '0.88rem', fontWeight: 500 }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* Order Results */}
      {currentOrder && (
        <div className="card" style={{ padding: '2rem' }}>
          {/* Top Status Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Order #{currentOrder.orderNumber}
              </div>
              <h2 style={{ fontSize: '1.6rem', marginTop: '2px' }}>
                {currentOrder.type === 'CUSTOM_CAKE' ? 'Custom Celebration Cake' : 'Bakery Pre-Order'}
              </h2>
            </div>
            <OrderStatusBadge status={currentOrder.status} />
          </div>

          {/* Timeline */}
          <StatusTimeline currentStatus={currentOrder.status} orderType={currentOrder.type} />

          {/* Approval Action Banner for Custom Cake */}
          {(currentOrder.status === ORDER_STATUSES.PRICE_SENT || currentOrder.status === ORDER_STATUSES.AWAITING_CUSTOMER_APPROVAL) && (
            <div style={{
              backgroundColor: 'var(--status-price-bg)',
              border: '2px solid #D8B4FE',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              margin: '2rem 0',
            }}>
              <h4 style={{ color: 'var(--status-price-text)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>
                🎉 Baker’s Quote Ready for Your Approval!
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                Our head baker has reviewed your custom cake specifications and prepared your quotation:
              </p>

              <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <span>Final Quoted Price:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(currentOrder.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Required Deposit (40%):</span>
                  <span>{formatCurrency(currentOrder.depositAmount)}</span>
                </div>

                {currentOrder.bakerNotes && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}>
                    <strong>Baker’s Design Notes:</strong> {currentOrder.bakerNotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleApproveQuote}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Processing...' : `Approve & Pay Deposit (${formatCurrency(currentOrder.depositAmount)}) →`}
                </button>
              </div>
            </div>
          )}

          {/* Deposit Pending Banner */}
          {currentOrder.status === ORDER_STATUSES.DEPOSIT_PENDING && (
            <div style={{
              backgroundColor: 'var(--status-deposit-bg)',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              margin: '1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <strong style={{ color: 'var(--status-deposit-text)', display: 'block', fontSize: '1rem' }}>
                  💳 Deposit Payment Pending
                </strong>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  Your quote has been approved. Please submit your booking deposit of {formatCurrency(currentOrder.depositAmount)} to lock in your date.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePayDeposit}
                disabled={actionLoading}
                className="btn btn-primary btn-sm"
              >
                Pay Deposit Now →
              </button>
            </div>
          )}

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', margin: '2rem 0' }}>
            {/* Pickup appointment */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                🚗 Pickup Appointment
              </h4>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Date:</strong> {formatDate(currentOrder.pickupDate)}</div>
                <div><strong>Time Slot:</strong> {currentOrder.pickupTimeSlot}</div>
                <div><strong>Client:</strong> {currentOrder.customerName}</div>
                <div><strong>Contact:</strong> {currentOrder.customerPhone}</div>
              </div>
            </div>

            {/* Payment Summary */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                💰 Payment Breakdown
              </h4>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Order:</span>
                  <strong>{formatCurrency(currentOrder.totalAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}>
                  <span>Deposit Amount:</span>
                  <strong>{formatCurrency(currentOrder.depositAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Balance Due at Pickup:</span>
                  <span>{formatCurrency(currentOrder.balanceAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border-color)' }}>
                  <span>Payment Status:</span>
                  <span style={{ fontWeight: 600, color: currentOrder.paymentStatus === 'FULLY_PAID' || currentOrder.paymentStatus === 'DEPOSIT_PAID' ? '#047857' : '#B45309' }}>
                    {currentOrder.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Cake Specifications or Standard Items */}
          {currentOrder.customDetails ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                🎂 Custom Cake Specifications
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                <div><strong>Size / Servings:</strong> {currentOrder.customDetails.size}</div>
                <div><strong>Tiers:</strong> {currentOrder.customDetails.tiers}</div>
                <div><strong>Shape:</strong> {currentOrder.customDetails.shape}</div>
                <div><strong>Flavor:</strong> {currentOrder.customDetails.flavor}</div>
                <div><strong>Filling:</strong> {currentOrder.customDetails.filling}</div>
                <div><strong>Frosting:</strong> {currentOrder.customDetails.frostingType}</div>
                <div><strong>Color Palette:</strong> {currentOrder.customDetails.frostingColor}</div>
                <div><strong>Design Theme:</strong> {currentOrder.customDetails.designStyle}</div>
                <div><strong>Toppings:</strong> {currentOrder.customDetails.toppings}</div>
                <div><strong>Dietary:</strong> {currentOrder.customDetails.isEggless ? '🌱 Eggless' : 'Standard'}</div>
              </div>

              {currentOrder.customDetails.cakeMessage && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-warm-tint)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  <strong>Piped Inscription:</strong> “{currentOrder.customDetails.cakeMessage}”
                </div>
              )}

              {currentOrder.customDetails.referenceImageUrl && (
                <div style={{ marginTop: '1.25rem' }}>
                  <strong>Inspiration Reference Photo:</strong>
                  <div style={{ marginTop: '0.5rem', width: '150px', height: '150px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={currentOrder.customDetails.referenceImageUrl} alt="Reference inspiration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                📦 Order Line Items
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentOrder.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.productName}</span>
                      {item.variantName && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> ({item.variantName})</span>}
                      {item.cakeMessage && <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>“{item.cakeMessage}”</div>}
                    </div>
                    <div>
                      {item.quantity}x • {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Baker Notes */}
          {currentOrder.bakerNotes && (
            <div style={{ backgroundColor: 'var(--bg-warm-tint)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <strong>👩‍🍳 Note from the Baker:</strong>
              <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>{currentOrder.bakerNotes}</p>
            </div>
          )}

          {/* Audit History Log */}
          {currentOrder.statusHistory && currentOrder.statusHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                Activity Log
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                {currentOrder.statusHistory.map((hist) => (
                  <div key={hist.id} style={{ display: 'flex', gap: '0.75rem' }}>
                    <span>{new Date(hist.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <strong style={{ color: 'var(--text-muted)' }}>{hist.toStatus}</strong>
                    {hist.notes && <span>— {hist.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

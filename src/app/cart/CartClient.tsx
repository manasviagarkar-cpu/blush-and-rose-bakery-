'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { PICKUP_TIME_SLOTS } from '@/lib/constants';
import { formatCurrency, calculatePaymentBreakdown, isValidBookingDate } from '@/lib/utils';
import { validateStandardCheckout } from '@/lib/validators';

interface CartClientProps {
  depositPercentage: number;
  minAdvanceDays: number;
  cancellationPolicy: string;
  holidayDates: string[];
}

export function CartClient({
  depositPercentage,
  minAdvanceDays,
  cancellationPolicy,
  holidayDates,
}: CartClientProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();

  // Earliest allowable pickup date string YYYY-MM-DD
  const minDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + minAdvanceDays);
    return d.toISOString().split('T')[0];
  }, [minAdvanceDays]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupDate, setPickupDate] = useState(minDateStr);
  const [pickupTimeSlot, setPickupTimeSlot] = useState(PICKUP_TIME_SLOTS[0]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const breakdown = calculatePaymentBreakdown(totalAmount, depositPercentage);

  if (items.length === 0) {
    return (
      <div className="card empty-state" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧺</div>
        <h2>Your Basket is Empty</h2>
        <p>
          You haven’t added any artisanal cakes or pastries yet. Explore our handcrafted collection to choose something delicious.
        </p>
        <Link href="/products" className="btn btn-primary">
          Browse Bakery Menu →
        </Link>
      </div>
    );
  }

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate inputs
    const validationErrors = validateStandardCheckout({
      customerName,
      customerPhone,
      customerEmail,
      pickupDate,
      pickupTimeSlot,
      itemCount: items.length,
    });

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0].message);
      return;
    }

    if (!agreedToPolicy) {
      setErrorMessage('Please review and agree to the cancellation and deposit policy before proceeding to payment.');
      return;
    }

    // 2. Validate booking date against minimum advance and holidays
    const dateCheck = isValidBookingDate(pickupDate, minAdvanceDays, holidayDates);
    if (!dateCheck.valid) {
      setErrorMessage(dateCheck.reason || 'Invalid pickup date selected.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          pickupDate,
          pickupTimeSlot,
          customerNotes,
          items,
          depositPercentage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout.');
      }

      // Clear local cart once order record is created
      clearCart();

      // If a payment URL was generated (Mock or Razorpay), redirect to it
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/track?orderId=${data.orderId}&token=${data.trackingToken}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during checkout.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>
      {/* Left Column: Items List */}
      <div>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Selected Items ({items.length})</h3>
            <button
              type="button"
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Clear Cart
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>{item.name}</div>
                  {item.variantName && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>
                      Size: {item.variantName}
                    </div>
                  )}
                  {item.cakeMessage && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                      “{item.cakeMessage}”
                    </div>
                  )}
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                    {formatCurrency(item.price)} each
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{ width: '28px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
                  >
                    −
                  </button>
                  <span style={{ width: '28px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ width: '28px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
                  >
                    +
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem' }}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: '1rem', textAlign: 'right' }}>
            <Link href="/products" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>
              + Add More Treats From Menu
            </Link>
          </div>
        </div>

        {/* Cancellation and Refund Policy Notice */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
            📋 Cancellation & Refund Terms:
          </strong>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {cancellationPolicy}
          </p>
        </div>
      </div>

      {/* Right Column: Customer Details & Pickup Scheduling */}
      <div>
        <form onSubmit={handleSubmitCheckout} className="card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Pickup & Contact Details
          </h3>

          {errorMessage && (
            <div style={{
              backgroundColor: 'var(--status-cancelled-bg)',
              color: 'var(--status-cancelled-text)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              fontWeight: 500,
              border: '1px solid #FCA5A5',
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Contact info */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="Eleanor Vance"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                required
                placeholder="eleanor@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Pickup scheduling */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Pickup Date *</label>
              <input
                type="date"
                required
                min={minDateStr}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="form-input"
              />
              <span className="form-hint">Min {minAdvanceDays} days advance</span>
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Time Slot *</label>
              <select
                value={pickupTimeSlot}
                onChange={(e) => setPickupTimeSlot(e.target.value)}
                className="form-select"
              >
                {PICKUP_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Order Notes / Delivery Car Prep (Optional)</label>
            <textarea
              placeholder="e.g. Will be driving 30 mins, please double-box..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="form-textarea"
              style={{ minHeight: '65px' }}
            />
          </div>

          {/* Deposit and Balance Breakdown */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Order Subtotal:</span>
              <strong>{formatCurrency(breakdown.total)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
              <span>Booking Deposit Due Now ({depositPercentage}%):</span>
              <strong>{formatCurrency(breakdown.deposit)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Remaining Balance Due at Pickup:</span>
              <span>{formatCurrency(breakdown.balance)}</span>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
              />
              <span>
                I have read and agree to the <strong>{cancellationPolicy}</strong> and confirm my scheduled pickup date for <strong>{pickupDate}</strong>.
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem' }}
          >
            {isSubmitting ? 'Processing Booking...' : `Pay Deposit • ${formatCurrency(breakdown.deposit)}`}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-light)' }}>
            🔒 Secure payment checkout via Razorpay adapter (Test & Live modes)
          </div>
        </form>
      </div>
    </div>
  );
}

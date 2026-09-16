'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { ORDER_STATUSES } from '@/lib/constants';

export function AccountClient() {
  const router = useRouter();
  const { addItem } = useCart();

  const [email, setEmail] = useState('eleanor.vance@example.com');
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve orders');
      }

      setOrders(data.orders);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (item: any) => {
    addItem({
      productId: item.productId || 'reorder',
      name: item.productName,
      price: item.unitPrice,
      quantity: 1,
      variantName: item.variantName || undefined,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop',
      isEggless: false,
    });
    router.push('/cart');
  };

  const activeOrders = orders?.filter(
    (o) =>
      o.status !== ORDER_STATUSES.COMPLETED &&
      o.status !== ORDER_STATUSES.PICKED_UP &&
      o.status !== ORDER_STATUSES.CANCELLED &&
      o.status !== ORDER_STATUSES.REJECTED
  );

  const pastOrders = orders?.filter(
    (o) =>
      o.status === ORDER_STATUSES.COMPLETED ||
      o.status === ORDER_STATUSES.PICKED_UP ||
      o.status === ORDER_STATUSES.CANCELLED ||
      o.status === ORDER_STATUSES.REJECTED
  );

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Email Identification Card */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Access Your Customer Orders</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Enter the email address you used when booking or placing your order.
        </p>

        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            placeholder="e.g. eleanor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '240px' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Finding...' : 'View My Orders →'}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: '1rem', color: '#B91C1C', fontSize: '0.85rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {orders && (
        <div>
          {/* Active Orders */}
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Active Bookings</span>
              <span className="badge badge-new" style={{ fontSize: '0.8rem' }}>{activeOrders?.length || 0}</span>
            </h3>

            {activeOrders?.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active cake orders in progress.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeOrders?.map((order) => (
                  <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <strong>Order #{order.orderNumber}</strong> • {order.type === 'CUSTOM_CAKE' ? 'Custom Cake' : 'Bakery Order'}
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Pickup: {formatDate(order.pickupDate)} ({order.pickupTimeSlot})
                        </div>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        Total: <strong>{formatCurrency(order.totalAmount)}</strong>
                      </div>
                      <Link
                        href={`/track?orderId=${order.orderNumber}&token=${order.trackingToken}`}
                        className="btn btn-primary btn-sm"
                      >
                        Live Tracking & Status →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Orders & Reorder */}
          <div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Past Orders</span>
              <span className="badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {pastOrders?.length || 0}
              </span>
            </h3>

            {pastOrders?.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No previous completed orders found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {pastOrders?.map((order) => (
                  <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <strong>Order #{order.orderNumber}</strong> • {formatDate(order.pickupDate)}
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    {/* Standard Items Reorder Button */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {order.items.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                            <span>{item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                            <button
                              type="button"
                              onClick={() => handleReorder(item)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                            >
                              ↻ Reorder Item
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Total: {formatCurrency(order.totalAmount)}
                      </span>
                      <Link
                        href={`/track?orderId=${order.orderNumber}&token=${order.trackingToken}`}
                        style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 500 }}
                      >
                        View Order Archive →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

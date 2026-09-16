'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';

interface CustomersClientProps {
  initialCustomers: any[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openCustomerModal = (c: any) => {
    setSelectedCustomer(c);
    setNotes(c.internalNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomer.id, internalNotes: notes }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((item) => (item.id === selectedCustomer.id ? { ...item, internalNotes: notes } : item))
        );
        setSelectedCustomer((prev: any) => ({ ...prev, internalNotes: notes }));
        alert('Notes updated successfully');
      }
    } catch (e) {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ maxWidth: '400px' }}>
          <label className="form-label">Search Customers</label>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Orders Count</th>
              <th>Lifetime Spend</th>
              <th>Internal Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No customer records found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const totalSpent = c.orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>
                      <span className="badge badge-new">{c.orders.length} orders</span>
                    </td>
                    <td>
                      <strong>{formatCurrency(totalSpent)}</strong>
                    </td>
                    <td>
                      <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {c.internalNotes || '—'}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openCustomerModal(c)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                      >
                        View & Edit Notes →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer History & Notes Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem' }}>{selectedCustomer.name}</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedCustomer.phone} • {selectedCustomer.email}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Orders history list */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Order History ({selectedCustomer.orders.length})</h4>
              {selectedCustomer.orders.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>No orders recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedCustomer.orders.map((o: any) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', fontSize: '0.88rem' }}>
                      <div>
                        <strong>#{o.orderNumber}</strong> • {formatDate(o.pickupDate)}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatCurrency(o.totalAmount)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <OrderStatusBadge status={o.status} />
                        <Link href={`/admin/orders/${o.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Baker Notes */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Internal Baker Notes (Customer Preferences / Allergies / Feedback)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Likes less sweet frostings, always orders for Camille's birthday in October..."
                className="form-textarea"
                style={{ minHeight: '90px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="btn btn-secondary">
                Close
              </button>
              <button type="button" disabled={savingNotes} onClick={handleSaveNotes} className="btn btn-primary">
                {savingNotes ? 'Saving Notes...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

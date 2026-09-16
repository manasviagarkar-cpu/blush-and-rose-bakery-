'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { ORDER_STATUS_LIST } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderListClientProps {
  initialOrders: any[];
}

export function OrderListClient({ initialOrders }: OrderListClientProps) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const filteredOrders = useMemo(() => {
    return initialOrders
      .filter((o) => {
        // Status filter
        if (selectedStatus !== 'ALL' && o.status !== selectedStatus) {
          return false;
        }

        // Date filter
        if (dateFilter && o.pickupDate !== dateFilter) {
          return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesNum = o.orderNumber?.toLowerCase().includes(q);
          const matchesName = o.customerName?.toLowerCase().includes(q);
          const matchesPhone = o.customerPhone?.toLowerCase().includes(q);
          if (!matchesNum && !matchesName && !matchesPhone) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.pickupDate} 00:00:00`).getTime();
        const dateB = new Date(`${b.pickupDate} 00:00:00`).getTime();
        return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
      });
  }, [initialOrders, search, selectedStatus, dateFilter, sortOrder]);

  // Export orders as CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Phone', 'Email', 'Type', 'Pickup Date', 'Time Slot', 'Total Amount', 'Deposit Amount', 'Payment Status', 'Order Status', 'Created Date'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerEmail}"`,
      o.type,
      o.pickupDate,
      `"${o.pickupTimeSlot}"`,
      o.totalAmount,
      o.depositAmount,
      o.paymentStatus,
      `"${o.status}"`,
      o.createdAt.split('T')[0],
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `blush_rose_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Controls Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              placeholder="Order #, name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Status Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status Filter</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select"
            >
              <option value="ALL">All Statuses ({initialOrders.length})</option>
              {ORDER_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Date Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Pickup Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Sort */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Sort Date</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              className="form-select"
            >
              <option value="ASC">Earliest Pickup First</option>
              <option value="DESC">Latest Pickup First</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ height: '42px', whiteSpace: 'nowrap' }}
          >
            📥 Export CSV
          </button>
        </div>

        {(search || selectedStatus !== 'ALL' || dateFilter) && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedStatus('ALL');
                setDateFilter('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Type / Product</th>
              <th>Pickup Schedule</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isCustom = order.type === 'CUSTOM_CAKE';
                const productSummary = isCustom
                  ? `${order.customCakeRequest?.tiers || 'Custom'} (${order.customCakeRequest?.flavor || 'Custom'})`
                  : order.items?.[0]?.productName || 'Bakery items';

                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{order.customerPhone}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: isCustom ? '#F3E8FF' : '#E0F2FE', color: isCustom ? '#6B21A8' : '#0369A1', marginBottom: '2px' }}>
                        {isCustom ? 'Custom Cake' : 'Standard'}
                      </span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{productSummary}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatDate(order.pickupDate)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{order.pickupTimeSlot}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatCurrency(order.totalAmount)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Dep: {formatCurrency(order.depositAmount)}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: order.paymentStatus === 'FULLY_PAID' || order.paymentStatus === 'DEPOSIT_PAID' ? '#047857' : '#B45309',
                      }}>
                        ● {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PICKUP_TIME_SLOTS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

interface CalendarClientProps {
  initialOrders: any[];
  initialHolidays: string[];
  initialSlots: any[];
  defaultCapacity: number;
}

export function CalendarClient({
  initialOrders,
  initialHolidays,
  initialSlots,
  defaultCapacity,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
  const [holidays, setHolidays] = useState<string[]>(initialHolidays);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Compute days in month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: ({ day: number; dateStr: string; isCurrentMonth: boolean } | null)[] = [];

    // Empty cells before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({
        day: d,
        dateStr: `${year}-${mm}-${dd}`,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [year, month]);

  const ordersByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    initialOrders.forEach((o) => {
      if (!map[o.pickupDate]) map[o.pickupDate] = [];
      map[o.pickupDate].push(o);
    });
    return map;
  }, [initialOrders]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleToggleHoliday = async (dateStr: string) => {
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_DATE_BLOCK', date: dateStr }),
      });
      const data = await res.json();
      if (data.holidayDates) {
        setHolidays(data.holidayDates);
      }
    } catch (e) {
      alert('Failed to update blocked date');
    }
  };

  return (
    <div>
      {/* Top Controls Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)' }}>{monthName}</h2>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button type="button" onClick={prevMonth} className="btn btn-secondary btn-sm">‹ Prev</button>
            <button type="button" onClick={goToToday} className="btn btn-secondary btn-sm">Today</button>
            <button type="button" onClick={nextMonth} className="btn btn-secondary btn-sm">Next ›</button>
          </div>
        </div>

        {/* View Mode Chips */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['MONTH', 'WEEK', 'DAY'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: viewMode === mode ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                backgroundColor: viewMode === mode ? 'var(--color-primary)' : '#FFFFFF',
                color: viewMode === mode ? '#FFFFFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {mode === 'MONTH' ? 'Month View' : mode === 'WEEK' ? 'Week View' : 'Day View'}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid (Month View) */}
      {viewMode === 'MONTH' && (
        <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
          {/* Day of Week Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: '1px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{ backgroundColor: 'var(--bg-surface)', padding: '0.65rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {d}
              </div>
            ))}

            {/* Day Cells */}
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty_${idx}`} style={{ backgroundColor: '#FAF8F5', minHeight: '110px' }} />;
              }

              const isBlocked = holidays.includes(cell.dateStr);
              const dayOrders = ordersByDate[cell.dateStr] || [];
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  style={{
                    backgroundColor: isBlocked ? '#FFF5F5' : '#FFFFFF',
                    minHeight: '115px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    border: isToday ? '2px solid var(--color-primary)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  className="calendar-cell-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: isToday ? 700 : 600, fontSize: '0.88rem', color: isToday ? 'var(--color-primary)' : 'var(--text-main)' }}>
                      {cell.day}
                    </span>

                    {isBlocked && (
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        Blocked
                      </span>
                    )}

                    {!isBlocked && dayOrders.length > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                        {dayOrders.length}/{defaultCapacity} booked
                      </span>
                    )}
                  </div>

                  {/* Order chips inside cell */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                    {dayOrders.slice(0, 3).map((o) => (
                      <Link
                        key={o.id}
                        href={`/admin/orders/${o.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '3px',
                          backgroundColor: o.type === 'CUSTOM_CAKE' ? '#F3E8FF' : '#E0F2FE',
                          color: o.type === 'CUSTOM_CAKE' ? '#6B21A8' : '#0369A1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                          display: 'block',
                        }}
                        title={`${o.customerName} - ${o.pickupTimeSlot} (${o.status})`}
                      >
                        #{o.orderNumber} {o.customerName}
                      </Link>
                    ))}
                    {dayOrders.length > 3 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textAlign: 'center' }}>
                        +{dayOrders.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day View List */}
      {(viewMode === 'WEEK' || viewMode === 'DAY') && (
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            {viewMode === 'DAY' ? "Today's Agenda & Slots" : "Upcoming Scheduled Pickups"}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {initialOrders.slice(0, viewMode === 'DAY' ? 5 : 15).map((o) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{o.pickupDate} ({o.pickupTimeSlot}) — {o.customerName}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    #{o.orderNumber} • {formatCurrency(o.totalAmount)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-prep" style={{ fontSize: '0.78rem' }}>{o.status}</span>
                  <Link href={`/admin/orders/${o.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    Open Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Inspector & Capacity Manager Modal */}
      {selectedDateStr && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Date Details: {selectedDateStr}</h3>
              <button type="button" onClick={() => setSelectedDateStr(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: holidays.includes(selectedDateStr) ? '#FFF5F5' : 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <strong>Bakery Operating Status</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {holidays.includes(selectedDateStr) ? 'Closed for holiday / maintenance' : 'Open for scheduled customer pickups'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHoliday(selectedDateStr)}
                  className={`btn btn-sm ${holidays.includes(selectedDateStr) ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {holidays.includes(selectedDateStr) ? 'Unblock Date' : 'Block as Holiday'}
                </button>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Orders Booked on {selectedDateStr}</h4>
            {(ordersByDate[selectedDateStr] || []).length === 0 ? (
              <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>No orders currently scheduled for this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {(ordersByDate[selectedDateStr] || []).map((o) => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>
                      <strong>#{o.orderNumber}</strong> {o.customerName} ({o.pickupTimeSlot})
                    </div>
                    <Link href={`/admin/orders/${o.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => setSelectedDateStr(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

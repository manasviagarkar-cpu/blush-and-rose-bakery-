import React from 'react';
import { ORDER_STATUSES } from '@/lib/constants';

interface StatusTimelineProps {
  currentStatus: string;
  orderType: 'STANDARD' | 'CUSTOM_CAKE';
}

export function StatusTimeline({ currentStatus, orderType }: StatusTimelineProps) {
  const customSteps = [
    { key: ORDER_STATUSES.AWAITING_BAKER_REVIEW, label: 'Baker Review' },
    { key: ORDER_STATUSES.PRICE_SENT, label: 'Price Quotation' },
    { key: ORDER_STATUSES.DEPOSIT_PENDING, label: 'Deposit Payment' },
    { key: ORDER_STATUSES.CONFIRMED, label: 'Confirmed' },
    { key: ORDER_STATUSES.IN_PREPARATION, label: 'Baking & Decorating' },
    { key: ORDER_STATUSES.READY_FOR_PICKUP, label: 'Ready for Pickup' },
    { key: ORDER_STATUSES.COMPLETED, label: 'Completed' },
  ];

  const standardSteps = [
    { key: ORDER_STATUSES.CONFIRMED, label: 'Order Confirmed' },
    { key: ORDER_STATUSES.IN_PREPARATION, label: 'Baking & Preparing' },
    { key: ORDER_STATUSES.READY_FOR_PICKUP, label: 'Ready for Pickup' },
    { key: ORDER_STATUSES.COMPLETED, label: 'Completed' },
  ];

  const steps = orderType === 'CUSTOM_CAKE' ? customSteps : standardSteps;

  const isCancelled = currentStatus === ORDER_STATUSES.CANCELLED || currentStatus === ORDER_STATUSES.REJECTED;

  // Find index of current step
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div style={{ padding: '1.5rem 0' }}>
      {isCancelled ? (
        <div style={{
          backgroundColor: 'var(--status-cancelled-bg)',
          color: 'var(--status-cancelled-text)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 500,
          border: '1px solid #FCA5A5'
        }}>
          ⚠️ Order status: <strong>{currentStatus}</strong>. Please contact the bakery directly if you have any questions.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          gap: '0.5rem',
          position: 'relative',
        }}>
          {steps.map((step, idx) => {
            const isCompleted = currentIndex > idx || currentStatus === ORDER_STATUSES.COMPLETED;
            const isCurrent = currentIndex === idx;

            return (
              <div key={step.key} style={{ textAlign: 'center', position: 'relative' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? 'var(--color-primary)'
                      : isCurrent
                      ? '#FFFFFF'
                      : 'var(--bg-subtle)',
                    color: isCompleted
                      ? '#FFFFFF'
                      : isCurrent
                      ? 'var(--color-primary)'
                      : 'var(--text-light)',
                    border: isCurrent
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: isCurrent ? '0 0 0 4px var(--color-primary-light)' : 'none',
                    transition: 'var(--transition)',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent
                      ? 'var(--color-primary)'
                      : isCompleted
                      ? 'var(--text-main)'
                      : 'var(--text-light)',
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

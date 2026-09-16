'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentSimulationClientProps {
  orderId: string;
  orderNumber: string;
  trackingToken: string;
  paymentId: string;
  amount: number;
}

export function PaymentSimulationClient({
  orderId,
  orderNumber,
  trackingToken,
  paymentId,
  amount,
}: PaymentSimulationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleSimulatePayment = async (status: 'SUCCESS' | 'FAILED') => {
    setLoading(true);
    setErrorStatus(null);

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentId,
          amount,
          status,
          isMock: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment processing error');
      }

      if (status === 'SUCCESS') {
        router.push(`/track?orderId=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(trackingToken)}&paid=true`);
      } else {
        setErrorStatus('Simulated payment failure: Your card or test bank rejected the transaction. Please try again.');
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : 'Payment error occurred.');
      setLoading(false);
    }
  };

  return (
    <div>
      {errorStatus && (
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
          ⚠️ {errorStatus}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSimulatePayment('SUCCESS')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
        >
          {loading ? 'Authorizing Payment...' : '✓ Complete Test Deposit Payment (Mock Mode)'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSimulatePayment('FAILED')}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', color: '#B91C1C' }}
        >
          Simulate Payment Failure State
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => router.push(`/track?orderId=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(trackingToken)}`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cancel and return to order tracking
          </button>
        </div>
      </div>
    </div>
  );
}

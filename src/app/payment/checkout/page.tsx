import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { PaymentSimulationClient } from './PaymentSimulationClient';

interface Props {
  searchParams: Promise<{
    orderId?: string;
    paymentId?: string;
    amount?: string;
    isMock?: string;
  }>;
}

export default async function PaymentCheckoutPage({ searchParams }: Props) {
  const { orderId, paymentId, amount, isMock } = await searchParams;

  if (!orderId) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    notFound();
  }

  const payAmount = amount ? parseFloat(amount) : order.depositAmount;

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem', maxWidth: '640px' }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        {/* Safe Test Mode Banner */}
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <strong style={{ color: '#1E40AF', display: 'block', fontSize: '0.88rem' }}>
              SAFE PAYMENT ADAPTER ({isMock === 'true' ? 'TEST MODE' : 'RAZORPAY ADAPTER'})
            </strong>
            <span style={{ fontSize: '0.78rem', color: '#3B82F6' }}>
              Clearly marked safe test environment. Real payment funds will not be debited.
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
            Blush & Rose Bakery Checkout
          </span>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
            Pay Order Deposit
          </h2>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {formatCurrency(payAmount)}
          </div>
        </div>

        {/* Order Details Mini-Card */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order Reference:</span>
            <strong>{order.orderNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span>{order.customerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Cake Price:</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)', fontWeight: 600 }}>
            <span>Deposit Amount Due:</span>
            <span>{formatCurrency(payAmount)}</span>
          </div>
        </div>

        {/* Interactive Payment Simulator Form */}
        <PaymentSimulationClient
          orderId={order.id}
          orderNumber={order.orderNumber}
          trackingToken={order.trackingToken}
          paymentId={paymentId || `mock_${Date.now()}`}
          amount={payAmount}
        />
      </div>
    </div>
  );
}

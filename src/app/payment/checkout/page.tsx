import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

interface Props {
  searchParams: Promise<{
    orderId?: string;
    razorpay_payment_link_id?: string;
    razorpay_payment_link_reference_id?: string;
    razorpay_payment_link_status?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }>;
}

/**
 * /payment/checkout
 *
 * This page is the Razorpay callback destination after a customer completes or
 * cancels payment on the Razorpay-hosted payment page.
 *
 * It does NOT simulate payments or accept mock values.
 * The order is confirmed by the Razorpay webhook (/api/payment/webhook), not here.
 * This page simply shows the customer their order status and a tracking link.
 */
export default async function PaymentCallbackPage({ searchParams }: Props) {
  const {
    orderId,
    razorpay_payment_link_status,
    razorpay_payment_id,
  } = await searchParams;

  let order: { orderNumber: string; trackingToken: string; paymentStatus: string; customerName: string; depositAmount: number } | null = null;

  if (orderId) {
    order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        trackingToken: true,
        paymentStatus: true,
        customerName: true,
        depositAmount: true,
      },
    });
  }

  const paymentPaid = razorpay_payment_link_status === 'paid';

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem', maxWidth: '640px' }}>
      <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        {paymentPaid ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Payment Received</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Thank you! Your payment has been submitted to Razorpay. Your order will be confirmed
              once the payment is verified (usually within a few minutes).
            </p>
            {razorpay_payment_id && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Payment reference: <code>{razorpay_payment_id}</code>
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Payment Status</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {razorpay_payment_link_status === 'cancelled'
                ? 'Your payment was cancelled. No amount has been charged. You can pay again from your order tracking page.'
                : 'Please check your order tracking page for the latest payment and order status.'}
            </p>
          </>
        )}

        {order && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2rem',
            fontSize: '0.9rem',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order:</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
              <span>{order.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Deposit Amount:</span>
              <span>{formatCurrency(order.depositAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
              <span style={{ fontWeight: 600, color: order.paymentStatus === 'DEPOSIT_PAID' ? 'var(--color-success, green)' : 'var(--text-main)' }}>
                {order.paymentStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {order && (
            <Link
              href={`/track?orderId=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.trackingToken)}`}
              className="btn btn-primary"
              style={{ textAlign: 'center' }}
            >
              View Order Status →
            </Link>
          )}
          <Link href="/" className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>
            Return to Bakery Home
          </Link>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
          Payment processing and order confirmation are handled securely by Razorpay.
          If you have concerns, contact us with your order number.
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@blushrose.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>👩‍🍳</span>
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-primary)', fontWeight: 600 }}>
            Blush & Rose Bakery
          </span>
          <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>Baker Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Sign in to manage orders, approve custom bookings, and schedule pickups.
          </p>
        </div>

        {errorMsg && (
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
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Atelier Dashboard →'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <strong>Initial Demo Credentials:</strong>
          <div style={{ marginTop: '2px' }}>Email: <code>admin@blushrose.com</code></div>
          <div>Password: <code>admin123</code></div>
        </div>
      </div>
    </div>
  );
}

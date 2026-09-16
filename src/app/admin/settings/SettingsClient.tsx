'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SettingsClientProps {
  initialProfile: any;
}

export function SettingsClient({ initialProfile }: SettingsClientProps) {
  const router = useRouter();

  const [bakeryName, setBakeryName] = useState(initialProfile?.bakeryName || 'Blush & Rose Bakery');
  const [tagline, setTagline] = useState(initialProfile?.tagline || '');
  const [description, setDescription] = useState(initialProfile?.description || '');
  const [address, setAddress] = useState(initialProfile?.address || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [openingHours, setOpeningHours] = useState(initialProfile?.openingHours || '');
  const [pickupInstructions, setPickupInstructions] = useState(initialProfile?.pickupInstructions || '');
  const [noticeBanner, setNoticeBanner] = useState(initialProfile?.noticeBanner || '');
  const [minAdvanceNoticeDays, setMinAdvanceNoticeDays] = useState(initialProfile?.minAdvanceNoticeDays || 2);
  const [depositPercentage, setDepositPercentage] = useState(initialProfile?.depositPercentage || 40);
  const [cancellationPolicy, setCancellationPolicy] = useState(initialProfile?.cancellationPolicy || '');
  const [defaultSlotCapacity, setDefaultSlotCapacity] = useState(initialProfile?.defaultSlotCapacity || 4);
  const [heroImageUrl, setHeroImageUrl] = useState(initialProfile?.heroImageUrl || '');

  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bakeryName,
          tagline,
          description,
          address,
          phone,
          email,
          openingHours,
          pickupInstructions,
          noticeBanner,
          minAdvanceNoticeDays: Number(minAdvanceNoticeDays),
          depositPercentage: Number(depositPercentage),
          cancellationPolicy,
          defaultSlotCapacity: Number(defaultSlotCapacity),
          heroImageUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSavedMessage(true);
      router.refresh();
      setTimeout(() => setSavedMessage(false), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      {savedMessage && (
        <div style={{
          backgroundColor: 'var(--status-confirmed-bg)',
          color: 'var(--status-confirmed-text)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontWeight: 600,
          border: '1px solid #A7F3D0',
        }}>
          ✓ Bakery settings updated and published successfully!
        </div>
      )}

      {/* Brand & Identity */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          Brand & Identity
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Bakery Brand Name *</label>
            <input
              type="text"
              required
              value={bakeryName}
              onChange={(e) => setBakeryName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Bakery Story & Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Hero Image URL</label>
          <input
            type="url"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notice Banner Announcement (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 🌸 Special spring menu now available! Mother's Day bookings open."
            value={noticeBanner}
            onChange={(e) => setNoticeBanner(e.target.value)}
            className="form-input"
          />
          <span className="form-hint">Displayed at the very top of all customer pages. Leave blank to hide.</span>
        </div>
      </div>

      {/* Contact & Hours */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          Contact & Operating Hours
        </h3>

        <div className="form-group">
          <label className="form-label">Atelier Street Address *</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="form-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Contact Phone *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Orders Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Opening & Pickup Hours</label>
          <input
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Pickup & Arrival Instructions</label>
          <textarea
            value={pickupInstructions}
            onChange={(e) => setPickupInstructions(e.target.value)}
            className="form-textarea"
            style={{ minHeight: '75px' }}
          />
        </div>
      </div>

      {/* Ordering & Policy Rules */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          Booking Rules & Policies
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Min Advance Notice (Days) *</label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={minAdvanceNoticeDays}
              onChange={(e) => setMinAdvanceNoticeDays(Number(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deposit Percentage (%) *</label>
            <input
              type="number"
              min="10"
              max="100"
              required
              value={depositPercentage}
              onChange={(e) => setDepositPercentage(Number(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Slot Capacity *</label>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={defaultSlotCapacity}
              onChange={(e) => setDefaultSlotCapacity(Number(e.target.value))}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cancellation & Refund Policy *</label>
          <textarea
            required
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
            className="form-textarea"
          />
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '220px' }}
        >
          {loading ? 'Saving Settings...' : 'Save & Publish Settings'}
        </button>
      </div>
    </form>
  );
}

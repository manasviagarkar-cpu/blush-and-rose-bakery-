import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/domain/ProductCard';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const profile = await prisma.bakeryProfile.findUnique({
    where: { id: 'default' },
  });

  const featuredProductsDb = await prisma.product.findMany({
    where: { isAvailable: true, isFeatured: true },
    include: { variants: true },
    take: 6,
  });

  const featuredProducts: Product[] = featuredProductsDb.map((p) => ({
    ...p,
    galleryUrls: JSON.parse(p.galleryUrls || '[]'),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      isAvailable: v.isAvailable,
    })),
  }));

  const bakeryName = profile?.bakeryName || 'Blush & Rose Bakery';

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 6rem',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}>
        {/* Subtle decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(221, 163, 146, 0.25) 0%, rgba(253, 249, 245, 0) 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
                color: 'var(--color-primary)',
                marginBottom: '0.75rem',
              }}>
                Artisanal French Pâtisserie
              </span>

              <h1 style={{ marginBottom: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Handcrafted celebration cakes for life’s sweetest moments.
              </h1>

              <p style={{ fontSize: '1.12rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: '540px' }}>
                {profile?.description || 'From intimate birthday gatherings to grand multi-tiered wedding celebrations, each cake is tailored to your taste and artistic vision.'}
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/custom-cake" className="btn btn-primary btn-lg">
                  ✨ Book a Custom Cake
                </Link>
                <Link href="/products" className="btn btn-secondary btn-lg">
                  Browse Menu & Treats
                </Link>
              </div>

              {/* Advance Notice Highlight */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginTop: '2.5rem',
                padding: '0.65rem 1.1rem',
                backgroundColor: 'var(--bg-warm-tint)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                <span>🕒</span>
                <span>Minimum advance notice: <strong>{profile?.minAdvanceNoticeDays || 2} days</strong> for scheduled pickup</span>
              </div>
            </div>

            {/* Hero Image / Vignette */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                border: '4px solid #FFFFFF',
              }}>
                <img
                  src={profile?.heroImageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop'}
                  alt="Artisan cake from Blush & Rose Bakery"
                  style={{ width: '100%', height: '420px', objectFit: 'cover' }}
                />
              </div>

              {/* Floating review/badge card */}
              <div style={{
                position: 'absolute',
                bottom: '-24px',
                left: '20px',
                backgroundColor: '#FFFFFF',
                padding: '1rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-color)',
                maxWidth: '260px',
              }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                  ★★★★★ 100% Bespoke
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px', fontWeight: 500 }}>
                  “The Lambeth piping was breathtaking and the rose compote was divine.”
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
                Fresh From The Oven
              </span>
              <h2 style={{ marginTop: '0.25rem' }}>Signature Creations</h2>
            </div>
            <Link href="/products" className="btn btn-secondary btn-sm">
              View Complete Menu →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Custom Cake Showcase / Workflow Section */}
      <section style={{ backgroundColor: 'var(--bg-warm-tint)', padding: '5rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ maxWidth: '680px', margin: '0 auto 3.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
              How It Works
            </span>
            <h2 style={{ marginTop: '0.35rem', marginBottom: '1rem' }}>
              Bespoke Custom Cake Ordering Made Simple
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem' }}>
              No more messy WhatsApp messages or lost cake sketches. Our structured booking system takes your vision from dream to celebration.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 1.25rem', fontWeight: 700 }}>
                1
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>Design & Submit</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Choose tiers, sponge flavor, fillings, piping style, and upload inspiration reference photos.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 1.25rem', fontWeight: 700 }}>
                2
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>Baker Review & Quote</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Our head baker reviews your design, confirms ingredient availability, and provides a clear price quote.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 1.25rem', fontWeight: 700 }}>
                3
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>Deposit & Schedule</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Approve your quote and secure your date with a 40% deposit via secure online checkout.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 1.25rem', fontWeight: 700 }}>
                4
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>Bake & Pickup</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Track real-time progress online. Collect your cake securely boxed at your scheduled time slot.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/custom-cake" className="btn btn-primary btn-lg">
              Start Your Custom Booking Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Bakery Information & Pickup Details */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '3rem 2.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2.5rem',
          }}>
            <div>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
                Visit & Collect
              </span>
              <h3 style={{ marginTop: '0.35rem', marginBottom: '1rem', fontSize: '1.75rem' }}>
                {bakeryName}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                All cakes and pastries are baked fresh in our dedicated atelier kitchen. We operate by pre-order and scheduled pickup to ensure zero waste and maximum quality.
              </p>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div><strong>📍 Atelier:</strong> {profile?.address}</div>
                <div><strong>📞 Direct:</strong> {profile?.phone}</div>
                <div><strong>✉️ Orders:</strong> {profile?.email}</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '1.75rem', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                🚗 Pickup & Collection Guide
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                {profile?.pickupInstructions}
              </p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.85rem' }}>
                <strong>Operating Hours:</strong>
                <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{profile?.openingHours}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

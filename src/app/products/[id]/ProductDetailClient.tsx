'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCart();

  const allImages = [product.imageUrl, ...(product.galleryUrls || [])].filter(Boolean);
  const [activeImage, setActiveImage] = useState<string>(allImages[0] || product.imageUrl);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [cakeMessage, setCakeMessage] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      quantity,
      variantName: selectedVariant?.name,
      imageUrl: product.imageUrl,
      isEggless: product.isEggless,
      cakeMessage: cakeMessage.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    });

    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
    }, 4000);
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <nav style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'inherit' }}>Home</Link>
        {' / '}
        <Link href="/products" style={{ color: 'inherit' }}>Products</Link>
        {' / '}
        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main product showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem' }}>
        {/* Left: Gallery */}
        <div>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingTop: '85%',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <img
              src={activeImage}
              alt={product.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Thumbnails if multiple images */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImage === img ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'none',
                  }}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Order Config */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.category}
            </span>
            {product.isEggless && (
              <span className="badge badge-eggless">🌱 Eggless</span>
            )}
          </div>

          <h1 style={{ marginBottom: '0.75rem', fontSize: '2.2rem' }}>{product.name}</h1>

          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem' }}>
            {formatCurrency(currentPrice)}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            {product.description}
          </p>

          {/* Variants Selector */}
          {product.variants.length > 0 && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Select Size / Variant:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                        color: 'var(--text-main)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', marginTop: '2px' }}>
                        {formatCurrency(v.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Cake Message */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">
              Custom Inscription / Cake Plaque (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g., Happy 25th Birthday Sarah! ♡"
              value={cakeMessage}
              onChange={(e) => setCakeMessage(e.target.value)}
              maxLength={60}
              className="form-input"
            />
            <span className="form-hint">Max 60 characters. Piped by hand in delicate script.</span>
          </div>

          {/* Special Instructions */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Special Requests / Notes (Optional):</label>
            <textarea
              placeholder="e.g. Please include 6 celebration candles, or note severe peanut allergy..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="form-textarea"
              style={{ minHeight: '75px' }}
            />
          </div>

          {/* Quantity and Add to Cart button */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ width: '36px', height: '42px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
              >
                −
              </button>
              <span style={{ width: '36px', textAlign: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                style={{ width: '36px', height: '42px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="btn btn-primary btn-lg"
              disabled={!product.isAvailable}
              style={{ flex: 1, minWidth: '200px' }}
            >
              {product.isAvailable ? `Add to Cart • ${formatCurrency(currentPrice * quantity)}` : 'Sold Out'}
            </button>
          </div>

          {/* Feedback Banner when added */}
          {addedNotice && (
            <div style={{
              backgroundColor: 'var(--status-confirmed-bg)',
              border: '1px solid #A7F3D0',
              color: 'var(--status-confirmed-text)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                ✓ <strong>Added to cart!</strong> ({quantity}x {product.name})
              </div>
              <Link href="/cart" className="btn btn-sm btn-secondary" style={{ borderColor: 'var(--status-confirmed-text)' }}>
                View Cart & Checkout →
              </Link>
            </div>
          )}

          {/* Preparation and Allergens Disclosure */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem' }}>
            <div>
              <strong>⏱ Preparation & Notice:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Requires at least <strong>{product.preparationTime}</strong> advance scheduling.
              </div>
            </div>

            <div>
              <strong>🌾 Ingredients:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                {product.ingredients}
              </div>
            </div>

            <div>
              <strong>⚠️ Allergen Notice:</strong>
              <div style={{ color: '#B91C1C', marginTop: '2px', fontWeight: 500 }}>
                {product.allergens}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

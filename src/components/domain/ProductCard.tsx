import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
      {/* Image container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '75%', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          className="product-image-hover"
        />

        {/* Badges on top of image */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {product.isEggless && (
            <span className="badge badge-eggless">
              🌱 Eggless
            </span>
          )}
          {product.isFeatured && (
            <span className="badge" style={{ backgroundColor: '#FFF0F5', color: '#B83280', border: '1px solid #FBB6CE' }}>
              ★ Signature
            </span>
          )}
        </div>

        {!product.isAvailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(51, 33, 31, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}>
            SOLD OUT TODAY
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
          {product.category}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
          <Link href={`/products/${product.id}`} style={{ color: 'inherit' }}>
            {product.name}
          </Link>
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.shortDescription}
        </p>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>⏱ Prep:</span>
          <strong>{product.preparationTime}</strong>
        </div>

        {/* Price & Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>From</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
              {formatCurrency(product.price)}
            </span>
          </div>

          <Link href={`/products/${product.id}`} className="btn btn-secondary btn-sm">
            Select & Order →
          </Link>
        </div>
      </div>
    </div>
  );
}

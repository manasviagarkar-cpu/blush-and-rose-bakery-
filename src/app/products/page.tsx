import React from 'react';
import { prisma } from '@/lib/db';
import { Product } from '@/types';
import { ProductCatalogueClient } from './ProductCatalogueClient';

import { fallbackProducts } from '@/lib/fallbackData';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  let products: Product[] = [];
  try {
    const productsDb = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });

    if (productsDb && productsDb.length > 0) {
      products = productsDb.map((p) => ({
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
    }
  } catch (e) {
    console.warn('Could not load products from DB in ProductsPage, using fallback:', e);
  }

  if (products.length === 0) {
    products = fallbackProducts;
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '2rem auto 3rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Daily Atelier Menu
        </span>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
          Our Baked Collection
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Browse our signature celebration cakes, petite tarts, and baked goods. Pre-order online for freshly scheduled atelier pickup.
        </p>
      </div>

      <ProductCatalogueClient initialProducts={products} />
    </div>
  );
}

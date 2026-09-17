import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Product } from '@/types';
import { ProductDetailClient } from './ProductDetailClient';

import { fallbackProducts } from '@/lib/fallbackData';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  let productDb = null;
  try {
    productDb = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
  } catch (e) {
    console.warn('Could not load product from DB, checking fallback:', e);
  }

  if (!productDb) {
    const fallback = fallbackProducts.find((p) => p.id === id || p.slug === id);
    if (fallback) {
      return (
        <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
          <ProductDetailClient product={fallback} />
        </div>
      );
    }
    notFound();
  }

  const product: Product = {
    ...productDb,
    galleryUrls: JSON.parse(productDb.galleryUrls || '[]'),
    createdAt: productDb.createdAt.toISOString(),
    updatedAt: productDb.updatedAt.toISOString(),
    variants: productDb.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      isAvailable: v.isAvailable,
    })),
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      <ProductDetailClient product={product} />
    </div>
  );
}

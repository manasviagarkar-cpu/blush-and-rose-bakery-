import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Product } from '@/types';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const productDb = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!productDb) {
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

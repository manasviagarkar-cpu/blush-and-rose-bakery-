import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProductManagementClient } from './ProductManagementClient';

export default async function AdminProductsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const productsDb = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: 'desc' },
  });

  const products = productsDb.map((p) => ({
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

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Catalogue Administration
        </span>
        <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
          Bakery Products & Creations
        </h1>
      </div>

      <ProductManagementClient initialProducts={products} />
    </div>
  );
}

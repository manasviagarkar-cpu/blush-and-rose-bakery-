'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

interface ProductManagementClientProps {
  initialProducts: Product[];
}

export function ProductManagementClient({ initialProducts }: ProductManagementClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[1]);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [preparationTime, setPreparationTime] = useState('24 Hours');
  const [isEggless, setIsEggless] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [allergens, setAllergens] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<{ name: string; price: number }[]>([
    { name: '6" Petite (6-8 servings)', price: 50 },
    { name: '8" Classic (12-16 servings)', price: 75 },
  ]);

  const [loading, setLoading] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory(PRODUCT_CATEGORIES[1]);
    setShortDescription('');
    setDescription('');
    setPrice(50);
    setImageUrl('https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop');
    setPreparationTime('24 Hours');
    setIsEggless(false);
    setIngredients('Flour, butter, sugar, milk, vanilla bean');
    setAllergens('Contains Dairy, Gluten');
    setIsAvailable(true);
    setIsFeatured(false);
    setVariants([
      { name: '6" Petite (6-8 servings)', price: 50 },
      { name: '8" Classic (12-16 servings)', price: 75 },
    ]);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category as any);
    setShortDescription(p.shortDescription);
    setDescription(p.description);
    setPrice(p.price);
    setImageUrl(p.imageUrl);
    setPreparationTime(p.preparationTime);
    setIsEggless(p.isEggless);
    setIngredients(p.ingredients);
    setAllergens(p.allergens);
    setIsAvailable(p.isAvailable);
    setIsFeatured(Boolean(p.isFeatured));
    setVariants(p.variants.map((v) => ({ name: v.name, price: v.price })));
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const payload = {
        id: editingProduct?.id,
        name,
        category,
        shortDescription,
        description,
        price,
        imageUrl,
        preparationTime,
        isEggless,
        ingredients,
        allergens,
        isAvailable,
        isFeatured,
        variants,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save product');
      }

      setShowModal(false);
      router.refresh();
      // Reload products
      const listRes = await fetch('/api/admin/products');
      const listData = await listRes.json();
      if (listData.products) {
        setProducts(listData.products);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleToggleAvailability = async (p: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, isAvailable: !p.isAvailable }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, isAvailable: !item.isAvailable } : item))
        );
      }
    } catch (e) {
      alert('Toggle failed');
    }
  };

  return (
    <div>
      {/* Header action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Manage your daily menu, recipes, prices, allergens, and available variants.
        </p>
        <button type="button" onClick={openAddModal} className="btn btn-primary">
          + Add New Product
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Dietary</th>
              <th>Availability</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={{ width: '60px' }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.shortDescription}
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.category}</span>
                </td>
                <td>
                  <strong>{formatCurrency(p.price)}</strong>
                </td>
                <td>
                  {p.isEggless ? (
                    <span className="badge badge-eggless" style={{ fontSize: '0.75rem' }}>🌱 Eggless</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Standard</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(p)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: p.isAvailable ? '#047857' : '#B91C1C',
                    }}
                  >
                    {p.isAvailable ? '✓ Available' : '✕ Sold Out'}
                  </button>
                </td>
                <td>
                  {p.isFeatured ? <span style={{ color: '#B83280', fontSize: '0.8rem', fontWeight: 600 }}>★ Signature</span> : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', color: '#B91C1C' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>
                {editingProduct ? 'Edit Product' : 'Add New Bakery Creation'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Base Starting Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preparation Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24 Hours, Same Day"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL *</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Tagline / Summary</label>
                <input
                  type="text"
                  placeholder="One sentence summary for cards"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Description *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Ingredients</label>
                  <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Allergens</label>
                  <input
                    type="text"
                    value={allergens}
                    onChange={(e) => setAllergens(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={isEggless}
                    onChange={(e) => setIsEggless(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>🌱 Eggless / Vegetarian</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>Currently Available</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>★ Signature / Featured</span>
                </label>
              </div>

              {/* Sizes / Variants */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Sizes / Variants</label>
                  <button
                    type="button"
                    onClick={() => setVariants((v) => [...v, { name: 'New Size', price: 60 }])}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    + Add Variant
                  </button>
                </div>

                {variants.map((v, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. 8 inch Classic"
                      value={v.name}
                      onChange={(e) => {
                        const next = [...variants];
                        next[idx].name = e.target.value;
                        setVariants(next);
                      }}
                      className="form-input"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => {
                        const next = [...variants];
                        next[idx].price = Number(e.target.value);
                        setVariants(next);
                      }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/domain/ProductCard';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

interface ProductCatalogueClientProps {
  initialProducts: Product[];
}

export function ProductCatalogueClient({ initialProducts }: ProductCatalogueClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [egglessOnly, setEgglessOnly] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      // Eggless filter
      if (egglessOnly && !product.isEggless) {
        return false;
      }

      // Search query filter (matches name, description, ingredients)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.shortDescription.toLowerCase().includes(q);
        const matchesIng = product.ingredients.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesIng) {
          return false;
        }
      }

      return true;
    });
  }, [initialProducts, selectedCategory, searchQuery, egglessOnly]);

  return (
    <div>
      {/* Search and Filters Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {/* Top Row: Search Input & Eggless Checkbox */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '450px' }}>
            <input
              type="text"
              placeholder="Search by flavor, pastry name, or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }}>
              🔍
            </span>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={egglessOnly}
              onChange={(e) => setEgglessOnly(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <span>🌱 Eggless / Vegetarian only</span>
          </label>
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Count Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        <div>
          Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'creation' : 'creations'}
        </div>
        {(searchQuery || selectedCategory !== 'All' || egglessOnly) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setEgglessOnly(false);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧁</div>
          <h3>No treats found</h3>
          <p>
            We couldn’t find any baked items matching your search or filters. Try adjusting your keywords or clearing the category filter.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setEgglessOnly(false);
            }}
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

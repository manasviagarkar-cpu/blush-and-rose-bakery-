'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_TIERS,
  CAKE_FLAVORS,
  CAKE_FILLINGS,
  FROSTING_TYPES,
  FROSTING_COLORS,
  DESIGN_STYLES,
  OCCASIONS,
  PICKUP_TIME_SLOTS,
} from '@/lib/constants';
import { formatCurrency, isValidBookingDate } from '@/lib/utils';
import { validateCustomCakeRequest, validateUploadedFile } from '@/lib/validators';

interface CustomCakeFormProps {
  minAdvanceDays: number;
  holidayDates: string[];
}

// ------------------------------------------------------------------
// Color palette that maps frosting color names → CSS color values
// ------------------------------------------------------------------
const FROSTING_COLOR_MAP: Record<string, { base: string; mid: string; dark: string; accent: string }> = {
  'Warm Cream & Ivory':       { base: '#FDF6E3', mid: '#F5E6C8', dark: '#D4A96A', accent: '#C8906A' },
  'Soft Blush & Rose':        { base: '#FADADD', mid: '#F4A7B9', dark: '#C2607D', accent: '#E8758E' },
  'Sage & Eucalyptus':        { base: '#C8D8C0', mid: '#96B89A', dark: '#557A5A', accent: '#6A9470' },
  'Vintage Peach & Gold':     { base: '#FFCBA4', mid: '#F4A261', dark: '#B5590A', accent: '#D4A017' },
  'Dusty Blue':               { base: '#B2C8D8', mid: '#7EA8C0', dark: '#3A6480', accent: '#5A84A4' },
  'Natural Chocolate':        { base: '#8B5E3C', mid: '#6B3F1F', dark: '#3D1C0A', accent: '#C68642' },
  'Custom Pastel Palette':    { base: '#E8D5F0', mid: '#C8A8E0', dark: '#8B5CAD', accent: '#D4A0E8' },
};

// Maps design styles → decoration element description for SVG
const DESIGN_DECORATION_MAP: Record<string, string> = {
  'Vintage Lambeth / Ruffle Piping':       'ruffles',
  'Modern Minimalist with Fresh Florals':  'florals',
  'Textured Palette Knife Botanical':      'botanical',
  'Rustic Semi-Naked with Berry Cascades': 'berries',
  'Gold Leaf & Pearl Elegance':            'gold',
  'Whimsical Children / Themed':           'whimsical',
};

// ------------------------------------------------------------------
// 3-D Cake SVG — reactive to tiers, color, shape, style, message
// ------------------------------------------------------------------
interface CakeSVGProps {
  tiers: string;
  frostingColor: string;
  designStyle: string;
  shape: string;
  cakeMessage: string;
  isEggless: boolean;
}

function CakeSVG({ tiers, frostingColor, designStyle, shape, cakeMessage, isEggless }: CakeSVGProps) {
  const palette = FROSTING_COLOR_MAP[frostingColor] ?? FROSTING_COLOR_MAP['Soft Blush & Rose'];
  const decoration = DESIGN_DECORATION_MAP[designStyle] ?? 'florals';
  const numTiers = tiers === '3 Tiers' ? 3 : tiers === '2 Tiers' ? 2 : 1;

  // Tier dimensions (bottom → top)
  const tierDefs =
    numTiers === 3
      ? [
          { w: 180, h: 54, rx: shape === 'Square' ? 2 : 6 },   // bottom (tier 1 - largest)
          { w: 130, h: 44, rx: shape === 'Square' ? 2 : 6 },   // middle (tier 2 - medium)
          { w:  86, h: 36, rx: shape === 'Square' ? 2 : 5 },   // top (tier 3 - smallest)
        ]
      : numTiers === 2
      ? [
          { w: 180, h: 54, rx: shape === 'Square' ? 2 : 6 },   // bottom (tier 1 - largest)
          { w: 110, h: 42, rx: shape === 'Square' ? 2 : 5 },   // top (tier 2 - smaller)
        ]
      : [
          { w: 180, h: 60, rx: shape === 'Square' ? 2 : 10 },  // single tier
        ];

  const svgH = 280;
  const cx = 130; // horizontal center

  // Calculate y positions (stack bottom-up from the plate baseline)
  const baseY = svgH - 32; // plate baseline
  const tiers3D: { x: number; y: number; w: number; h: number; rx: number }[] = [];
  let curY = baseY;
  for (let i = 0; i < tierDefs.length; i++) {
    const td = tierDefs[i];
    curY -= td.h;
    tiers3D.push({ x: cx - td.w / 2, y: curY, w: td.w, h: td.h, rx: td.rx });
    curY -= 4; // gap between tiers
  }

  const topTier = tiers3D[tiers3D.length - 1];
  const topCenterX = topTier.x + topTier.w / 2;
  const topCenterY = topTier.y;

  return (
    <svg
      viewBox={`0 0 260 ${svgH}`}
      style={{ width: '100%', maxWidth: '260px', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.18))' }}
      aria-label="3D cake model preview"
    >
      <defs>
        {/* Frosting gradient for each tier face */}
        <linearGradient id="cakeFace" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={palette.mid} />
          <stop offset="55%"  stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.mid} />
        </linearGradient>
        {/* Top face (top-down ellipse) shading */}
        <radialGradient id="cakeTop" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.mid} />
        </radialGradient>
        {/* Side darker shadow */}
        <linearGradient id="cakeSide" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={palette.mid} stopOpacity="0.9" />
          <stop offset="100%" stopColor={palette.dark} stopOpacity="0.7" />
        </linearGradient>
        {/* Plate */}
        <radialGradient id="plateGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8DDD0" />
        </radialGradient>
        {/* Glow / ambient */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* === PLATE === */}
      <ellipse cx={cx} cy={baseY + 14} rx={100} ry={12} fill="url(#plateGrad)" opacity="0.9"/>
      <ellipse cx={cx} cy={baseY + 14} rx={100} ry={12} fill="none" stroke="#C8B89A" strokeWidth="1"/>

      {/* === TIERS (bottom to top) === */}
      {tiers3D.map((td, idx) => {
        const isBottom = idx === 0;
        const ellipseRy = td.rx * 0.45; // perspective ellipse height

        // Decorative band height on tier body
        const bandH = Math.max(8, td.h * 0.22);

        return (
          <g key={idx}>
            {/* Bottom ellipse (perspective depth) */}
            <ellipse
              cx={td.x + td.w / 2}
              cy={td.y + td.h}
              rx={td.w / 2}
              ry={ellipseRy}
              fill={palette.dark}
              opacity="0.35"
            />
            {/* Tier body (main frosting face) */}
            <rect
              x={td.x} y={td.y}
              width={td.w} height={td.h}
              rx={td.rx} ry={td.rx}
              fill="url(#cakeFace)"
              stroke={palette.mid}
              strokeWidth="1"
            />
            {/* Decorative piping band at bottom of each tier */}
            <rect
              x={td.x} y={td.y + td.h - bandH}
              width={td.w} height={bandH}
              rx={td.rx}
              fill={palette.mid}
              opacity="0.7"
            />
            {/* Top ellipse (3D cap) */}
            <ellipse
              cx={td.x + td.w / 2}
              cy={td.y}
              rx={td.w / 2}
              ry={ellipseRy}
              fill="url(#cakeTop)"
              stroke={palette.mid}
              strokeWidth="0.8"
            />

            {/* ---- Decoration overlays per style ---- */}
            {decoration === 'ruffles' && (
              <>
                {Array.from({ length: Math.floor(td.w / 14) }).map((_, i) => (
                  <path
                    key={i}
                    d={`M${td.x + 8 + i * 14},${td.y + bandH} Q${td.x + 14 + i * 14},${td.y + bandH - 8} ${td.x + 20 + i * 14},${td.y + bandH}`}
                    fill="none" stroke={palette.base} strokeWidth="2" opacity="0.8"
                  />
                ))}
              </>
            )}
            {decoration === 'florals' && (
              <>
                {[0.25, 0.5, 0.75].map((pos, i) => (
                  <g key={i} transform={`translate(${td.x + td.w * pos},${td.y + td.h * 0.42})`}>
                    <circle r="5" fill={palette.accent} opacity="0.85" />
                    <circle r="2.5" fill="#FFFFFF" opacity="0.7" />
                    {[0,72,144,216,288].map((deg) => (
                      <ellipse key={deg} cx={Math.cos(deg*Math.PI/180)*6} cy={Math.sin(deg*Math.PI/180)*6}
                        rx="3" ry="2" fill={palette.accent} opacity="0.5"
                        transform={`rotate(${deg})`} />
                    ))}
                  </g>
                ))}
              </>
            )}
            {decoration === 'gold' && (
              <>
                <rect x={td.x + 4} y={td.y + 6} width={td.w - 8} height="2" rx="1" fill="#D4A017" opacity="0.75" />
                {Array.from({ length: Math.floor(td.w / 18) }).map((_, i) => (
                  <circle key={i} cx={td.x + 12 + i * 18} cy={td.y + 14} r="3" fill="#D4A017" opacity="0.8" />
                ))}
              </>
            )}
            {decoration === 'berries' && (
              <>
                {[0.2, 0.45, 0.7].map((pos, i) => (
                  <g key={i}>
                    <circle cx={td.x + td.w * pos} cy={td.y + 10} r="4.5" fill="#C0392B" opacity="0.85" />
                    <circle cx={td.x + td.w * pos + 1} cy={td.y + 9} r="1.5" fill="#FFFFFF" opacity="0.5" />
                  </g>
                ))}
              </>
            )}
            {decoration === 'botanical' && (
              <>
                <path
                  d={`M${td.x + td.w * 0.3},${td.y + 8} C${td.x + td.w * 0.4},${td.y + 20} ${td.x + td.w * 0.6},${td.y + 10} ${td.x + td.w * 0.7},${td.y + 8}`}
                  fill="none" stroke="#557A5A" strokeWidth="1.5" opacity="0.7"
                />
                {isBottom && (
                  <path
                    d={`M${td.x + td.w * 0.5},${td.y + 12} C${td.x + td.w * 0.45},${td.y + 28} ${td.x + td.w * 0.55},${td.y + 22} ${td.x + td.w * 0.6},${td.y + 20}`}
                    fill="none" stroke="#96B89A" strokeWidth="1.2" opacity="0.6"
                  />
                )}
              </>
            )}
            {decoration === 'whimsical' && (
              <>
                {['★','♥','✿'].slice(0, Math.min(3, Math.floor(td.w / 40) + 1)).map((sym, i) => (
                  <text
                    key={i}
                    x={td.x + 14 + i * (td.w / 3)}
                    y={td.y + td.h * 0.5}
                    fontSize="10" fill={palette.dark} textAnchor="middle" opacity="0.7"
                  >{sym}</text>
                ))}
              </>
            )}
          </g>
        );
      })}

      {/* === CANDLE on top tier === */}
      <rect x={topCenterX - 4} y={topCenterY - 28} width={8} height={22} rx={3}
        fill={isEggless ? '#96B89A' : palette.accent} opacity="0.95" />
      {/* Flame */}
      <ellipse cx={topCenterX} cy={topCenterY - 32} rx={4} ry={6}
        fill="#FFCD3C" opacity="0.95" filter="url(#glow)" />
      <ellipse cx={topCenterX} cy={topCenterY - 31} rx={2} ry={3.5}
        fill="#FF8C00" opacity="0.8" />

      {/* === Cake message plaque === */}
      {cakeMessage && (
        <g>
          <rect
            x={topTier.x - 4} y={topTier.y + topTier.h * 0.3}
            width={topTier.w + 8} height={18}
            rx={4} fill="#FFFFFF" opacity="0.82" stroke={palette.mid} strokeWidth="0.8"
          />
          <text
            x={topTier.x + topTier.w / 2}
            y={topTier.y + topTier.h * 0.3 + 13}
            fontSize="8.5" fill={palette.dark}
            textAnchor="middle" fontStyle="italic"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {cakeMessage.length > 20 ? cakeMessage.slice(0, 18) + '…' : cakeMessage}
          </text>
        </g>
      )}

      {/* === Eggless badge === */}
      {isEggless && (
        <g transform={`translate(${cx + 78}, ${tiers3D[0].y + 6})`}>
          <circle r="13" fill="#557A5A" opacity="0.92" />
          <text fontSize="10" textAnchor="middle" dy="4" fill="#FFFFFF">🌱</text>
        </g>
      )}

      {/* Subtle ambient shadow below plate */}
      <ellipse cx={cx} cy={baseY + 24} rx={95} ry={7} fill="#000000" opacity="0.08" />
    </svg>
  );
}

// ------------------------------------------------------------------
// Main Form
// ------------------------------------------------------------------
export function CustomCakeForm({ minAdvanceDays, holidayDates }: CustomCakeFormProps) {
  const minDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + minAdvanceDays);
    return d.toISOString().split('T')[0];
  }, [minAdvanceDays]);

  // Form State
  const [size, setSize] = useState(CAKE_SIZES[0].label);
  const [shape, setShape] = useState(CAKE_SHAPES[0]);
  const [tiers, setTiers] = useState(CAKE_TIERS[0]);
  const [flavor, setFlavor] = useState(CAKE_FLAVORS[0]);
  const [filling, setFilling] = useState(CAKE_FILLINGS[0]);
  const [frostingType, setFrostingType] = useState(FROSTING_TYPES[0]);
  const [frostingColor, setFrostingColor] = useState(FROSTING_COLORS[1]); // Soft Blush & Rose default
  const [designStyle, setDesignStyle] = useState(DESIGN_STYLES[0]);
  const [toppings, setToppings] = useState('Fresh Florals & Macarons');
  const [isEggless, setIsEggless] = useState(false);
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [cakeMessage, setCakeMessage] = useState('');
  const [pickupDate, setPickupDate] = useState(minDateStr);
  const [pickupTimeSlot, setPickupTimeSlot] = useState(PICKUP_TIME_SLOTS[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [allergies, setAllergies] = useState('');

  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderNumber: string;
    trackingToken: string;
  } | null>(null);

  // Base price estimate
  const baseEstimate = useMemo(() => {
    const matchedSize = CAKE_SIZES.find((s) => s.label === size);
    let base = matchedSize ? matchedSize.basePrice : 1800;
    if (tiers === '2 Tiers') base += 1200;
    if (tiers === '3 Tiers') base += 2500;
    return base;
  }, [size, tiers]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateUploadedFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setReferenceImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors = validateCustomCakeRequest({ customerName, customerPhone, customerEmail, size, flavor, pickupDate, pickupTimeSlot });
    if (errors.length > 0) { setErrorMessage(errors[0].message); return; }
    const dateCheck = isValidBookingDate(pickupDate, minAdvanceDays, holidayDates);
    if (!dateCheck.valid) { setErrorMessage(dateCheck.reason || 'Invalid pickup date.'); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders/custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName, customerPhone, customerEmail, size, shape, tiers, flavor, filling,
          frostingType, frostingColor, designStyle, toppings, isEggless, occasion, cakeMessage,
          pickupDate, pickupTimeSlot, specialInstructions, allergies, referenceImageUrl,
          estimatedBasePrice: baseEstimate,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit custom cake request.');
      setSubmittedOrder({ orderNumber: data.orderNumber, trackingToken: data.trackingToken });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrder) {
    return (
      <div className="card" style={{ maxWidth: '680px', margin: '2rem auto', textAlign: 'center', padding: '3.5rem 2rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--status-confirmed-bg)', color: 'var(--status-confirmed-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>✓</div>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 600 }}>
          Request Successfully Submitted
        </span>
        <h2 style={{ marginTop: '0.35rem', marginBottom: '1rem' }}>We've Received Your Cake Vision!</h2>
        <div style={{ backgroundColor: 'var(--bg-warm-tint)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', margin: '1.5rem 0', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
            <strong>{submittedOrder.orderNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span>{customerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Scheduled Pickup:</span>
            <span>{pickupDate} ({pickupTimeSlot})</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', textAlign: 'left', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <h4 style={{ color: 'var(--color-rose-deep)', marginBottom: '0.5rem', fontSize: '1rem' }}>👩‍🍳 What Happens Next?</h4>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
            <li>Our head baker will carefully review your decoration requests and reference photo.</li>
            <li>We will confirm date availability and send an exact price quotation to your email ({customerEmail}).</li>
            <li>Once you review and approve the design quote, a 40% deposit link will be sent to confirm your slot.</li>
            <li>No payment is taken today. Your date will be held pending quote review.</li>
          </ol>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/track?orderId=${submittedOrder.orderNumber}&token=${submittedOrder.trackingToken}`} className="btn btn-primary">
            Track Request Status Online →
          </Link>
          <Link href="/" className="btn btn-secondary">Return to Homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
      {/* ===================== LEFT: FORM ===================== */}
      <div>
        <form onSubmit={handleSubmit} className="card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Step 1: Cake Architecture & Flavor
          </h2>

          {errorMessage && (
            <div style={{ backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-text)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 500, border: '1px solid #FCA5A5' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Size */}
          <div className="form-group">
            <label className="form-label">Cake Size & Servings *</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="form-select">
              {CAKE_SIZES.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label} — Base from {formatCurrency(s.basePrice)}
                </option>
              ))}
            </select>
          </div>

          {/* Shape & Tiers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cake Shape *</label>
              <select value={shape} onChange={(e) => setShape(e.target.value)} className="form-select">
                {CAKE_SHAPES.map((shp) => <option key={shp} value={shp}>{shp}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Number of Tiers *</label>
              <select value={tiers} onChange={(e) => setTiers(e.target.value)} className="form-select">
                {CAKE_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Flavor & Filling */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Sponge Flavor *</label>
              <select value={flavor} onChange={(e) => setFlavor(e.target.value)} className="form-select">
                {CAKE_FLAVORS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Filling *</label>
              <select value={filling} onChange={(e) => setFilling(e.target.value)} className="form-select">
                {CAKE_FILLINGS.map((fil) => <option key={fil} value={fil}>{fil}</option>)}
              </select>
            </div>
          </div>

          {/* Eggless */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
              <input type="checkbox" checked={isEggless} onChange={(e) => setIsEggless(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
              <span>🌱 Bake as 100% Eggless / Vegetarian sponge</span>
            </label>
          </div>

          {/* Step 2 */}
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Step 2: Design, Piping & Palette
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Frosting Type *</label>
              <select value={frostingType} onChange={(e) => setFrostingType(e.target.value)} className="form-select">
                {FROSTING_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frosting Palette / Color *</label>
              <select value={frostingColor} onChange={(e) => setFrostingColor(e.target.value)} className="form-select">
                {FROSTING_COLORS.map((fc) => <option key={fc} value={fc}>{fc}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Design Style / Theme *</label>
            <select value={designStyle} onChange={(e) => setDesignStyle(e.target.value)} className="form-select">
              {DESIGN_STYLES.map((ds) => <option key={ds} value={ds}>{ds}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Toppings & Accents</label>
            <input type="text" placeholder="e.g. Edible 24k gold leaf, fresh pink peony, French macarons..." value={toppings} onChange={(e) => setToppings(e.target.value)} className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Cake Inscription / Plaque Text</label>
            <input type="text" placeholder="e.g., Happy 30th Camille!" value={cakeMessage} onChange={(e) => setCakeMessage(e.target.value)} className="form-input" />
          </div>

          {/* Reference Image Upload */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Inspiration Reference Photo (Optional)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="form-input" style={{ padding: '0.5rem' }} />
            {imagePreview && (
              <div style={{ marginTop: '0.75rem', position: 'relative', width: '120px', height: '120px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={imagePreview} alt="Reference preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ marginTop: '0.75rem', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              💡 <em>"Reference images are used for inspiration. The finished cake may vary slightly because of ingredient availability, decoration techniques, colours, and handmade production."</em>
            </div>
          </div>

          {/* Step 3 */}
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Step 3: Event & Contact Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Celebration Occasion *</label>
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="form-select">
                {OCCASIONS.map((occ) => <option key={occ} value={occ}>{occ}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Date *</label>
              <input type="date" required min={minDateStr} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Pickup Time Slot *</label>
            <select value={pickupTimeSlot} onChange={(e) => setPickupTimeSlot(e.target.value)} className="form-select">
              {PICKUP_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Allergies / Dietary Restrictions</label>
              <input type="text" placeholder="e.g. Nut allergy, gluten sensitive..." value={allergies} onChange={(e) => setAllergies(e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Special Notes / Transport Notes</label>
              <input type="text" placeholder="e.g. Venue air conditioned..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Full Name *</label>
            <input type="text" required placeholder="Priya Sharma" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="form-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input type="tel" required placeholder="+91 98765 43210" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" required placeholder="priya@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="form-input" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.5rem' }}>
            {isSubmitting ? 'Submitting Design...' : 'Submit Custom Request For Review →'}
          </button>
        </form>
      </div>

      {/* ===================== RIGHT: 3D SUMMARY ===================== */}
      <div style={{ position: 'sticky', top: '100px' }}>
        <div className="card" style={{
          background: 'linear-gradient(160deg, #fff8f8 0%, #fff4ed 50%, #fff8fc 100%)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎂 Cake Design Preview
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Live 3D preview updates as you configure your cake ↓
          </p>

          {/* 3D SVG Cake Model */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            minHeight: '240px',
            padding: '1rem 0 0.5rem',
            background: 'radial-gradient(ellipse at 50% 85%, rgba(244,167,185,0.18) 0%, transparent 70%)',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            position: 'relative',
          }}>
            <CakeSVG
              tiers={tiers}
              frostingColor={frostingColor}
              designStyle={designStyle}
              shape={shape}
              cakeMessage={cakeMessage}
              isEggless={isEggless}
            />
            {/* Color swatch badge */}
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              backgroundColor: FROSTING_COLOR_MAP[frostingColor]?.base ?? '#FADADD',
              border: `2px solid ${FROSTING_COLOR_MAP[frostingColor]?.mid ?? '#F4A7B9'}`,
              borderRadius: '50%', width: '26px', height: '26px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'background-color 0.3s ease',
            }} title={frostingColor} />
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.87rem' }}>
            {[
              { label: 'Size', value: size },
              { label: 'Shape', value: shape },
              { label: 'Tiers', value: tiers },
              { label: 'Flavor', value: flavor },
              { label: 'Filling', value: filling },
              { label: 'Palette', value: frostingColor, highlight: true },
              { label: 'Style', value: designStyle },
              { label: 'Dietary', value: isEggless ? '🌱 Eggless / Vegetarian' : 'Standard Recipe' },
              ...(cakeMessage ? [{ label: 'Message', value: `"${cakeMessage}"`, italic: true }] : []),
            ].map(({ label, value, highlight, italic }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: '70px' }}>{label}:</span>
                <span style={{
                  fontWeight: highlight ? 600 : 500,
                  color: highlight ? 'var(--color-primary)' : italic ? 'var(--color-rose-deep)' : 'var(--text-main)',
                  fontStyle: italic ? 'italic' : 'normal',
                  textAlign: 'right',
                }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Price estimate */}
          <div style={{ borderTop: '2px solid var(--border-subtle)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Estimated Base Range:</span>
              <span style={{
                fontSize: '1.6rem', fontWeight: 700,
                fontFamily: 'var(--font-serif)', color: 'var(--color-rose-deep)',
                transition: 'all 0.3s ease',
              }}>
                {formatCurrency(baseEstimate)}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>*</span>
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px', lineHeight: 1.4 }}>
              *Estimate only. Final pricing is confirmed by our head baker after reviewing your design.
            </div>
          </div>

          {/* Deposit note */}
          <div style={{
            marginTop: '1rem', padding: '0.75rem', borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(210,135,162,0.12), rgba(255,200,180,0.12))',
            border: '1px solid rgba(210,135,162,0.25)', fontSize: '0.8rem',
            color: 'var(--text-muted)', lineHeight: 1.5,
          }}>
            💳 <strong>40% deposit</strong> ({formatCurrency(Math.round(baseEstimate * 0.4))}) secures your date once the baker approves your quote. No payment today.
          </div>
        </div>
      </div>
    </div>
  );
}

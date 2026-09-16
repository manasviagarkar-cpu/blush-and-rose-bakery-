export const ORDER_STATUSES = {
  NEW_REQUEST: 'New request',
  AWAITING_BAKER_REVIEW: 'Awaiting baker review',
  PRICE_SENT: 'Price sent',
  AWAITING_CUSTOMER_APPROVAL: 'Awaiting customer approval',
  DEPOSIT_PENDING: 'Deposit pending',
  CONFIRMED: 'Confirmed',
  IN_PREPARATION: 'In preparation',
  READY_FOR_PICKUP: 'Ready for pickup',
  PICKED_UP: 'Picked up',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const ORDER_STATUS_LIST: OrderStatus[] = [
  ORDER_STATUSES.NEW_REQUEST,
  ORDER_STATUSES.AWAITING_BAKER_REVIEW,
  ORDER_STATUSES.PRICE_SENT,
  ORDER_STATUSES.AWAITING_CUSTOMER_APPROVAL,
  ORDER_STATUSES.DEPOSIT_PENDING,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.IN_PREPARATION,
  ORDER_STATUSES.READY_FOR_PICKUP,
  ORDER_STATUSES.PICKED_UP,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.REJECTED,
  ORDER_STATUSES.CANCELLED,
];

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  FULLY_PAID: 'FULLY_PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PRODUCT_CATEGORIES = [
  'All',
  'Celebration Cakes',
  'Cupcakes & Pastries',
  'Artisan Breads',
  'Cookies & Tarts',
  'Seasonal Specials',
] as const;

export const CAKE_SIZES = [
  { id: '6inch', label: '6" Petite (6–8 servings)', basePrice: 1200 },
  { id: '8inch', label: '8" Classic (12–16 servings)', basePrice: 1800 },
  { id: '10inch', label: '10" Grand (20–25 servings)', basePrice: 2800 },
  { id: 'custom', label: 'Custom Multi-Tier (30+ servings)', basePrice: 4500 },
];

export const CAKE_SHAPES = ['Round', 'Heart', 'Square', 'Vintage Hexagon'];

export const CAKE_TIERS = ['1 Tier', '2 Tiers', '3 Tiers'];

export const CAKE_FLAVORS = [
  'Madagascar Vanilla Bean',
  'Valrhona Dark Chocolate',
  'Red Velvet with Cream Cheese',
  'Spiced Carrot & Walnut',
  'Earl Grey & Lavender',
  'Pistachio Rose',
  'Lemon Raspberry Ripple',
];

export const CAKE_FILLINGS = [
  'Classic Vanilla Buttercream',
  'Dark Chocolate Ganache',
  'Fresh Raspberry Compote',
  'Salted Caramel Drizzle',
  'Passionfruit Curd',
  'Cream Cheese Mousse',
];

export const FROSTING_TYPES = [
  'Swiss Meringue Buttercream (Silky & light)',
  'Whipped Ganache (Rich & velvety)',
  'Cream Cheese Frosting (Tangy & smooth)',
  'Traditional Buttercream (Sweet & classic)',
];

export const FROSTING_COLORS = [
  'Warm Cream & Ivory',
  'Soft Blush & Rose',
  'Sage & Eucalyptus',
  'Vintage Peach & Gold',
  'Dusty Blue',
  'Natural Chocolate',
  'Custom Pastel Palette',
];

export const DESIGN_STYLES = [
  'Vintage Lambeth / Ruffle Piping',
  'Modern Minimalist with Fresh Florals',
  'Textured Palette Knife Botanical',
  'Rustic Semi-Naked with Berry Cascades',
  'Gold Leaf & Pearl Elegance',
  'Whimsical Children / Themed',
];

export const OCCASIONS = [
  'Birthday',
  'Wedding / Reception',
  'Anniversary',
  'Baby Shower / Gender Reveal',
  'Graduation',
  'Corporate Event',
  'Just Because / Intimate Celebration',
];

export const PICKUP_TIME_SLOTS = [
  '10:00 AM - 11:30 AM',
  '11:30 AM - 01:00 PM',
  '01:30 PM - 03:00 PM',
  '03:00 PM - 04:30 PM',
  '04:30 PM - 06:00 PM',
];

export const DEFAULT_DEPOSIT_PERCENT = 40;
export const DEFAULT_MIN_ADVANCE_DAYS = 2;

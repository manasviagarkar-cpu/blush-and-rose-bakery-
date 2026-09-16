import { OrderStatus, PaymentStatus } from '@/lib/constants';

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  imageUrl: string;
  galleryUrls?: string[];
  isAvailable: boolean;
  isFeatured?: boolean;
  preparationTime: string;
  isEggless: boolean;
  ingredients: string;
  allergens: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantName?: string;
  imageUrl: string;
  isEggless: boolean;
  specialInstructions?: string;
  cakeMessage?: string;
}

export interface CustomCakeDetails {
  size: string;
  shape: string;
  tiers: string;
  flavor: string;
  filling: string;
  frostingType: string;
  frostingColor: string;
  designStyle: string;
  toppings: string;
  isEggless: boolean;
  occasion: string;
  cakeMessage: string;
  specialInstructions: string;
  allergies: string;
  referenceImageUrl?: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  cakeMessage?: string | null;
  specialInstructions?: string | null;
}

export interface StatusHistoryRecord {
  id: string;
  orderId: string;
  fromStatus?: string | null;
  toStatus: string;
  notes?: string | null;
  changedBy: string; // 'BAKER' | 'CUSTOMER' | 'SYSTEM'
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string; // 'RAZORPAY' | 'CASH' | 'CARD_OFFLINE' | 'MOCK_TEST'
  transactionId?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  isDeposit: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingToken: string;
  type: 'STANDARD' | 'CUSTOM_CAKE';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: OrderStatus;
  pickupDate: string;
  pickupTimeSlot: string;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  customerNotes?: string | null;
  bakerNotes?: string | null;
  customerApproved: boolean;
  customDetails?: CustomCakeDetails | null;
  items: OrderItemRecord[];
  payments: PaymentRecord[];
  statusHistory: StatusHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface BakerySettings {
  id: string;
  bakeryName: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  pickupInstructions: string;
  noticeBanner?: string | null;
  minAdvanceNoticeDays: number;
  depositPercentage: number;
  cancellationPolicy: string;
  defaultSlotCapacity: number;
  holidayDates: string[]; // ISO date strings
  heroImageUrl: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  internalNotes?: string | null;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
}

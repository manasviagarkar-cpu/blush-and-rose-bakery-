import { DEFAULT_DEPOSIT_PERCENT } from './constants';

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into readable format (e.g. "Sat, Oct 18, 2025")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generate a clean human-readable order number like "BR-8492"
 */
export function generateOrderNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const dateCode = new Date().toISOString().slice(2, 4);
  return `BR${dateCode}-${random}`;
}

/**
 * Generate a random 16-character tracking token for secure guest access
 */
export function generateTrackingToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Calculate required deposit and remaining balance
 */
export function calculatePaymentBreakdown(total: number, depositPercent: number = DEFAULT_DEPOSIT_PERCENT) {
  const deposit = Math.round((total * (depositPercent / 100)) * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;
  return {
    total,
    deposit,
    balance,
    depositPercent,
  };
}

/**
 * Check if a date is within booking advance notice and not in past
 */
export function isValidBookingDate(dateStr: string, minAdvanceDays: number, holidayDates: string[] = []): { valid: boolean; reason?: string } {
  const bookingDate = new Date(dateStr);
  bookingDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minAdvanceDays);

  if (bookingDate < minDate) {
    return {
      valid: false,
      reason: `Orders require at least ${minAdvanceDays} day(s) advance notice. Earliest available date is ${formatDate(minDate.toISOString())}.`,
    };
  }

  // Check holiday dates
  const isHoliday = holidayDates.some((h) => {
    const hDate = new Date(h);
    hDate.setHours(0, 0, 0, 0);
    return hDate.getTime() === bookingDate.getTime();
  });

  if (isHoliday) {
    return {
      valid: false,
      reason: 'The bakery is closed on the selected date for a scheduled holiday or maintenance.',
    };
  }

  return { valid: true };
}

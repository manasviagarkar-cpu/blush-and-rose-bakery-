export interface ValidationError {
  field: string;
  message: string;
}

export function validateCustomerContact(name?: string, phone?: string, email?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Please provide your full name (minimum 2 characters).' });
  }

  if (!phone || phone.trim().length < 7) {
    errors.push({ field: 'phone', message: 'Please provide a valid contact phone number.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });
  }

  return errors;
}

export function validateCustomCakeRequest(data: {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  size?: string;
  flavor?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
}): ValidationError[] {
  const errors = validateCustomerContact(data.customerName, data.customerPhone, data.customerEmail);

  if (!data.size || !data.size.trim()) {
    errors.push({ field: 'size', message: 'Please select a cake size or serving count.' });
  }

  if (!data.flavor || !data.flavor.trim()) {
    errors.push({ field: 'flavor', message: 'Please select a cake flavor.' });
  }

  if (!data.pickupDate || !data.pickupDate.trim()) {
    errors.push({ field: 'pickupDate', message: 'Please select a desired pickup date.' });
  }

  if (!data.pickupTimeSlot || !data.pickupTimeSlot.trim()) {
    errors.push({ field: 'pickupTimeSlot', message: 'Please select a preferred pickup time slot.' });
  }

  return errors;
}

export function validateStandardCheckout(data: {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  itemCount: number;
}): ValidationError[] {
  const errors = validateCustomerContact(data.customerName, data.customerPhone, data.customerEmail);

  if (data.itemCount === 0) {
    errors.push({ field: 'items', message: 'Your cart is empty. Please add items before checkout.' });
  }

  if (!data.pickupDate || !data.pickupDate.trim()) {
    errors.push({ field: 'pickupDate', message: 'Please select a pickup date.' });
  }

  if (!data.pickupTimeSlot || !data.pickupTimeSlot.trim()) {
    errors.push({ field: 'pickupTimeSlot', message: 'Please select an available pickup time slot.' });
  }

  return errors;
}

export function validateUploadedFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit. Please choose a smaller image.',
    };
  }

  return { valid: true };
}

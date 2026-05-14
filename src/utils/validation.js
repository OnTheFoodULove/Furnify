// Form validation utilities
// All validators return { valid: boolean, message: string }

/**
 * Validate email address format
 */
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: 'Email is required' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate password strength:
 * - Minimum 8 characters
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password) {
  if (!password || password.length === 0) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must include at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return { valid: false, message: 'Password must include at least one special character' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate confirm password matches
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate username: letters, numbers, underscores only; 3-30 chars
 */
export function validateUsername(username) {
  if (!username || username.trim().length === 0) {
    return { valid: false, message: 'Username is required' };
  }
  if (username.trim().length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters' };
  }
  if (username.trim().length > 30) {
    return { valid: false, message: 'Username must be 30 characters or fewer' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate furniture name: letters, numbers, spaces, basic punctuation
 */
export function validateFurnitureName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Furniture name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 100) {
    return { valid: false, message: 'Name must be 100 characters or fewer' };
  }
  // Allow letters, numbers, spaces, hyphens, apostrophes, ampersands
  if (!/^[a-zA-Z0-9\s\-'&.,]+$/.test(name.trim())) {
    return { valid: false, message: 'Name contains invalid characters' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate price: positive number with up to 2 decimal places
 */
export function validatePrice(price) {
  if (price === null || price === undefined || price === '') {
    return { valid: false, message: 'Price is required' };
  }
  const num = parseFloat(price);
  if (isNaN(num)) {
    return { valid: false, message: 'Price must be a valid number' };
  }
  if (num <= 0) {
    return { valid: false, message: 'Price must be greater than 0' };
  }
  if (num > 9999999.99) {
    return { valid: false, message: 'Price is too high' };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(price).trim())) {
    return { valid: false, message: 'Price can have at most 2 decimal places' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate phone/mobile number
 */
export function validateMobile(mobile) {
  if (!mobile || mobile.trim().length === 0) {
    return { valid: false, message: 'Mobile number is required' };
  }
  // Allow digits, spaces, dashes, parentheses, plus sign; 7-15 digits total
  const digits = mobile.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, message: 'Enter a valid mobile number (7–15 digits)' };
  }
  if (!/^[\d\s\+\-()]+$/.test(mobile.trim())) {
    return { valid: false, message: 'Mobile number contains invalid characters' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate address: not empty, reasonable length
 */
export function validateAddress(address) {
  if (!address || address.trim().length === 0) {
    return { valid: false, message: 'Address is required' };
  }
  if (address.trim().length < 5) {
    return { valid: false, message: 'Please enter a complete address' };
  }
  if (address.trim().length > 300) {
    return { valid: false, message: 'Address is too long (max 300 characters)' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate description: optional but max length
 */
export function validateDescription(description) {
  if (description && description.length > 1000) {
    return { valid: false, message: 'Description must be 1000 characters or fewer' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate that a required field is not empty
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || String(value).trim().length === 0) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
}

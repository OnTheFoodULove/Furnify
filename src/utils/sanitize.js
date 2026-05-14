// Input sanitization utilities
// Prevents XSS and SQL injection through client-side input cleaning

/**
 * Strip HTML tags from a string to prevent XSS
 */
export function stripHtml(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/**
 * Trim whitespace and normalize multiple spaces
 */
export function trimAndNormalize(input) {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize a general text field:
 * - Strips HTML
 * - Trims whitespace
 * - Normalizes spaces
 */
export function sanitizeText(input) {
  if (!input || typeof input !== 'string') return '';
  return trimAndNormalize(stripHtml(input));
}

/**
 * Sanitize a name field (furniture name, username, etc.)
 * Extra: removes any characters that aren't alphanumeric, spaces, or basic punctuation
 */
export function sanitizeName(input) {
  if (!input || typeof input !== 'string') return '';
  const stripped = stripHtml(input);
  // Remove SQL injection characters
  const cleaned = stripped.replace(/['"`;\\]/g, '');
  return trimAndNormalize(cleaned);
}

/**
 * Sanitize email: lowercase + trim
 */
export function sanitizeEmail(input) {
  if (!input || typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}

/**
 * Sanitize numeric input: keep only digits and one decimal point
 */
export function sanitizeNumeric(input) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const cleaned = str.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  return cleaned;
}

/**
 * Sanitize phone/mobile: keep only allowed phone characters
 */
export function sanitizeMobile(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^\d\s+\-()]/g, '').trim();
}

/**
 * Sanitize description / long text
 * Allows more characters but still strips HTML
 */
export function sanitizeDescription(input) {
  if (!input || typeof input !== 'string') return '';
  return stripHtml(input).trim();
}

/**
 * Sanitize all fields in a form object
 * Pass an object with field names and their types
 * Types: 'text' | 'name' | 'email' | 'numeric' | 'mobile' | 'description'
 */
export function sanitizeForm(formData, fieldTypes = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(formData)) {
    const type = fieldTypes[key] || 'text';
    switch (type) {
      case 'name':
        sanitized[key] = sanitizeName(value);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'numeric':
        sanitized[key] = sanitizeNumeric(value);
        break;
      case 'mobile':
        sanitized[key] = sanitizeMobile(value);
        break;
      case 'description':
        sanitized[key] = sanitizeDescription(value);
        break;
      default:
        sanitized[key] = sanitizeText(value);
    }
  }
  return sanitized;
}

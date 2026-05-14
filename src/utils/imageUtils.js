// Image validation and utility functions
// Used before uploading to Supabase Storage

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validate an image picked from expo-image-picker
 * @param {object} imageAsset - Asset from ImagePicker.launchImageLibraryAsync
 * @returns {{ valid: boolean, message: string }}
 */
export function validateImageAsset(imageAsset) {
  if (!imageAsset) {
    return { valid: false, message: 'No image selected' };
  }

  // Check file size
  if (imageAsset.fileSize && imageAsset.fileSize > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (imageAsset.fileSize / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      message: `Image is too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check file type via URI extension
  if (imageAsset.uri) {
    const uri = imageAsset.uri.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => uri.includes(ext));
    if (!hasValidExtension) {
      return {
        valid: false,
        message: 'Invalid file type. Please use JPG, PNG, or WebP images only',
      };
    }
  }

  // Check MIME type if available
  if (imageAsset.mimeType && !ALLOWED_MIME_TYPES.includes(imageAsset.mimeType)) {
    return {
      valid: false,
      message: 'Invalid file type. Please use JPG, PNG, or WebP images only',
    };
  }

  return { valid: true, message: '' };
}

/**
 * Extract file extension from a URI
 */
export function getFileExtension(uri) {
  const parts = uri.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase().split('?')[0];
    return `.${ext}`;
  }
  return '.jpg';
}

/**
 * Generate a unique filename for Supabase Storage upload
 * @param {string} prefix - Prefix for the filename (e.g., 'furniture')
 * @param {string} uri - The image URI for extension detection
 */
export function generateStorageFileName(prefix, uri) {
  const ext = getFileExtension(uri);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}${ext}`;
}

/**
 * Get the content type from a file URI
 */
export function getContentType(uri) {
  const ext = getFileExtension(uri);
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return types[ext] || 'image/jpeg';
}

/**
 * Convert an image URI to a Blob for upload
 * Works with Expo file system URIs
 */
export async function uriToBlob(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

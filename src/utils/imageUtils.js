export const DEFAULT_WATCH_IMAGE = '/assets/placeholder.jpg';

/**
 * Normalizes an image URL, ensuring it points to a valid image source.
 * Falls back to DEFAULT_WATCH_IMAGE if empty or null.
 */
export function getValidImageUrl(url, fallback = DEFAULT_WATCH_IMAGE) {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === '/placeholder.jpg') {
    return fallback;
  }
  return url;
}

/**
 * Handles image loading errors on <img> tags gracefully without infinite loops.
 */
export function handleImageError(e, fallback = DEFAULT_WATCH_IMAGE) {
  if (e && e.target && e.target.src !== fallback && !e.target.src.endsWith(fallback)) {
    e.target.onerror = null; // Prevent recursion if fallback fails
    e.target.src = fallback;
  }
}

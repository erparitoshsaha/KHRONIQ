// Global Toast Notification Dispatcher for KHRONIQ
const listeners = new Set();

export function inferToastType(message = '') {
  const lower = String(message).toLowerCase();
  if (
    lower.includes('fail') ||
    lower.includes('error') ||
    lower.includes('invalid') ||
    lower.includes('unable') ||
    lower.includes('cannot') ||
    lower.includes('out of stock') ||
    lower.includes('empty') ||
    lower.includes('incomplete')
  ) {
    return 'error';
  }
  if (
    lower.includes('added to cart') ||
    lower.includes('added to bag') ||
    lower.includes('success') ||
    lower.includes('saved') ||
    lower.includes('created') ||
    lower.includes('updated') ||
    lower.includes('restored') ||
    lower.includes('removed') ||
    lower.includes('applied') ||
    lower.includes('copied')
  ) {
    return 'success';
  }
  if (lower.includes('please') || lower.includes('log in') || lower.includes('select') || lower.includes('enter')) {
    return 'info';
  }
  return 'success';
}

export function showToast(message, type) {
  if (!message) return;
  const text = String(message).trim();
  if (!text) return;

  const resolvedType = type || inferToastType(text);
  const formattedMessage = text === 'ADDED TO CART' ? 'Added to Shopping Bag' : text;

  const toastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message: formattedMessage,
    type: resolvedType,
    duration: 3200
  };

  listeners.forEach((fn) => fn(toastItem));
}

export function subscribeToToasts(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

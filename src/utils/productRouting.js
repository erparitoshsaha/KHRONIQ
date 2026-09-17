/**
 * Product Routing and Deep-Linking Utilities for KHRONIQ
 */

/**
 * Returns a unique, URL-safe identifier for a product based on the priority:
 * 1. product.slug (if available)
 * 2. product.modelNo (if guaranteed unique across catalog)
 * 3. MongoDB _id or id
 *
 * @param {Object} product
 * @param {Array} allProducts
 * @returns {string} Encoded URL-safe identifier
 */
export function getProductIdentifier(product, allProducts = []) {
  if (!product) return '';

  // 1. Existing product slug, if available
  if (product.slug && typeof product.slug === 'string' && product.slug.trim()) {
    return encodeURIComponent(product.slug.trim());
  }

  // 2. modelNo, if present and unique across catalog
  if (product.modelNo && typeof product.modelNo === 'string' && product.modelNo.trim()) {
    const trimmed = product.modelNo.trim();
    const duplicates = Array.isArray(allProducts)
      ? allProducts.filter(p => p && p.modelNo && p.modelNo.trim().toLowerCase() === trimmed.toLowerCase())
      : [];
    if (duplicates.length <= 1) {
      return encodeURIComponent(trimmed);
    }
  }

  // 3. MongoDB _id or id
  const rawId = product.id || (product._id ? product._id.toString() : '');
  return encodeURIComponent(rawId);
}

/**
 * Returns the canonical URL path for a product
 * @param {Object} product
 * @param {Array} allProducts
 * @returns {string} E.g. /product/6a64a41b886a09339d66d8ef or /product/KH-001
 */
export function getProductUrl(product, allProducts = []) {
  const identifier = getProductIdentifier(product, allProducts);
  return identifier ? `/product/${identifier}` : '/shop';
}

/**
 * Resolves a product from a product array by matching slug, id, _id, modelNo, or serialNo
 * @param {Array} products
 * @param {string} rawParam
 * @returns {Object|null}
 */
export function findProductInList(products, rawParam) {
  if (!Array.isArray(products) || !rawParam) return null;
  const decoded = decodeURIComponent(rawParam).trim();
  const lower = decoded.toLowerCase();

  // 1. Slug match
  let matched = products.find(p => p && p.slug && p.slug.trim().toLowerCase() === lower);
  if (matched) return matched;

  // 2. id or _id match
  matched = products.find(p => {
    if (!p) return false;
    const pid = (p.id || '').toString().toLowerCase();
    const p_id = (p._id || '').toString().toLowerCase();
    return pid === lower || p_id === lower;
  });
  if (matched) return matched;

  // 3. modelNo match
  matched = products.find(p => p && p.modelNo && p.modelNo.trim().toLowerCase() === lower);
  if (matched) return matched;

  // 4. serialNo match
  matched = products.find(p => p && p.serialNo && p.serialNo.trim().toLowerCase() === lower);
  if (matched) return matched;

  return null;
}

/**
 * Parses route information from a URL pathname
 * @param {string} pathname
 * @returns {{ page: string, params: Object|null }}
 */
export function parseRouteFromPath(pathname = window.location.pathname) {
  if (!pathname || pathname === '/') {
    return { page: 'home', params: null };
  }

  const productMatch = pathname.match(/^\/product\/(.+)$/);
  if (productMatch) {
    const rawIdentifier = productMatch[1];
    const decoded = decodeURIComponent(rawIdentifier);
    return {
      page: 'product-detail',
      params: { id: decoded, slug: decoded }
    };
  }

  const resetMatch = pathname.match(/^\/reset-password\/(.+)$/);
  if (resetMatch) {
    return {
      page: 'reset-password',
      params: { token: resetMatch[1] }
    };
  }

  if (pathname === '/shop' || pathname.startsWith('/shop/')) {
    return { page: 'shop', params: null };
  }
  if (pathname === '/cart') {
    return { page: 'cart', params: null };
  }
  if (pathname === '/checkout') {
    return { page: 'checkout', params: null };
  }
  if (pathname === '/profile') {
    return { page: 'profile', params: null };
  }
  if (pathname === '/login') {
    return { page: 'login', params: null };
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return { page: 'admin', params: null };
  }
  if (pathname === '/customization') {
    return { page: 'customization', params: null };
  }
  if (pathname === '/gifting') {
    return { page: 'gifting', params: null };
  }

  return { page: 'home', params: null };
}

/**
 * Checks if the current page was reached via in-app navigation within this session
 * @returns {boolean}
 */
export function canGoBackInApp() {
  if (typeof window === 'undefined') return false;

  // 1. Check history state navIdx (tracked by App.jsx handlePageChange)
  if (window.history.state && typeof window.history.state.navIdx === 'number') {
    return window.history.state.navIdx > 0;
  }

  // 2. Check session storage count
  try {
    const storedCount = parseInt(sessionStorage.getItem('khroniq_inapp_navs') || '0', 10);
    if (storedCount > 0 && window.history.length > 1) {
      return true;
    }
  } catch (_) {}

  // 3. Check document referrer matching current domain
  try {
    if (document.referrer && document.referrer.includes(window.location.host) && window.history.length > 1) {
      return true;
    }
  } catch (_) {}

  return false;
}

/**
 * Increments the in-app navigation counter stored in sessionStorage
 */
export function incrementNavCount() {
  try {
    const count = parseInt(sessionStorage.getItem('khroniq_inapp_navs') || '0', 10);
    sessionStorage.setItem('khroniq_inapp_navs', (count + 1).toString());
  } catch (_) {}
}


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
 * Parses route information from a URL pathname and search query string
 * @param {string} [pathname]
 * @param {string} [search]
 * @returns {{ page: string, params: Object|null }}
 */
export function parseRouteFromPath(pathname, search) {
  let rawPath = pathname;
  let rawSearch = search;

  if (rawPath === undefined && typeof window !== 'undefined') {
    rawPath = window.location.pathname;
  }
  if (rawSearch === undefined && typeof window !== 'undefined') {
    rawSearch = window.location.search;
  }

  rawPath = rawPath || '/';
  rawSearch = rawSearch || '';

  // Extract query string if embedded in pathname
  if (rawPath.includes('?')) {
    const parts = rawPath.split('?');
    rawPath = parts[0];
    if (!rawSearch && parts[1]) {
      rawSearch = '?' + parts[1];
    }
  }

  const cleanPath = (rawPath.length > 1 && rawPath.endsWith('/'))
    ? rawPath.slice(0, -1)
    : rawPath;
  const lowerPath = cleanPath.toLowerCase();

  // Helper to extract query parameters
  const parseQueryParams = (searchStr) => {
    if (!searchStr) return null;
    try {
      const q = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr);
      const res = {};
      if (q.get('gender')) {
        const g = q.get('gender').toLowerCase().trim();
        res.gender = (g === 'male') ? 'men' : (g === 'female' ? 'women' : g);
      }
      if (q.get('category')) {
        res.category = q.get('category');
      }
      if (q.get('collection')) {
        res.category = q.get('collection');
      }
      if (q.get('search')) {
        res.search = q.get('search');
      }
      if (q.get('shopAll') === 'true' || q.has('shopAll')) {
        res.shopAll = true;
      }
      if (q.get('minPrice')) {
        const minP = Number(q.get('minPrice'));
        if (!isNaN(minP)) res.minPrice = minP;
      }
      if (q.get('maxPrice')) {
        const maxP = Number(q.get('maxPrice'));
        if (!isNaN(maxP)) res.maxPrice = maxP;
      }
      return Object.keys(res).length > 0 ? res : null;
    } catch (_) {
      return null;
    }
  };

  const queryParams = parseQueryParams(rawSearch);

  if (!cleanPath || cleanPath === '/') {
    return { page: 'home', params: null };
  }

  const productMatch = cleanPath.match(/^\/product\/(.+)$/i);
  if (productMatch) {
    const rawIdentifier = productMatch[1];
    const decoded = decodeURIComponent(rawIdentifier);
    return {
      page: 'product-detail',
      params: { id: decoded, slug: decoded }
    };
  }

  const resetMatch = cleanPath.match(/^\/reset-password\/(.+)$/i);
  if (resetMatch) {
    return {
      page: 'reset-password',
      params: { token: resetMatch[1] }
    };
  }

  // Men's catalogue routes (/men, /shop/men)
  if (lowerPath === '/men' || lowerPath === '/shop/men') {
    return {
      page: 'shop',
      params: { gender: 'men', ...(queryParams || {}) }
    };
  }

  // Women's catalogue routes (/women, /shop/women)
  if (lowerPath === '/women' || lowerPath === '/shop/women') {
    return {
      page: 'shop',
      params: { gender: 'women', ...(queryParams || {}) }
    };
  }

  // Shop All catalogue routes (/shop-all, /shop/all, /shop/shop-all)
  if (lowerPath === '/shop-all' || lowerPath === '/shop/all' || lowerPath === '/shop/shop-all') {
    return {
      page: 'shop',
      params: { shopAll: true, ...(queryParams || {}) }
    };
  }

  // General Shop routes (/shop, /shop/...)
  if (lowerPath === '/shop' || lowerPath.startsWith('/shop/')) {
    if (queryParams) {
      return {
        page: 'shop',
        params: queryParams
      };
    }
    return {
      page: 'shop',
      params: { shopAll: true }
    };
  }

  if (lowerPath === '/cart') {
    return { page: 'cart', params: queryParams };
  }
  if (lowerPath === '/checkout') {
    return { page: 'checkout', params: queryParams };
  }
  if (lowerPath === '/profile') {
    return { page: 'profile', params: queryParams };
  }
  if (lowerPath === '/login') {
    return { page: 'login', params: queryParams };
  }
  if (lowerPath === '/admin' || lowerPath.startsWith('/admin/')) {
    return { page: 'admin', params: queryParams };
  }
  if (lowerPath === '/customization') {
    return { page: 'customization', params: queryParams };
  }
  if (lowerPath === '/gifting') {
    return { page: 'gifting', params: queryParams };
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


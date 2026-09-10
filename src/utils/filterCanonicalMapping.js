/**
 * KHRONIQ Filter Canonical Field Mapping & Synchronization Utility
 *
 * Provides a single source of truth connecting:
 * 1. Catalog Filter Management (FilterCategory slugs & options)
 * 2. Admin Product Listing (Autocomplete suggestions & freeform fields)
 * 3. Actual Product Catalog (Product schema & specs)
 * 4. Shop Customer Filters (Reconciliation & option matching)
 */

/**
 * Standardize category slugs so aliases cleanly map to their canonical identifier.
 */
export function normalizeCategorySlug(rawSlug) {
  if (!rawSlug) return '';
  const s = String(rawSlug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (s === 'case-material' || s === 'casematerial' || s === 'case_material') return 'case';
  if (s === 'case-dimension' || s === 'case-dimensions' || s === 'casedimensions' || s === 'casedimension') return 'case-dimensions';
  if (s === 'strap-material' || s === 'strapmaterial') return 'strap';
  if (s === 'dial-color' || s === 'dialcolor') return 'dialColor';
  if (s === 'dial-glass' || s === 'dialglass') return 'glass';
  if (s === 'watch-function' || s === 'watchfunction') return 'watchFunction';
  if (s === 'water-resistance' || s === 'waterresistance') return 'waterResistance';
  if (s === 'warranty-details' || s === 'warrantydetails') return 'warrantyDetails';
  if (s === 'warranty-period' || s === 'warrantyperiod') return 'warrantyPeriod';
  return s;
}

/**
 * Slugify a string for clean URL/key usage.
 */
export function toCleanSlug(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Clean key for deduplication and matching (trimmed lowercase alphanumeric).
 */
export function normalizeFilterKey(str) {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Format raw option text nicely if in all lowercase.
 */
export function formatOptionLabel(str) {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\w/g, c => c.toUpperCase());
  }
  return trimmed;
}

/**
 * Extract canonical product values for a given filter category.
 *
 * Rules:
 * - Movement: specs.movement
 * - Case Material: specs.caseMaterial (NEVER specs.case)
 * - Case Dimensions: specs.case (NEVER specs.caseMaterial)
 * - Strap Material: specs.strap
 * - Dial Color: specs.dialColor
 * - Dial Glass: specs.glass
 * - Function: specs.watchFunction
 * - Collection: Prefer specs.collection, fallback to product.category (never generate duplicate entries from same product)
 * - Gender: product.gender
 * - Dial Type: specs.dial || specs.dialType
 */
export function getProductCanonicalValues(product, categorySlug) {
  if (!product) return [];
  const specs = product.specs || {};
  const normSlug = normalizeCategorySlug(categorySlug);
  const vals = [];

  switch (normSlug) {
    case 'movement':
      if (specs.movement) vals.push(specs.movement);
      break;

    case 'case':
      // STRICT: Case Material ONLY
      if (specs.caseMaterial) vals.push(specs.caseMaterial);
      break;

    case 'case-dimensions':
      // STRICT: Case Dimensions ONLY
      if (specs.case) vals.push(specs.case);
      break;

    case 'strap':
      if (specs.strap) vals.push(specs.strap);
      break;

    case 'collection': {
      // Prefer specs.collection if populated; otherwise fallback to product.category
      const col = (specs.collection && String(specs.collection).trim()) ||
                  (product.category && String(product.category).trim()) || '';
      if (col) vals.push(col);
      break;
    }

    case 'gender':
      if (product.gender) vals.push(product.gender);
      break;

    case 'dialColor':
      if (specs.dialColor) vals.push(specs.dialColor);
      break;

    case 'glass':
      if (specs.glass) vals.push(specs.glass);
      break;

    case 'watchFunction':
      if (specs.watchFunction) vals.push(specs.watchFunction);
      break;

    case 'waterResistance':
      if (specs.waterResistance) vals.push(specs.waterResistance);
      break;

    case 'warrantyDetails':
      if (specs.warrantyDetails) vals.push(specs.warrantyDetails);
      break;

    case 'warrantyPeriod':
      if (specs.warrantyPeriod) vals.push(specs.warrantyPeriod);
      break;

    case 'origin':
      if (specs.origin) vals.push(specs.origin);
      break;

    case 'dial':
      if (specs.dial) vals.push(specs.dial);
      if (specs.dialType) vals.push(specs.dialType);
      break;

    default:
      // Direct spec or product property fallback for custom admin categories
      if (specs[categorySlug]) vals.push(specs[categorySlug]);
      else if (product[categorySlug] && typeof product[categorySlug] === 'string') {
        vals.push(product[categorySlug]);
      }
      break;
  }

  return vals.map(v => String(v).trim()).filter(Boolean);
}

/**
 * Check if a product matches a filter option strictly based on its canonical field.
 * Avoids cross-attribute leakage (e.g. description bleeding or dimension bleeding into material).
 */
export function productMatchesFilterOption(product, categorySlug, optionValue, optionName) {
  if (!product) return false;
  const normSlug = normalizeCategorySlug(categorySlug);
  const normVal = String(optionValue || '').toLowerCase().trim();
  const normName = String(optionName || '').toLowerCase().trim();
  const cleanValSlug = toCleanSlug(optionValue);
  const cleanNameSlug = toCleanSlug(optionName);

  const specs = product.specs || {};

  switch (normSlug) {
    case 'gender': {
      const pGender = String(product.gender || '').toLowerCase().trim();
      if (!pGender) return false;
      const isWomen = normVal === 'women' || normVal === 'female' || normName.includes('women') || cleanNameSlug.includes('women');
      if (isWomen) {
        return pGender === 'women' || pGender === 'unisex';
      }
      const isMen = normVal === 'men' || normVal === 'male' || normName.includes('men') || cleanNameSlug.includes('men');
      if (isMen) {
        return pGender === 'men' || pGender === 'unisex';
      }
      if (normVal === 'unisex' || normName.includes('unisex')) {
        return pGender === 'unisex';
      }
      return pGender === normVal || pGender === normName || pGender === cleanValSlug;
    }

    case 'collection': {
      const pCol = String((specs.collection && String(specs.collection).trim()) || product.category || '').toLowerCase().trim();
      if (!pCol) return false;
      const pColSlug = toCleanSlug(pCol);
      if (normVal === 'classic' || normVal === 'khronomaster' || normName === 'classic' || normName === 'khronomaster') {
        return pCol === 'classic' || pCol === 'khronomaster' || pColSlug === 'classic' || pColSlug === 'khronomaster';
      }
      if (normVal === 'deevaaz' || normName === 'deevaaz') {
        return pCol === 'deevaaz' || pColSlug === 'deevaaz';
      }
      return pColSlug === cleanValSlug || pColSlug === cleanNameSlug || pCol === normVal || pCol === normName;
    }

    case 'movement': {
      const pMovement = String(specs.movement || '').toLowerCase().trim();
      if (!pMovement) return false;
      const pMovementSlug = toCleanSlug(pMovement);
      if (normVal === 'automatic' || normName === 'automatic') return pMovement.includes('automatic');
      if (normVal === 'quartz' || normName === 'quartz') return pMovement.includes('quartz');
      if (normVal === 'digital' || normName === 'digital') return pMovement.includes('digital');
      if (normVal === 'mechanical' || normName === 'mechanical') return pMovement.includes('mechanical');
      return pMovementSlug === cleanValSlug || pMovementSlug === cleanNameSlug || pMovement === normVal || pMovement === normName;
    }

    case 'strap': {
      const pStrap = String(specs.strap || '').toLowerCase().trim();
      if (!pStrap) return false;
      const pStrapSlug = toCleanSlug(pStrap);
      const pStrapBase = pStrapSlug.replace(/-(strap|band)$/, '');
      const optValBase = cleanValSlug.replace(/-(strap|band)$/, '');
      const optNameBase = cleanNameSlug.replace(/-(strap|band)$/, '');

      if (optValBase === 'leather' || optNameBase === 'leather' || normVal === 'leather' || normName === 'leather' || normVal === 'leather-strap' || normName === 'leather strap') {
        return pStrap.includes('leather');
      }
      if (optValBase === 'chain' || optNameBase === 'chain' || normVal === 'chain' || normName === 'chain' || normVal === 'chain-strap' || normName === 'chain strap') {
        return pStrap.includes('chain') || pStrap.includes('link');
      }
      if (optValBase === 'stainless-steel' || optNameBase === 'stainless-steel' || optValBase === 'steel' || optNameBase === 'steel' || normVal === 'stainless-steel' || normVal === 'steel') {
        return pStrap.includes('steel') || pStrap.includes('stainless');
      }
      if (optValBase === 'brass-alloy' || optNameBase === 'brass-alloy' || optValBase === 'brass' || optNameBase === 'brass' || optValBase === 'alloy' || optNameBase === 'alloy') {
        return pStrap.includes('brass') || pStrap.includes('alloy');
      }
      if (optValBase && pStrapBase && optValBase === pStrapBase) {
        return true;
      }
      if (optNameBase && pStrapBase && optNameBase === pStrapBase) {
        return true;
      }
      return pStrapSlug === cleanValSlug || pStrapSlug === cleanNameSlug || pStrap === normVal || pStrap === normName;
    }

    case 'case': {
      // STRICT: Case Material ONLY (NEVER inspect specs.case)
      const pCaseMaterial = String(specs.caseMaterial || '').toLowerCase().trim();
      if (!pCaseMaterial) return false;
      const pCaseSlug = toCleanSlug(pCaseMaterial);
      if (normVal === 'stainless-steel' || normVal === 'steel' || normName === 'stainless steel' || normName === 'steel') {
        return pCaseMaterial.includes('steel') || pCaseMaterial.includes('stainless');
      }
      if (normVal === 'brass-alloy' || normVal === 'brass' || normVal === 'alloy' || normName === 'brass/alloy' || normName === 'brass' || normName === 'alloy') {
        return pCaseMaterial.includes('brass') || pCaseMaterial.includes('alloy');
      }
      return pCaseSlug === cleanValSlug || pCaseSlug === cleanNameSlug || pCaseMaterial === normVal || pCaseMaterial === normName;
    }

    case 'case-dimensions': {
      // STRICT: Case Dimensions ONLY (NEVER inspect specs.caseMaterial)
      const pCaseDim = String(specs.case || '').toLowerCase().trim();
      if (!pCaseDim) return false;
      return pCaseDim.includes(normVal) || pCaseDim.includes(normName) || toCleanSlug(pCaseDim) === cleanValSlug;
    }

    case 'dial': {
      const pDial = String(specs.dial || specs.dialType || '').toLowerCase().trim();
      const pMovement = String(specs.movement || '').toLowerCase().trim();
      if (normVal === 'analog') {
        return pDial.includes('analog') || pMovement.includes('automatic') || pMovement.includes('chronometer') || (Boolean(pMovement) && !pMovement.includes('digital'));
      }
      if (normVal === 'digital-analog' || normVal === 'digital analog') {
        return pDial.includes('digital-analog') || pDial.includes('digital analog');
      }
      if (normVal === 'digital') {
        return pDial.includes('digital') || pMovement.includes('digital');
      }
      return pDial.includes(normVal) || pDial.includes(normName);
    }

    case 'dialColor': {
      const pDialColor = String(specs.dialColor || '').toLowerCase().trim();
      return pDialColor.includes(normVal) || pDialColor.includes(normName) || toCleanSlug(pDialColor) === cleanValSlug;
    }

    case 'glass': {
      const pGlass = String(specs.glass || '').toLowerCase().trim();
      return pGlass.includes(normVal) || pGlass.includes(normName) || toCleanSlug(pGlass) === cleanValSlug;
    }

    case 'watchFunction': {
      const pFunc = String(specs.watchFunction || '').toLowerCase().trim();
      return pFunc.includes(normVal) || pFunc.includes(normName) || toCleanSlug(pFunc) === cleanValSlug;
    }

    default: {
      // For any other specific category, check strictly against that field in specs or product
      const targetVal = String(specs[categorySlug] || product[categorySlug] || '').toLowerCase().trim();
      if (!targetVal) return false;
      return targetVal.includes(normVal) || targetVal.includes(normName) || toCleanSlug(targetVal) === cleanValSlug;
    }
  }
}

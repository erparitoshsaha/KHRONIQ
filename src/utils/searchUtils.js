/**
 * Smart Search & Recommendation Engine for KHRONIQ (Flipkart-style)
 * Provides fuzzy matching, intent detection (gender, collection, materials, colors),
 * typo tolerance, relevance ranking, and intelligent recommendations.
 */

// Generic watch stop words that shouldn't penalize searches
const STOP_WORDS = new Set([
  'watch', 'watches', 'timepiece', 'timepieces', 'ghadi', 'ghari', 'gharee',
  'for', 'in', 'the', 'a', 'an', 'and', 'with', 'of', 'to', 'at', 'by', 'on',
  'best', 'top', 'new', 'latest', 'original', 'branded', 'buy', 'online'
]);

// Popular / Trending search suggestions for search dropdown
export const POPULAR_SEARCH_SUGGESTIONS = [
  { label: "Men's Watches", query: "Men's Watches", type: 'category', gender: 'men' },
  { label: "Women's Watches", query: "Women's Watches", type: 'category', gender: 'women' },
  { label: "Classic Collection", query: "Classic", type: 'collection' },
  { label: "Leather Strap Watches", query: "Leather Strap", type: 'material' },
  { label: "Stainless Steel Watches", query: "Stainless Steel", type: 'material' },
  { label: "Quartz Timepieces", query: "Quartz", type: 'movement' },
  { label: "Automatic Watches", query: "Automatic", type: 'movement' },
  { label: "Black Dial Watches", query: "Black", type: 'color' },
  { label: "Green Dial Watches", query: "Green", type: 'color' },
];

/**
 * Compute Levenshtein distance between two strings for typo tolerance
 */
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j + 1] || (matrix[i - 1][j - 1] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Extract search intent from query
 */
export function extractSearchIntent(rawQuery) {
  if (!rawQuery) return { tokens: [], isOnlyGeneric: true };

  const cleaned = String(rawQuery)
    .toLowerCase()
    .replace(/['’]s\b/g, '') // remove 's (men's -> men)
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with space
    .trim();

  const allTokens = cleaned.split(/\s+/).filter(Boolean);

  // Intent Flags
  let genderIntent = null;
  const menKeywords = ['men', 'mens', 'man', 'male', 'males', 'boy', 'boys', 'gent', 'gents', 'gentleman'];
  const womenKeywords = ['women', 'womens', 'woman', 'female', 'females', 'girl', 'girls', 'lady', 'ladies'];
  const unisexKeywords = ['unisex', 'couple', 'couples', 'pair'];

  // Check gender intent
  if (allTokens.some(t => menKeywords.includes(t))) {
    genderIntent = 'men';
  } else if (allTokens.some(t => womenKeywords.includes(t))) {
    genderIntent = 'women';
  } else if (allTokens.some(t => unisexKeywords.includes(t))) {
    genderIntent = 'unisex';
  }

  // Filter out stop words for meaningful token comparison
  const meaningfulTokens = allTokens.filter(t => !STOP_WORDS.has(t));
  const isOnlyGeneric = meaningfulTokens.length === 0;

  return {
    raw: rawQuery,
    cleaned,
    allTokens,
    meaningfulTokens: isOnlyGeneric ? allTokens : meaningfulTokens,
    genderIntent,
    isOnlyGeneric
  };
}

/**
 * Score a single product against search intent
 */
export function scoreProductForSearch(product, intent) {
  if (!product) return 0;
  let score = 0;

  const pName = String(product.name || '').toLowerCase();
  const pDesc = String(product.description || '').toLowerCase();
  const pModel = String(product.modelNo || '').toLowerCase();
  const pCategory = String(product.category || '').toLowerCase();
  const pGender = String(product.gender || '').toLowerCase();
  const specs = product.specs || {};
  const pStrap = String(specs.strap || specs.strapMaterial || '').toLowerCase();
  const pMovement = String(specs.movement || '').toLowerCase();
  const pCase = String(specs.case || '').toLowerCase();
  const pDial = String(specs.dial || specs.dialColor || '').toLowerCase();
  const pCollection = String(specs.collection || pCategory || '').toLowerCase();

  const combinedAttributes = `${pName} ${pModel} ${pCategory} ${pCollection} ${pStrap} ${pMovement} ${pCase} ${pDial} ${pDesc}`;

  // 1. Gender intent matching
  if (intent.genderIntent) {
    if (intent.genderIntent === 'men') {
      if (pGender === 'men') {
        score += 150;
      } else if (pGender === 'unisex') {
        score += 90;
      } else if (pGender === 'women') {
        // Explicitly searched for men, so heavily penalize women watches
        return 0;
      }
    } else if (intent.genderIntent === 'women') {
      if (pGender === 'women') {
        score += 150;
      } else if (pGender === 'unisex') {
        score += 90;
      } else if (pGender === 'men') {
        // Explicitly searched for women, so heavily penalize men watches
        return 0;
      }
    } else if (intent.genderIntent === 'unisex') {
      if (pGender === 'unisex' || combinedAttributes.includes('couple') || combinedAttributes.includes('pair')) {
        score += 120;
      }
    }
  }

  // If the query was purely generic (e.g. "watches", "luxury watch"), all valid products match
  if (intent.isOnlyGeneric) {
    return score + 50;
  }

  // 2. Full exact phrase matches
  if (pName.includes(intent.cleaned)) {
    score += 250;
  } else if (pModel.includes(intent.cleaned)) {
    score += 300;
  } else if (combinedAttributes.includes(intent.cleaned)) {
    score += 150;
  }

  // 3. Token-by-token scoring
  let matchedTokens = 0;
  for (const token of intent.meaningfulTokens) {
    // Skip gender words in token match since handled above
    if (['men', 'mens', 'women', 'womens', 'unisex', 'boy', 'boys', 'girl', 'girls', 'gent', 'gents'].includes(token)) {
      matchedTokens++;
      continue;
    }

    let tokenMatched = false;

    // Direct model match
    if (pModel.includes(token)) {
      score += 120;
      tokenMatched = true;
    }

    // Name match
    if (pName.includes(token)) {
      score += 80;
      tokenMatched = true;
    }

    // Specification match (strap, movement, collection, etc.)
    if (pStrap.includes(token) || pMovement.includes(token) || pCollection.includes(token) || pDial.includes(token)) {
      score += 60;
      tokenMatched = true;
    }

    // Category / Description match
    if (pCategory.includes(token)) {
      score += 40;
      tokenMatched = true;
    } else if (pDesc.includes(token)) {
      score += 20;
      tokenMatched = true;
    }

    // Fuzzy matching for typos (e.g., "lether" -> "leather", "clasic" -> "classic", "slver" -> "silver")
    if (!tokenMatched && token.length >= 4) {
      const wordsInNameAndSpecs = `${pName} ${pCollection} ${pStrap} ${pMovement}`.split(/\s+/);
      for (const word of wordsInNameAndSpecs) {
        if (Math.abs(word.length - token.length) <= 2) {
          const dist = levenshteinDistance(token, word);
          if (dist <= 1 || (token.length >= 6 && dist <= 2)) {
            score += 35;
            tokenMatched = true;
            break;
          }
        }
      }
    }

    if (tokenMatched) {
      matchedTokens++;
    }
  }

  // If none of the meaningful non-gender tokens matched and there was more than just gender
  const nonGenderMeaningful = intent.meaningfulTokens.filter(t => !['men', 'mens', 'women', 'womens', 'unisex', 'boy', 'boys', 'girl', 'girls', 'gent', 'gents'].includes(t));
  if (nonGenderMeaningful.length > 0 && matchedTokens === 0) {
    return 0;
  }

  return score;
}

/**
 * Filter & Rank products with Flipkart-style Smart Search and Recommendations
 * @param {Array} products - Catalog products
 * @param {string} searchQuery - Search query string
 * @returns {Object} { results: Array, recommendations: Array, isFallback: boolean, totalFound: number }
 */
export function searchAndRecommendProducts(products = [], searchQuery = '') {
  if (!Array.isArray(products) || products.length === 0) {
    return { results: [], recommendations: [], isFallback: false, totalFound: 0 };
  }

  const trimmed = String(searchQuery || '').trim();
  if (!trimmed) {
    return { results: products, recommendations: [], isFallback: false, totalFound: products.length };
  }

  const intent = extractSearchIntent(trimmed);

  // Score all products
  const scored = [];
  for (const product of products) {
    const score = scoreProductForSearch(product, intent);
    if (score > 0) {
      scored.push({ product, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  const matchedProducts = scored.map(item => item.product);

  // Curate popular recommendations (for when 0 results or to append as recommendations)
  const recommendations = getPopularRecommendations(products, intent, matchedProducts);

  if (matchedProducts.length > 0) {
    return {
      results: matchedProducts,
      recommendations,
      isFallback: false,
      totalFound: matchedProducts.length
    };
  }

  // Fallback: 0 results matched
  // Just like Flipkart, show recommendations so user never sees an empty void!
  return {
    results: recommendations,
    recommendations,
    isFallback: true,
    totalFound: 0
  };
}

/**
 * Curate popular & trending recommendations
 */
export function getPopularRecommendations(products = [], intent = null, excludeProducts = []) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const excludeIds = new Set(excludeProducts.map(p => p.id || p._id));

  let pool = products.filter(p => !excludeIds.has(p.id || p._id));

  // If pool is empty because all products matched, use entire catalog
  if (pool.length === 0) pool = [...products];

  // If gender intent is present, prioritize that gender in recommendations
  if (intent && intent.genderIntent) {
    const genderMatches = pool.filter(p => {
      const g = String(p.gender || '').toLowerCase();
      return g === intent.genderIntent || g === 'unisex';
    });
    if (genderMatches.length >= 4) {
      pool = genderMatches;
    }
  }

  // Rank by rating, reviews count, or stock
  const ranked = [...pool].sort((a, b) => {
    const aRating = (a.reviews?.length || 0) * 10 + (a.rating || 4.8);
    const bRating = (b.reviews?.length || 0) * 10 + (b.rating || 4.8);
    return bRating - aRating;
  });

  return ranked.slice(0, 8);
}

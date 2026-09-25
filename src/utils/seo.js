import { useEffect } from 'react';

const BASE_URL = 'https://www.khroniq.com';
const DEFAULT_IMAGE = 'https://www.khroniq.com/assets/spotlight_red_angled.png';
const DEFAULT_TITLE = 'KHRONIQ — Born from The Movement Of Time';
const DEFAULT_DESCRIPTION = 'KHRONIQ — Born from The Movement Of Time. Discover our collection of contemporary luxury watches and precision timepieces, crafted for modern style, elegance, and distinction.';
const DEFAULT_KEYWORDS = 'KHRONIQ, luxury watches, timepieces, luxury watch brand India, men watches, women watches, horology, bespoke watches';

/**
 * Normalizes an image URL to an absolute URL
 */
export function getAbsoluteImageUrl(img) {
  if (!img) return DEFAULT_IMAGE;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/')) return `${BASE_URL}${img}`;
  return `${BASE_URL}/${img}`;
}

/**
 * Updates head metadata dynamically for SEO and Social Sharing
 */
export function updateSEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl = BASE_URL,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  jsonLd = null,
  jsonLdId = 'dynamic-seo-jsonld'
} = {}) {
  if (typeof document === 'undefined') return;

  // 1. Update Title
  document.title = title || DEFAULT_TITLE;

  // Helper for meta elements
  const setMeta = (attr, key, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Helper for link elements
  const setLink = (rel, href) => {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // 2. Standard Meta Tags
  setMeta('name', 'description', description || DEFAULT_DESCRIPTION);
  setMeta('name', 'keywords', keywords || DEFAULT_KEYWORDS);
  setMeta('name', 'robots', robots);

  // 3. Canonical Link
  const effectiveCanonical = canonicalUrl.startsWith('http') ? canonicalUrl : `${BASE_URL}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`;
  setLink('canonical', effectiveCanonical);

  // 4. Open Graph Tags
  const effectiveOgTitle = ogTitle || title || DEFAULT_TITLE;
  const effectiveOgDesc = ogDescription || description || DEFAULT_DESCRIPTION;
  const effectiveOgImage = getAbsoluteImageUrl(ogImage);
  const effectiveOgUrl = ogUrl || effectiveCanonical;

  setMeta('property', 'og:type', ogType);
  setMeta('property', 'og:site_name', 'KHRONIQ');
  setMeta('property', 'og:title', effectiveOgTitle);
  setMeta('property', 'og:description', effectiveOgDesc);
  setMeta('property', 'og:image', effectiveOgImage);
  setMeta('property', 'og:url', effectiveOgUrl);

  // 5. Twitter Card Tags
  setMeta('name', 'twitter:card', twitterCard);
  setMeta('name', 'twitter:title', effectiveOgTitle);
  setMeta('name', 'twitter:description', effectiveOgDesc);
  setMeta('name', 'twitter:image', effectiveOgImage);

  // 6. JSON-LD Structured Data
  if (jsonLd) {
    let script = document.getElementById(jsonLdId);
    if (!script) {
      script = document.createElement('script');
      script.id = jsonLdId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd);
  } else {
    const existing = document.getElementById(jsonLdId);
    if (existing) existing.remove();
  }
}

/**
 * React hook to maintain on-page SEO metadata
 */
export function useSEO(options) {
  useEffect(() => {
    if (!options) return;
    updateSEO(options);
  }, [
    options?.title,
    options?.description,
    options?.keywords,
    options?.canonicalUrl,
    options?.ogImage,
    options?.ogType,
    options?.robots,
    JSON.stringify(options?.jsonLd || null)
  ]);
}

/**
 * Builds schema.org Product structured data for rich search results
 */
export function buildProductSchema(product, sellingPrice, canonicalUrl) {
  if (!product) return null;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(getAbsoluteImageUrl)
    : [getAbsoluteImageUrl(product.image)];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.description || `${product.name} luxury timepiece crafted by KHRONIQ.`,
    sku: product.id || (product._id ? product._id.toString() : ''),
    mpn: product.modelNo || product.uniqueCode || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'KHRONIQ'
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: sellingPrice || product.price || 0,
      availability: (product.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'KHRONIQ'
      }
    }
  };

  // Add AggregateRating and Reviews if present
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const validReviews = product.reviews.filter(r => r && r.rating);
    if (validReviews.length > 0) {
      const total = validReviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
      const avg = (total / validReviews.length).toFixed(1);
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avg,
        reviewCount: validReviews.length,
        bestRating: '5',
        worstRating: '1'
      };

      schema.review = validReviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.userName || 'Verified Buyer'
        },
        datePublished: r.date || new Date().toISOString().split('T')[0],
        reviewBody: r.comment || '',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: '5',
          worstRating: '1'
        }
      }));
    }
  }

  return schema;
}

/**
 * Builds schema.org FAQPage structured data
 */
export function buildFaqSchema(faqList) {
  if (!Array.isArray(faqList) || faqList.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  };
}

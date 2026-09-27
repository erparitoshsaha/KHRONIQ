import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { buildBreadcrumbSchema } from '../utils/seo';

/**
 * Accessible, SEO-optimized Breadcrumbs component with JSON-LD BreadcrumbList schema
 *
 * @param {Array<{ label: string, page?: string, params?: Object, url?: string }>} items
 * @param {Function} onPageChange
 * @param {string} className
 */
export default function Breadcrumbs({ items = [], onPageChange, className = '', dark = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  // Dynamically inject schema.org BreadcrumbList for SERP rich snippets
  useEffect(() => {
    const schemaItems = items.map(item => {
      let resolvedUrl = item.url;
      if (!resolvedUrl) {
        if (item.page === 'home') resolvedUrl = '/';
        else if (item.page === 'shop') {
          if (item.params?.gender) resolvedUrl = `/${item.params.gender}`;
          else if (item.params?.category) resolvedUrl = `/shop?category=${encodeURIComponent(item.params.category)}`;
          else resolvedUrl = '/shop';
        } else if (item.page) {
          resolvedUrl = `/${item.page}`;
        } else {
          resolvedUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
        }
      }
      return {
        name: item.label,
        url: resolvedUrl
      };
    });

    const schema = buildBreadcrumbSchema(schemaItems);
    const scriptId = 'breadcrumbs-jsonld';
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className={`py-1.5 ${className}`}>
      <ol
        className={`flex items-center flex-wrap gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium ${
          dark ? 'text-neutral-400' : 'text-neutral-500'
        }`}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <li aria-hidden="true" className={`${dark ? 'text-neutral-500' : 'text-neutral-400'} select-none flex items-center`}>
                  <ChevronRight size={10} className="stroke-[2.5]" />
                </li>
              )}
              <li
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
                className="flex items-center min-w-0"
              >
                {isLast ? (
                  <span
                    aria-current="page"
                    itemProp="name"
                    className={`${dark ? 'text-white' : 'text-neutral-900'} font-bold truncate max-w-[200px] sm:max-w-[320px]`}
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onPageChange && item.page) {
                        onPageChange(item.page, item.params || null);
                      }
                    }}
                    className={`${dark ? 'hover:text-white text-neutral-300' : 'hover:text-black'} transition-colors duration-150 cursor-pointer underline-offset-2 hover:underline`}
                    itemProp="item"
                  >
                    <span itemProp="name">{item.label}</span>
                  </button>
                )}
                <meta itemProp="position" content={String(idx + 1)} />
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

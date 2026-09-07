import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { canGoBackInApp } from '../utils/productRouting';

/**
 * Reusable Global Back Button for KHRONIQ inner pages
 *
 * Automatically checks whether there is an in-app history path to pop.
 * If true, calls window.history.back().
 * If false (e.g. direct URL entry, refreshed page, or external link),
 * triggers the safe fallback navigation route (e.g. 'shop' or 'home').
 *
 * @param {Object} props
 * @param {Function} props.onPageChange - Main navigation dispatcher
 * @param {string} [props.fallbackPage='shop'] - Route name to navigate to if no in-app history exists
 * @param {Object} [props.fallbackParams=null] - Optional route parameters for fallback
 * @param {string} [props.label='BACK'] - Button label text
 * @param {Function} [props.customAction=null] - Optional override function for special in-page back actions
 * @param {string} [props.className=''] - Optional additional CSS class names
 * @param {number} [props.iconSize=14] - Lucide icon pixel size
 * @param {boolean} [props.dark=false] - If true, uses light text for dark backgrounds
 */
export default function BackButton({
  onPageChange,
  fallbackPage = 'shop',
  fallbackParams = null,
  label = 'BACK',
  customAction = null,
  className = '',
  iconSize = 14,
  dark = false
}) {
  const handleClick = (e) => {
    e?.preventDefault?.();

    if (typeof customAction === 'function') {
      customAction();
      return;
    }

    if (canGoBackInApp()) {
      window.history.back();
    } else if (typeof onPageChange === 'function') {
      onPageChange(fallbackPage, fallbackParams);
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const textColors = dark
    ? 'text-white/70 hover:text-white'
    : 'text-neutral-500 hover:text-black';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${textColors} transition-colors duration-200 cursor-pointer select-none py-1 group ${className}`}
    >
      <ArrowLeft
        size={iconSize}
        className="transition-transform duration-200 group-hover:-translate-x-1 stroke-2"
      />
      <span>{label}</span>
    </button>
  );
}

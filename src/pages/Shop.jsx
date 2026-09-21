import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProductCard from '../components/ProductCard';
import BackButton from '../components/BackButton';
import { getDiscountedPrice, getProductMrp, selectCurrentCurrency, formatPrice, fetchFilters, fetchProducts } from '../store/slices/watchSlice';
import { SlidersHorizontal, Search, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  productMatchesFilterOption,
  toCleanSlug,
  normalizeFilterKey,
  formatOptionLabel
} from '../utils/filterCanonicalMapping';

const PRICE_STEP = 1000;
const SLIDER_STEP = 1;

const DEFAULT_FALLBACK_CATEGORIES = [
  {
    slug: 'gender',
    name: 'Gender',
    options: [
      { name: "Men's Watches", slug: 'men', value: 'men' },
      { name: "Women's Watches", slug: 'women', value: 'women' }
    ]
  },
  {
    slug: 'collection',
    name: 'Collection',
    options: [
      { name: 'Deevaaz', slug: 'deevaaz', value: 'deevaaz' },
      { name: 'Classic', slug: 'classic', value: 'classic' }
    ]
  },
  {
    slug: 'movement',
    name: 'Movement',
    options: [
      { name: 'Automatic', slug: 'automatic', value: 'automatic' },
      { name: 'Digital', slug: 'digital', value: 'digital' },
      { name: 'Quartz', slug: 'quartz', value: 'quartz' }
    ]
  },
  {
    slug: 'strap',
    name: 'Strap',
    options: [
      { name: 'Leather Strap', slug: 'leather-strap', value: 'leather-strap' },
      { name: 'Chain Strap', slug: 'chain-strap', value: 'chain-strap' },
      { name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel' },
      { name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy' }
    ]
  },
  {
    slug: 'dial',
    name: 'Dial',
    options: [
      { name: 'Analog', slug: 'analog', value: 'analog' },
      { name: 'Digital', slug: 'digital', value: 'digital' },
      { name: 'Digital Analog', slug: 'digital-analog', value: 'digital-analog' }
    ]
  },
  {
    slug: 'case',
    name: 'Case',
    options: [
      { name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel' },
      { name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy' }
    ]
  }
];

function matchesOption(product, categorySlug, optionValue, optionName) {
  return productMatchesFilterOption(product, categorySlug, optionValue, optionName);
}

export default function Shop({ onPageChange, filterParams }) {
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const dynamicFilterCategories = useSelector(state => state.watch.filters || []);

  // Fetch active filters and ensure products are fetched on mount
  useEffect(() => {
    dispatch(fetchFilters());
    if (!products || products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products]);

  const baseCategories = dynamicFilterCategories.length > 0 ? dynamicFilterCategories : DEFAULT_FALLBACK_CATEGORIES;

  // Single Source of Truth: Customer-facing filter options come ONLY from active Catalog Filter options.
  // Product fields NEVER create or derive new customer-facing filter options.
  const activeCategories = useMemo(() => {
    return (baseCategories || [])
      .filter(cat => cat && cat.isActive !== false)
      .map(cat => {
        // Build set of inactive options to respect admin deactivation
        const inactiveSet = new Set();
        const inactiveOptions = [
          ...(cat.inactiveOptions || []),
          ...(cat.options || []).filter(o => o && o.isActive === false)
        ];
        inactiveOptions.forEach(opt => {
          if (opt.name) inactiveSet.add(normalizeFilterKey(opt.name));
          if (opt.slug) inactiveSet.add(normalizeFilterKey(opt.slug));
          if (opt.value) inactiveSet.add(normalizeFilterKey(opt.value));
        });

        const isDeactivated = (val, slug, name) => {
          const nVal = normalizeFilterKey(val);
          const nSlug = normalizeFilterKey(slug);
          const nName = normalizeFilterKey(name);
          if (nVal && inactiveSet.has(nVal)) return true;
          if (nSlug && inactiveSet.has(nSlug)) return true;
          if (nName && inactiveSet.has(nName)) return true;
          return false;
        };

        const activeRaw = (cat.options || []).filter(o => o && o.isActive !== false);
        const shownOptions = [];
        const seenKeys = new Set();

        for (const opt of activeRaw) {
          const optVal = opt.value || opt.slug || opt.name;
          const optName = opt.name || optVal;
          const optSlug = opt.slug || toCleanSlug(optVal);

          if (isDeactivated(optVal, optSlug, optName)) {
            continue;
          }

          // Duplicate normalization: ensure no duplicate equivalent options are rendered
          const normKey = normalizeFilterKey(optName) || optSlug.toLowerCase().trim();
          if (!seenKeys.has(normKey)) {
            seenKeys.add(normKey);
            shownOptions.push({
              id: opt.id || opt._id || `opt-${optSlug}`,
              name: opt.name || formatOptionLabel(optVal),
              slug: optSlug,
              value: optVal,
              order: opt.order !== undefined ? opt.order : shownOptions.length + 1
            });
          }
        }

        // Sort options by order if defined
        shownOptions.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        return {
          ...cat,
          options: shownOptions
        };
      });
  }, [baseCategories]);

  // Calculate dynamic price boundaries from available products based on selling price
  const { minPrice, maxPrice } = useMemo(() => {
    if (!products || products.length === 0) {
      return { minPrice: 0, maxPrice: 1000 };
    }
    const prices = products
      .map(p => getDiscountedPrice(p))
      .filter(p => typeof p === 'number' && !isNaN(p) && p > 0);

    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 1000 };
    }

    const actualMin = Math.min(...prices);
    const actualMax = Math.max(...prices);

    const exactMin = Math.max(0, actualMin);
    let roundedMax = Math.ceil(actualMax / PRICE_STEP) * PRICE_STEP;
    if (roundedMax <= exactMin) {
      roundedMax = exactMin + PRICE_STEP;
    }

    return { minPrice: exactMin, maxPrice: roundedMax };
  }, [products]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(filterParams?.search || '');
  const [selectedFilters, setSelectedFilters] = useState({}); // { [categorySlug]: string[] }
  const [priceRange, setPriceRange] = useState(null);
  const [minPriceFilter, setMinPriceFilter] = useState(null);
  const [sortOption, setSortOption] = useState('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Current effective max price: falls back to dynamic maxPrice when not explicitly overridden
  const currentMaxPrice = (typeof priceRange === 'number' && !isNaN(priceRange))
    ? Math.min(Math.max(priceRange, minPrice), maxPrice)
    : maxPrice;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    document.title = 'Shop Luxury Watches | KHRONIQ';
  }, []);

  // Prevent background scrolling when mobile filters drawer is open
  useEffect(() => {
    if (showFiltersMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showFiltersMobile]);

  // Listen to outer navigation category/gender updates
  useEffect(() => {
    if (filterParams?.shopAll) {
      setSearchQuery('');
      setSelectedFilters({});
      setPriceRange(null);
      setMinPriceFilter(null);
      setSortOption('featured');
    } else if (filterParams?.category) {
      const cat = filterParams.category === 'Khronomaster' ? 'classic' : filterParams.category.toLowerCase();
      setSelectedFilters({ collection: [cat] });
      setSearchQuery('');
      setPriceRange(null);
      setMinPriceFilter(null);
    } else if (filterParams?.gender) {
      setSelectedFilters({ gender: [filterParams.gender.toLowerCase()] });
      setSearchQuery('');
      setPriceRange(null);
      setMinPriceFilter(null);
    } else if (filterParams?.search !== undefined) {
      setSearchQuery(filterParams.search);
      setSelectedFilters({});
      setPriceRange(null);
      setMinPriceFilter(null);
    }
    if (filterParams?.maxPrice !== undefined) {
      setPriceRange(filterParams.maxPrice);
    } else {
      setPriceRange(null);
    }
    if (filterParams?.minPrice !== undefined) {
      setMinPriceFilter(filterParams.minPrice);
    } else {
      setMinPriceFilter(null);
    }
  }, [filterParams]);

  // Reset page when filters or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilters, currentMaxPrice, minPriceFilter, sortOption]);

  const toggleSection = (slug) => {
    setCollapsedSections(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isAllSelected = (catSlug) => {
    const current = selectedFilters[catSlug];
    return !current || current.length === 0 || current.includes('All');
  };

  const isOptionSelected = (catSlug, optSlug) => {
    const current = selectedFilters[catSlug];
    return Array.isArray(current) && current.includes(optSlug);
  };

  const handleSelectAll = (catSlug) => {
    setSelectedFilters(prev => {
      const updated = { ...prev };
      delete updated[catSlug];
      return updated;
    });
  };

  const handleToggleOption = (catSlug, optSlug) => {
    setSelectedFilters(prev => {
      const current = prev[catSlug] || [];
      let updatedList;
      if (current.includes(optSlug)) {
        updatedList = current.filter(s => s !== optSlug);
      } else {
        updatedList = [...current.filter(s => s !== 'All'), optSlug];
      }

      const updated = { ...prev };
      if (updatedList.length === 0) {
        delete updated[catSlug];
      } else {
        updated[catSlug] = updatedList;
      }
      return updated;
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFilters({});
    setPriceRange(null);
    setSortOption('featured');
    setCurrentPage(1);
  };

  // Count of active applied filters
  const activeFilterCount = Object.values(selectedFilters).reduce((acc, curr) => acc + (curr ? curr.length : 0), 0) +
    (searchQuery.trim() ? 1 : 0) +
    (currentMaxPrice < maxPrice ? 1 : 0);

  // Filter products logic with dynamic OR within category and AND between categories
  const filteredProducts = (products || []).filter((product) => {
    if (!product) return false;
    // 1. Search Query Match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = String(product.name || '').toLowerCase().includes(q);
      const matchDesc = String(product.description || '').toLowerCase().includes(q);
      const matchModel = String(product.modelNo || '').toLowerCase().includes(q);
      const matchCategory = String(product.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchModel && !matchCategory) {
        return false;
      }
    }

    // 2. Price Range Match (by Selling Price)
    const effectivePrice = getDiscountedPrice(product);
    if (typeof priceRange === 'number' && effectivePrice > currentMaxPrice) {
      return false;
    }
    if (typeof minPriceFilter === 'number' && effectivePrice < minPriceFilter) {
      return false;
    }

    // 3. Dynamic Category Matches (AND across categories, OR within category)
    for (const cat of activeCategories) {
      const selectedOpts = selectedFilters[cat.slug];
      if (selectedOpts && selectedOpts.length > 0 && !selectedOpts.includes('All')) {
        // Must match AT LEAST ONE selected option in this category (OR logic)
        const anyMatch = selectedOpts.some(optSlug => {
          const optDef = (cat.options || []).find(o => o.slug === optSlug || o.value === optSlug);
          return matchesOption(product, cat.slug, optSlug, optDef ? optDef.name : optSlug);
        });

        if (!anyMatch) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort products logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return getDiscountedPrice(a) - getDiscountedPrice(b);
      case 'price-desc':
        return getDiscountedPrice(b) - getDiscountedPrice(a);
      case 'name-asc':
        return String(a.name || '').localeCompare(String(b.name || ''));
      case 'name-desc':
        return String(b.name || '').localeCompare(String(a.name || ''));
      default: { // Featured / Default: newest added watch appears first
        const getTime = (p) => {
          if (!p) return 0;
          if (p.createdAt) {
            const t = new Date(p.createdAt).getTime();
            if (!isNaN(t)) return t;
          }
          const idStr = String(p._id || p.id || '');
          if (idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
            return parseInt(idStr.substring(0, 8), 16) * 1000;
          }
          return Number(p.id) || 0;
        };
        const timeA = getTime(a);
        const timeB = getTime(b);
        if (timeA !== timeB) return timeB - timeA;
        return String(b._id || b.id || '').localeCompare(String(a._id || a.id || ''));
      }
    }
  });

  // Pagination Slicing
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Render Filter Sidebar Content (Shared between desktop and mobile drawer)
  const renderFilterSections = () => (
    <div className="space-y-6">
      {/* Search Sub-Filter */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-luxury-text uppercase tracking-widest">Search within</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-luxury-text text-xs px-3 py-2 pl-8 border border-luxury-text/10 rounded focus:outline-none focus:border-black"
          />
          <Search size={12} className="absolute left-2.5 top-3 text-luxury-muted" />
        </div>
      </div>

      {/* Dynamic Collapsible Filter Categories */}
      {activeCategories.map((cat) => {
        const isCollapsed = Boolean(collapsedSections[cat.slug]);
        const allSelected = isAllSelected(cat.slug);

        return (
          <div key={cat.slug || cat.id} className="border-b border-luxury-text/10 pb-4">
            <button
              onClick={() => toggleSection(cat.slug)}
              className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-luxury-text uppercase tracking-widest cursor-pointer group"
            >
              <span>{cat.name}</span>
              {isCollapsed ? (
                <ChevronDown size={14} className="text-luxury-muted group-hover:text-luxury-text transition" />
              ) : (
                <ChevronUp size={14} className="text-luxury-muted group-hover:text-luxury-text transition" />
              )}
            </button>

            {!isCollapsed && (
              <div className="pt-2.5 space-y-2 text-xs">
                {/* 'All' Option */}
                <label className="flex items-center space-x-2.5 cursor-pointer text-luxury-text hover:text-black transition select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => handleSelectAll(cat.slug)}
                    className="w-3.5 h-3.5 rounded border border-neutral-400 text-black focus:ring-0 cursor-pointer accent-black"
                  />
                  <span className={`text-[11px] tracking-wide ${allSelected ? 'font-bold text-black' : 'text-neutral-600'}`}>
                    All
                  </span>
                </label>

                {/* Specific Options */}
                {(cat.options || []).map((opt) => {
                  const optKey = opt.slug || opt.value;
                  const isChecked = isOptionSelected(cat.slug, optKey);

                  return (
                    <label
                      key={optKey || opt.id}
                      className="flex items-center space-x-2.5 cursor-pointer text-luxury-text hover:text-black transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleOption(cat.slug, optKey)}
                        className="w-3.5 h-3.5 rounded border border-neutral-400 text-black focus:ring-0 cursor-pointer accent-black"
                      />
                      <span className={`text-[11px] tracking-wide ${isChecked ? 'font-bold text-black' : 'text-neutral-600'}`}>
                        {opt.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Max Price Range Slider */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold text-luxury-text uppercase tracking-widest">Max Price</h4>
          <span className="text-xs text-neutral-900 font-bold">{formatPrice(currentMaxPrice, currentCurrency)}</span>
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={SLIDER_STEP}
          value={currentMaxPrice}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-black cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
          <span>{formatPrice(minPrice, currentCurrency)}</span>
          <span>{formatPrice(maxPrice, currentCurrency)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 xl:px-10 py-8 max-w-[100vw] overflow-x-hidden">
      {/* Back Button */}
      <div>
        <BackButton onPageChange={onPageChange} fallbackPage="home" label="BACK" />
      </div>

      {/* Page Header */}
      <div className="border-b border-luxury-text/10 pb-6">
        <h1 className="font-serif text-3xl font-bold uppercase text-luxury-text tracking-widest">Khroniq Catalogue</h1>
        <p className="text-luxury-muted text-xs mt-1">Discover precision Swadeshi timepieces engineered for ultimate endurance.</p>
      </div>

      {/* Main Grid: Filters & Products */}
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
        
        {/* Filters Panel (Desktop Sidebar) - Independently Scrollable */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 sticky top-24 max-h-[calc(100vh-7.5rem)] bg-white">
          <div className="flex items-center justify-between border-b border-luxury-text/10 pb-4 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-luxury-text flex items-center space-x-2">
              <SlidersHorizontal size={14} className="text-luxury-text" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-medium">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button
              onClick={resetFilters}
              className="text-[10px] text-luxury-muted hover:text-black transition flex items-center space-x-1 uppercase font-semibold cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>

          {/* Independently Scrollable Filters List */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2.5 pt-4 pb-6 filters-sidebar-scroll">
            {renderFilterSections()}
          </div>
        </aside>

        {/* Mobile Filters Trigger & Sorting Section */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white border border-luxury-text/10 px-5 py-3.5 rounded-md shadow-sm">
            
            {/* Left Mobile Toggle */}
            <button
              onClick={() => setShowFiltersMobile(true)}
              className="lg:hidden flex items-center space-x-2 text-xs font-bold tracking-widest uppercase border border-luxury-text/10 px-4 py-2 hover:border-black transition cursor-pointer text-luxury-text"
            >
              <SlidersHorizontal size={14} />
              <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : `(${filteredProducts.length})`}</span>
            </button>

            {/* Results Count (Desktop) */}
            <span className="hidden lg:inline text-xs text-luxury-muted">
              Showing <span className="text-luxury-text font-bold">{sortedProducts.length > 0 ? indexOfFirstProduct + 1 : 0}-{Math.min(indexOfLastProduct, sortedProducts.length)}</span> of <span className="text-luxury-text font-bold">{sortedProducts.length}</span> timepieces
            </span>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-3 text-xs w-full sm:w-auto justify-end">
              <span className="text-luxury-muted uppercase tracking-wider text-[10px] font-bold">Sort By:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white text-luxury-text border border-luxury-text/10 rounded px-3 py-1.5 focus:outline-none focus:border-black text-xs cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Catalog grid */}
          {sortedProducts.length === 0 ? (
            <div className="border border-dashed border-luxury-text/20 rounded-md p-16 text-center space-y-4">
              <p className="text-luxury-muted text-sm">No luxury watches match your current filter selections.</p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 transition cursor-pointer border border-neutral-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-4.5">
                {currentProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onPageChange={onPageChange}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-8 border-t border-luxury-text/10">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 border border-luxury-text/10 rounded-md text-xs font-bold uppercase tracking-wider text-luxury-text hover:border-black transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Prev
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-9 h-9 rounded-md text-xs font-bold transition cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-black text-white'
                            : 'border border-luxury-text/10 text-luxury-text hover:border-black'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 border border-luxury-text/10 rounded-md text-xs font-bold uppercase tracking-wider text-luxury-text hover:border-black transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filters Overlay */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFiltersMobile(false)} />
          
          <div className="relative w-80 max-w-sm bg-white border-r border-luxury-text/10 h-full p-6 flex flex-col z-10">
            <div className="flex justify-between items-center border-b border-luxury-text/10 pb-4 shrink-0">
              <h2 className="text-sm font-bold uppercase tracking-widest text-luxury-text flex items-center space-x-2">
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              <button onClick={() => setShowFiltersMobile(false)} className="text-neutral-600 hover:text-black transition cursor-pointer p-1" aria-label="Close filters">
                <X size={20} />
              </button>
            </div>

            {/* Mobile Filters Content - Independently scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2.5 py-4 filters-sidebar-scroll">
              {renderFilterSections()}
            </div>

            {/* Apply & Reset Buttons (Pinned) */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-luxury-text/10 shrink-0">
              <button
                onClick={resetFilters}
                className="py-2.5 border border-luxury-text/20 text-luxury-text font-semibold text-xs tracking-wider uppercase hover:bg-neutral-100 transition cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowFiltersMobile(false)}
                className="py-2.5 bg-black text-white font-bold text-xs tracking-wider uppercase hover:bg-neutral-800 transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

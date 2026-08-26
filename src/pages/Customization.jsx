import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, selectCurrentCurrency, formatPrice as formatPriceUtil } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import { Paintbrush, ShoppingBag, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Colour & option data ─────────────────────────────────────────────────────
const FALLBACK_DIAL_COLORS = [
  { label: 'Midnight Black', value: '#0a0a0f', textDark: false },
  { label: 'Pearl White',    value: '#f5f0e8', textDark: true  },
  { label: 'Navy Blue',      value: '#1a2a4a', textDark: false },
  { label: 'Forest Green',   value: '#1c3a2a', textDark: false },
  { label: 'Champagne Gold', value: '#c8a96a', textDark: true  },
  { label: 'Crimson Red',    value: '#6b1515', textDark: false },
  { label: 'Beige Dial',     value: '#f5f5dc', textDark: true  },
];

const STRAP_IMAGES = {
  'Tan Leather': '/assets/wt4.png',
  'Diamond Silver Link': '/assets/wt3.png',
  'Classic Gold Chain': '/assets/wt5.png',
  'Forest Green Rubber': '/assets/wt8.png',
  'Brushed Steel Link': '/assets/watch_black_steel.png',
  'Alligator Leather': '/assets/wt4.png',
  'Steel Bracelet': '/assets/watch_black_steel.png',
  'Rubber Sport': '/assets/wt8.png',
  'Satin Fabric': '/assets/wt3.png',
  'Titanium Mesh': '/assets/watch_black_steel.png'
};

const FALLBACK_FINISHES = ['Polished', 'Brushed', 'PVD Black', 'Rose Gold PVD', 'Matte Grey'];

const DEFAULT_DIAL_PRICES = {
  '#0a0a0f': 100, // Midnight Black
  '#f5f0e8': 120, // Pearl White
  '#1a2a4a': 140, // Navy Blue
  '#1c3a2a': 160, // Forest Green
  '#c8a96a': 180, // Champagne Gold
  '#6b1515': 200, // Crimson Red
  '#f5f5dc': 150  // Beige Dial
};

const DEFAULT_STRAP_PRICES = {
  'Tan Leather': 150,
  'Diamond Silver Link': 450,
  'Classic Gold Chain': 500,
  'Forest Green Rubber': 200,
  'Brushed Steel Link': 300,
  'Alligator Leather': 250,
  'Steel Bracelet': 350,
  'Rubber Sport': 180,
  'Satin Fabric': 220,
  'Titanium Mesh': 400
};

const DEFAULT_CASE_PRICES = {
  'Polished': 100,
  'Brushed': 150,
  'PVD Black': 200,
  'Rose Gold PVD': 250,
  'Matte Grey': 300
};

// ─── Utility ─────────────────────────────────────────────────────────────────
function buildOptions(product) {
  const opts = product.customizationOptions || {};
  const dialColors = (opts.dialColors?.length ? opts.dialColors : FALLBACK_DIAL_COLORS.map(d => d.value))
    .map(v => FALLBACK_DIAL_COLORS.find(d => d.value === v) || { label: v, value: v, textDark: false });
  
  // Custom strap options (Women: first three, Men: 1, 4, 5)
  const defaultStraps = product.gender === 'women'
    ? ['Tan Leather', 'Diamond Silver Link', 'Classic Gold Chain']
    : ['Tan Leather', 'Forest Green Rubber', 'Brushed Steel Link'];

  const strapMaterials = [...(opts.strapMaterials?.length ? opts.strapMaterials : defaultStraps)];
  if (opts.customStrapName && !strapMaterials.includes(opts.customStrapName)) {
    strapMaterials.push(opts.customStrapName);
  }
  const customStraps = opts.customStraps || [];
  customStraps.forEach(cs => {
    if (cs.name && !strapMaterials.includes(cs.name)) {
      strapMaterials.push(cs.name);
    }
  });
  
  // Custom case finishes
  const caseFinishes = [...(opts.caseFinishes?.length ? opts.caseFinishes : FALLBACK_FINISHES)];
  if (opts.customCaseName && !caseFinishes.includes(opts.customCaseName)) {
    caseFinishes.push(opts.customCaseName);
  }
  const customCases = opts.customCases || [];
  customCases.forEach(cc => {
    if (cc.name && !caseFinishes.includes(cc.name)) {
      caseFinishes.push(cc.name);
    }
  });

  const engravingAllowed = opts.engravingAllowed ?? true;
  return { 
    dialColors, 
    strapMaterials, 
    caseFinishes, 
    engravingAllowed,
    customStrapName: opts.customStrapName || '',
    customStrapImage: opts.customStrapImage || '',
    customCaseName: opts.customCaseName || '',
    customCaseColor: opts.customCaseColor || '',
    customStraps,
    customCases
  };
}

// ─── Watch Face Preview ───────────────────────────────────────────────────────
function WatchPreview({ product, dialColor, finish, engraving, strapImage, caseColor }) {
  const finishTone = caseColor || (
    finish?.toLowerCase().includes('black') ? '#1a1a1a'
      : finish?.toLowerCase().includes('rose') ? '#c8856a'
      : finish?.toLowerCase().includes('matte') ? '#555'
      : finish?.toLowerCase().includes('brushed') ? '#888'
      : '#c0c0c0'
  );

  return (
    <div className="relative flex items-center justify-center w-full overflow-hidden rounded-xl" style={{ minHeight: 350 }}>
      {/* Background glow to reflect case finish */}
      <div
        className="absolute rounded-full blur-3xl opacity-40 w-72 h-72 transition-colors duration-700"
        style={{ background: finishTone, zIndex: 1 }}
      />

      {/* Strap Texture Ambient Background */}
      {strapImage && (
         <div className="absolute inset-0 opacity-20 transition-all duration-700 pointer-events-none"
           style={{
             backgroundImage: `url(${strapImage})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             zIndex: 0,
             mixBlendMode: 'luminosity'
           }}
         />
      )}

      {/* Actual Product Image container */}
      <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center group">
        
        {/* Watch Image */}
        <img 
          src={product?.image} 
          alt={product?.name} 
          onError={(e) => handleImageError(e)}
          className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
        />
        

        
        {/* Engraving */}
        {engraving && (
          <div className="absolute z-30 bottom-[28%] left-1/2 transform -translate-x-1/2 text-center pointer-events-none w-full">
             <span
              className="text-[8px] tracking-[0.2em] italic font-serif opacity-80"
              style={{ color: dialColor?.textDark ? '#000' : '#fff', textShadow: dialColor?.textDark ? '0px 1px 1px rgba(255,255,255,0.5)' : '0px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {engraving.slice(0, 18)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Customization({ onPageChange, params }) {
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);
  const currentCurrency = useSelector(selectCurrentCurrency);

  const customizableProducts = useMemo(() => {
    return products.filter(p => p.customizable === true);
  }, [products]);

  // Legacy: if admin has never touched the flag, all will be undefined — show all
  const noneExplicitlySet = useMemo(
    () => products.every(p => p.customizable === undefined || p.customizable === null),
    [products]
  );

  const displayProducts = noneExplicitlySet ? products : customizableProducts;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialColor,       setDialColor]       = useState(null);
  const [strapMaterial,   setStrapMaterial]   = useState(null);
  const [caseFinish,      setCaseFinish]      = useState(null);
  const [engraving,       setEngraving]       = useState('');
  const [addedToCart,     setAddedToCart]     = useState(false);
  const options = selectedProduct ? buildOptions(selectedProduct) : null;

  const dialPrice = useMemo(() => {
    if (!selectedProduct || !dialColor) return 0;
    const dbVal = selectedProduct.customizationOptions?.dialPrices?.[dialColor.value];
    if (dbVal !== undefined && dbVal !== null && dbVal !== '') return Number(dbVal);
    return DEFAULT_DIAL_PRICES[dialColor.value] || 150;
  }, [selectedProduct, dialColor]);

  const strapPrice = useMemo(() => {
    if (!selectedProduct || !strapMaterial) return 0;
    const matchingCustom = (options?.customStraps || []).find(cs => cs.name === strapMaterial);
    if (matchingCustom && matchingCustom.price !== undefined && matchingCustom.price !== null) return Number(matchingCustom.price);
    const dbVal = selectedProduct.customizationOptions?.strapPrices?.[strapMaterial];
    if (dbVal !== undefined && dbVal !== null && dbVal !== '') return Number(dbVal);
    return DEFAULT_STRAP_PRICES[strapMaterial] || 250;
  }, [selectedProduct, strapMaterial, options]);

  const casePrice = useMemo(() => {
    if (!selectedProduct || !caseFinish) return 0;
    const matchingCustom = (options?.customCases || []).find(cc => cc.name === caseFinish);
    if (matchingCustom && matchingCustom.price !== undefined && matchingCustom.price !== null) return Number(matchingCustom.price);
    const dbVal = selectedProduct.customizationOptions?.casePrices?.[caseFinish];
    if (dbVal !== undefined && dbVal !== null && dbVal !== '') return Number(dbVal);
    return DEFAULT_CASE_PRICES[caseFinish] || 200;
  }, [selectedProduct, caseFinish, options]);

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    const finalBasePrice = selectedProduct.discountPercent 
      ? Math.round(selectedProduct.price * (1 - selectedProduct.discountPercent / 100))
      : selectedProduct.price;
    return finalBasePrice + dialPrice + strapPrice + casePrice;
  }, [selectedProduct, dialPrice, strapPrice, casePrice]);

  useEffect(() => {
    document.title = 'Custom Timepiece Atelier | KHRONIQ';
  }, []);

  // Reset page back to customizable models selection when params.reset is received from Navbar
  useEffect(() => {
    if (params && params.reset) {
      setSelectedProduct(null);
    }
  }, [params]);

  // Currency formatter
  const formatPrice = (usd) => formatPriceUtil(usd, currentCurrency);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    const opts = buildOptions(product);
    setDialColor(opts.dialColors[0] || null);
    setStrapMaterial(product.allowStrapCustomization !== false ? (opts.strapMaterials[0] || null) : (product.specs?.strap || 'Standard Strap'));
    setCaseFinish(product.allowCaseCustomization !== false ? (opts.caseFinishes[0] || null) : (product.specs?.case || 'Standard Finish'));
    setEngraving('');
    setAddedToCart(false);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    const customConfig = {
      dialColor: dialColor?.value || '',
      strapMaterial: strapMaterial || '',
      caseFinish: caseFinish || '',
      engraving: engraving || ''
    };
    const result = await dispatch(addToCart(selectedProduct.id, 1, totalPrice, customConfig));
    if (result?.success !== false) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    }
  };

  // ── Grid view (no product selected) ─────────────────────────────────────────
  if (!selectedProduct) {
    return (
      <div className="space-y-10 pb-16">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0d1a3a 50%, #0a0a14 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #2563eb 0%, transparent 60%), radial-gradient(circle at 75% 50%, #2563eb 0%, transparent 60%)' }} />
          <Paintbrush className="mx-auto mb-4" style={{ color: '#3b82f6' }} size={40} />
          <h1 className="font-serif text-4xl font-black tracking-widest uppercase mb-3" style={{ color: '#ffffff' }}>
            Bespoke Atelier
          </h1>
          <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: '#ffffff' }}>
            Craft your signature timepiece. Select a customizable model below and tailor
            every detail — from dial colour to engraved inscription.
          </p>
        </div>

        {/* Product grid */}
        {displayProducts.length === 0 ? (
          <div className="rounded-xl p-20 text-center space-y-4" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0d1a3a 50%, #0a0a14 100%)', border: '1px dashed rgba(59,130,246,0.3)' }}>
            <Sparkles size={36} className="mx-auto opacity-70" style={{ color: '#3b82f6' }} />
            <p className="text-sm" style={{ color: '#ffffff' }}>No customizable watches are available at the moment.</p>
            <button
              onClick={() => onPageChange('shop')}
              className="mt-4 px-8 py-2.5 text-white text-xs font-bold uppercase tracking-widest transition cursor-pointer rounded"
              style={{ background: '#1e3a8a' }}
              onMouseEnter={e => e.currentTarget.style.background='#2563eb'}
              onMouseLeave={e => e.currentTarget.style.background='#1e3a8a'}
            >
              Browse All Watches
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>
                {noneExplicitlySet
                  ? `All ${displayProducts.length} models available for customisation`
                  : `${displayProducts.length} model${displayProducts.length !== 1 ? 's' : ''} available for customisation`}
              </h2>
              {noneExplicitlySet && (
                <span className="text-[10px] border px-2.5 py-1 rounded" style={{ color: 'rgba(59,130,246,0.6)', borderColor: 'rgba(59,130,246,0.2)' }}>
                  Mark specific watches in Admin to restrict selection
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <motion.button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group text-left rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  style={{ background: 'linear-gradient(145deg, #0a0a14 0%, #0d1a3a 100%)' }}
                >
                  <div className="relative overflow-hidden bg-[#0d0d0d]" style={{ height: 200 }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Customizable badge */}
                    <div className="absolute top-3 right-3 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'transparent' }}>
                      <Paintbrush size={9} />
                      CUSTOMIZABLE
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>{product.category}</p>
                    <h3 className="font-bold text-sm leading-tight" style={{ color: '#ffffff' }}>{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-black" style={{ color: '#ffffff' }}>{formatPrice(product.price)}</span>
                      <span className="text-[10px] border px-2.5 py-1 rounded font-bold tracking-wider transition" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>
                        CUSTOMISE →
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Customiser view ──────────────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="customiser"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35 }}
        className="pb-16"
      >
        {/* Back */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-2 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 transition cursor-pointer"
        >
          <ChevronLeft size={16} /> All Customizable Models
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* ── LEFT: Live Preview ── */}
          <div className="space-y-6 sticky top-28">
            <div className="dark-panel bg-[#0d0d0d] rounded-2xl border border-white/5 p-4 sm:p-8 flex flex-col items-center gap-6">
              <WatchPreview
                product={selectedProduct}
                dialColor={dialColor}
                finish={caseFinish}
                engraving={engraving}
                strapImage={
                  (() => {
                    const matchingCustom = (options?.customStraps || []).find(cs => cs.name === strapMaterial);
                    if (matchingCustom) return matchingCustom.image;
                    if (strapMaterial === options?.customStrapName) return options?.customStrapImage;
                    return STRAP_IMAGES[strapMaterial] || '';
                  })()
                }
                caseColor={
                  (() => {
                    const matchingCustom = (options?.customCases || []).find(cc => cc.name === caseFinish);
                    if (matchingCustom) return matchingCustom.color;
                    if (caseFinish === options?.customCaseName) return options?.customCaseColor;
                    return '';
                  })()
                }
              />
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-lg">{selectedProduct.name}</p>
                <p className="text-gray-400 text-xs">{selectedProduct.category} · {selectedProduct.gender}</p>
                <p className="font-black text-xl mt-2" style={{ color: '#3b82f6' }}>{formatPrice(totalPrice)}</p>
              </div>
            </div>

            {/* Summary card */}
            <div className="dark-panel bg-[#111111] rounded-xl border border-white/5 p-5 space-y-3 text-xs text-white/90">
              <p className="text-white font-bold text-[11px] uppercase tracking-widest mb-3">Your Configuration</p>
              {[
                ['Dial Color',     dialColor?.label   || '—', selectedProduct.allowDialCustomization !== false],
                ['Strap Material', strapMaterial      || '—', selectedProduct.allowStrapCustomization !== false],
                ['Case Finish',    caseFinish         || '—', selectedProduct.allowCaseCustomization !== false],
                ['Engraving',      engraving || 'None',   options.engravingAllowed],
              ].filter(([,, allowed]) => allowed).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-300">{k}</span>
                  <span className="text-white font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Options ── */}
          <div className="space-y-8">
            <div>
              <h1 className="font-serif text-3xl font-black text-white tracking-wider">
                Customise Your <br />
                <span style={{ color: '#3b82f6' }}>{selectedProduct.name}</span>
              </h1>
              <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                Each configuration is unique. Changes are reflected live in the preview.
              </p>
            </div>

            {/* Dial Color */}
            {selectedProduct.allowDialCustomization !== false && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  Dial Color — <span className="text-white">{dialColor?.label}</span>
                </h3>
                <div className="flex flex-wrap gap-4">
                  {options.dialColors.map((color) => {
                    const priceVal = (() => {
                      const dbVal = selectedProduct.customizationOptions?.dialPrices?.[color.value];
                      if (dbVal !== undefined && dbVal !== null && dbVal !== '') return Number(dbVal);
                      return DEFAULT_DIAL_PRICES[color.value] || 150;
                    })();
                    return (
                      <div key={color.value} className="flex flex-col items-center space-y-1">
                        <button
                          onClick={() => setDialColor(color)}
                          title={color.label}
                          className="relative w-10 h-10 rounded-full border-2 transition-all duration-200 cursor-pointer"
                          style={{
                            background: color.value,
                            borderColor: dialColor?.value === color.value ? '#2563eb' : 'transparent',
                            boxShadow: dialColor?.value === color.value ? '0 0 0 3px rgba(37,99,235,0.35)' : 'none',
                          }}
                        >
                          {dialColor?.value === color.value && (
                            <Check size={14} className="absolute inset-0 m-auto" style={{ color: color.textDark ? '#000' : '#fff' }} />
                          )}
                        </button>
                        <span className="text-[9px] text-gray-400 font-mono">
                          +${priceVal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strap Material */}
            {selectedProduct.allowStrapCustomization !== false && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  Strap Option
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {options.strapMaterials.map((mat) => {
                    const matchingCustom = (options.customStraps || []).find(cs => cs.name === mat);
                    const imgUrl = matchingCustom 
                      ? matchingCustom.image 
                      : ((mat === options.customStrapName && options.customStrapImage) 
                        ? options.customStrapImage 
                        : (STRAP_IMAGES[mat] || '/assets/wt4.png'));
                    const priceVal = (() => {
                      if (matchingCustom && matchingCustom.price !== undefined && matchingCustom.price !== null) return Number(matchingCustom.price);
                      const dbVal = selectedProduct.customizationOptions?.strapPrices?.[mat];
                      if (dbVal !== undefined && dbVal !== null && dbVal !== '') return Number(dbVal);
                      return DEFAULT_STRAP_PRICES[mat] || 250;
                    })();
                    return (
                      <button
                        key={mat}
                        onClick={() => setStrapMaterial(mat)}
                        className={`flex flex-col items-center p-2.5 rounded border transition-all cursor-pointer bg-luxury-dark/40 ${
                          strapMaterial === mat
                            ? 'border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                            : 'border-white/5 text-gray-300 hover:border-white/20 hover:text-white'
                        }`}
                        style={strapMaterial === mat ? { color: '#3b82f6' } : {}}
                      >
                        <div className="w-full h-20 bg-luxury-dark/80 rounded border border-white/5 overflow-hidden flex items-center justify-center p-1.5 mb-2">
                          <img
                            src={imgUrl}
                            alt={mat}
                            className="max-h-full max-w-full object-contain rounded-sm"
                          />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-center leading-tight">
                          {mat}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono mt-1">
                          +${priceVal}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Case Finish */}
            {selectedProduct.allowCaseCustomization !== false && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  Case Finish — <span className="text-white">{caseFinish}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {options.caseFinishes.map((fin) => {
                    const matchingCustom = (options.customCases || []).find(cc => cc.name === fin);
                    const priceVal = (() => {
                      if (matchingCustom && matchingCustom.price !== undefined && matchingCustom.price !== null) return Number(matchingCustom.price);
                      const dbVal = selectedProduct.customizationOptions?.casePrices?.[fin];
                      if (dbVal !== undefined && dbVal !== null && dbVal !== '') return Number(dbVal);
                      return DEFAULT_CASE_PRICES[fin] || 200;
                    })();
                    return (
                      <button
                        key={fin}
                        onClick={() => setCaseFinish(fin)}
                        className={`px-3 py-2 text-xs font-bold rounded border transition-all cursor-pointer ${
                          caseFinish === fin
                            ? 'border-blue-500'
                            : 'border-white/10 text-gray-300 hover:border-white/30 hover:text-white'
                        }`}
                        style={caseFinish === fin ? { background: 'rgba(37,99,235,0.1)', color: '#3b82f6' } : {}}
                      >
                        {fin} (+${priceVal})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Engraving */}
            {options.engravingAllowed && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  Personal Engraving <span className="text-white/30">(optional)</span>
                </h3>
                <input
                  type="text"
                  maxLength={18}
                  value={engraving}
                  onChange={(e) => setEngraving(e.target.value)}
                  placeholder="Your inscription…"
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition font-serif italic" style={{ '--tw-ring-color': '#2563eb' }} onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
                <p className="text-[10px] text-gray-300">{engraving.length}/18 characters</p>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer !text-white ${
                addedToCart
                  ? 'bg-green-600'
                  : ''
              }`}
              style={!addedToCart ? { background: '#1e3a8a' } : {}}
              onMouseEnter={e => { if (!addedToCart) e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={e => { if (!addedToCart) e.currentTarget.style.background = '#1e3a8a'; }}
            >
              {addedToCart ? (
                <>
                  <Check size={18} /> Added to Bag!
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> Add Custom Piece to Bag
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-300 text-center leading-relaxed">
              Customized pieces are handcrafted to order and may take 4–6 weeks for delivery.
              Returns are not accepted on personalized items.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, toggleWishlist, addReview, selectCurrentCurrency, formatPrice, getDiscountedPrice, fetchSingleProduct, getProductMrp, getSellingPrice, getDiscountPercent } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import { findProductInList } from '../utils/productRouting';
import ProductCard from '../components/ProductCard';
import BackButton from '../components/BackButton';
import { Star, Shield, RefreshCw, Truck, Heart, ShoppingBag, Plus, Minus, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';
import { getExpectedDeliveryDate } from '../utils/deliveryUtils';

export default function ProductDetail({ params, onPageChange }) {
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);
  const productsLoaded = useSelector(state => state.watch.productsLoaded);
  const wishlist = useSelector(state => state.watch.wishlist);
  const currentUser = useSelector(state => state.watch.currentUser);
  const currentCurrency = useSelector(selectCurrentCurrency);

  const rawParamId = params?.id || params?.slug;
  const storeProduct = findProductInList(products, rawParamId);

  const [apiProduct, setApiProduct] = useState(null);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiAttempted, setApiAttempted] = useState(false);

  // If not found in current Redux catalog, query backend
  useEffect(() => {
    if (!rawParamId) return;
    const inStore = findProductInList(products, rawParamId);
    if (inStore) {
      setApiProduct(null);
      setApiAttempted(true);
      return;
    }

    let isMounted = true;
    setIsSearchingApi(true);
    dispatch(fetchSingleProduct(rawParamId)).then((res) => {
      if (isMounted) {
        if (res && res.success && res.product) {
          setApiProduct(res.product);
        }
        setIsSearchingApi(false);
        setApiAttempted(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawParamId, products, dispatch]);

  const product = storeProduct || apiProduct;

  // States
  const [qty, setQty] = useState(1);

  // Ensure qty is always between 1 and available stock
  useEffect(() => {
    if (product && product.stock !== undefined) {
      setQty(prev => {
        const maxStock = Math.max(1, product.stock);
        return Math.max(1, Math.min(prev, maxStock));
      });
    }
  }, [product?.id, product?.stock]);
  const [activeTab, setActiveTab] = useState('specs'); // specs | details
  const [ratingInput, setRatingInput] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  // Pincode Checker States
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode.trim()) {
      alert('Please enter a pincode.');
      return;
    }
    const dateStr = getExpectedDeliveryDate(pincode);
    if (dateStr) {
      setDeliveryEstimate(dateStr);
      setIsChecked(true);
    } else {
      alert('Invalid pincode. Please enter digits.');
    }
  };

  // Hover Zoom States & Handler
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, pxX: 0, pxY: 0, width: 0, height: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setZoomPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      pxX: x,
      pxY: y,
      width: rect.width,
      height: rect.height,
    });
  };

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Reset selected image when navigating to a new product
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id, product?._id]);

  // Gallery calculation strictly without any fake or placeholder fallbacks
  const rawImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (product?.image ? [product.image] : []);

  const allImages = rawImages
    .map(img => (typeof img === 'string' ? img.trim() : ''))
    .filter(Boolean);

  const currentImage = allImages[selectedImageIndex] || product?.image || '';

  const isWishlisted = product ? wishlist.includes(product.id) : false;

  useEffect(() => {
    if (product) {
      document.title = `KHRONIQ — ${product.name}`;

      const scriptId = 'product-jsonld';
      let scriptTag = document.getElementById(scriptId);
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: allImages.length > 0 ? allImages : (product.image ? [product.image] : []),
        description: product.description || `${product.name} luxury timepiece by KHRONIQ`,
        sku: product.id,
        brand: {
          '@type': 'Brand',
          name: product.brand || 'KHRONIQ'
        },
        offers: {
          '@type': 'Offer',
          url: window.location.href,
          priceCurrency: 'INR',
          price: getSellingPrice(product),
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition'
        }
      };

      scriptTag.textContent = JSON.stringify(productSchema);
    } else if (productsLoaded && apiAttempted) {
      document.title = 'KHRONIQ — Timepiece Not Found';
    }

    return () => {
      const existing = document.getElementById('product-jsonld');
      if (existing) existing.remove();
    };
  }, [product, productsLoaded, apiAttempted]);

  if (!product) {
    if (!productsLoaded || isSearchingApi || !apiAttempted) {
      return (
        <div className="min-h-[55vh] flex flex-col items-center justify-center space-y-4 py-16">
          <div className="w-8 h-8 border-2 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
          <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
            Loading Timepiece Details...
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center space-y-6 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-300 text-neutral-800">
          <Shield className="w-8 h-8 stroke-1 text-luxury-gold-dark" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#047857]">Atelier Catalog</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-widest text-luxury-text">
            Timepiece Not Found
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            The requested luxury watch {rawParamId ? `"${rawParamId}"` : ''} does not exist in our catalog or the link may have expired.
          </p>
        </div>
        <div className="pt-2">
          <BackButton
            onPageChange={onPageChange}
            fallbackPage="shop"
            label="Return to Shop"
            className="px-8 py-3.5 bg-black !text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
          />
        </div>
      </div>
    );
  }

  // Calculate average rating
  const approvedReviews = product?.reviews?.filter(r => r.status === 'approved') || [];
  const averageRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : null;
  const mrp = getProductMrp(product);
  const sellingPrice = getSellingPrice(product);
  const discountPercent = getDiscountPercent(product);
  const isDiscounted = mrp > sellingPrice && discountPercent > 0;

  const handleAddToCart = async () => {
    const targetId = product.id || product._id;
    const result = await dispatch(addToCart(targetId, qty));
    if (result && result.success) {
      alert("ADDED TO CART");
    } else {
      alert(result?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    const targetId = product.id || product._id;
    const result = await dispatch(addToCart(targetId, qty));
    if (result && result.success) {
      if (currentUser) {
        onPageChange('checkout');
      } else {
        onPageChange('login', { redirect: 'checkout' });
      }
    } else {
      alert(result?.message || "Failed to proceed to checkout");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in first to write a review.');
      return;
    }

    if (!ratingInput || ratingInput < 1) {
      alert('Please select a star rating score (1 to 5 stars).');
      return;
    }

    if (!commentInput.trim()) {
      alert('Please enter a review comment.');
      return;
    }

    const targetId = product?.id || product?._id;
    const res = await dispatch(addReview(targetId, ratingInput, commentInput));
    if (res && res.success) {
      setReviewMessage(res.message || 'Review submitted successfully!');
      setCommentInput('');
      setRatingInput(0);
      setHoverRating(0);
      setTimeout(() => setReviewMessage(''), 6000);
    } else {
      alert(res?.message || 'Failed to submit review.');
    }
  };

  // Find related products (exclude current)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  
  // If not enough related products, fill with others
  if (relatedProducts.length < 3) {
    const fillProducts = products.filter(p => p.id !== product.id && !relatedProducts.some(rp => rp.id === p.id)).slice(0, 3 - relatedProducts.length);
    relatedProducts.push(...fillProducts);
  }

  return (
    <div className="space-y-16 pb-12">
      
      {/* Back Button */}
      <BackButton
        onPageChange={onPageChange}
        fallbackPage="shop"
        label="BACK TO CATALOGUE"
      />

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-6">
          <div 
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => { setIsZoomed(false); setZoomPos({ x: 0, y: 0, pxX: 0, pxY: 0, width: 0, height: 0 }); }}
            onMouseMove={handleMouseMove}
            className="bg-luxury-gray border border-white/5 rounded-md aspect-square flex items-center justify-center p-0 overflow-hidden relative cursor-zoom-in group"
          >
            <img
              src={currentImage}
              alt={product.name}
              onError={(e) => handleImageError(e)}
              className="w-full h-full object-cover filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
            />

            {/* Hover Target Magnifying Square Lens */}
            {isZoomed && (
              <div 
                className="absolute border-2 border-luxury-gold bg-[#0d0d0d] overflow-hidden rounded-full pointer-events-none hidden lg:block shadow-[0_20px_50px_rgba(0,0,0,0.65)] z-10"
                style={{
                  width: '180px',
                  height: '180px',
                  left: `${zoomPos.x}%`,
                  top: `${zoomPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <img 
                  src={currentImage}
                  alt="Zoomed view"
                  onError={(e) => handleImageError(e)}
                  className="absolute max-w-none"
                  style={{
                    width: `${zoomPos.width * 3}px`,
                    height: `${zoomPos.height * 3}px`,
                    left: `${90 - (zoomPos.pxX * 3)}px`,
                    top: `${90 - (zoomPos.pxY * 3)}px`,
                  }}
                />
              </div>
            )}

            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center pointer-events-none z-15">
                <span className="text-luxury-red font-bold text-sm tracking-widest uppercase border border-luxury-red px-4 py-2">
                  Sold Out
                </span>
              </div>
            )}

            {product.stock > 0 && product.stock < 5 && (
              <div className="absolute bottom-4 left-4 bg-luxury-red text-white uppercase text-[10px] tracking-[0.2em] font-semibold px-3 py-1.5 rounded-sm shadow-lg shadow-black/30 flex items-center gap-1.5 z-15">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Hurry, only {product.stock} left!
              </div>
            )}
          </div>

          {/* Multi-image thumbnail strip */}
          <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
            {allImages.map((imgUrl, idx) => {
              const isSelected = idx === selectedImageIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded border transition-all duration-200 overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'border-luxury-gold ring-1 ring-luxury-gold shadow-md shadow-black/40 scale-105'
                      : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} perspective ${idx + 1}`}
                    onError={(e) => handleImageError(e)}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
          {/* Guarantees Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 border border-luxury-text/5 rounded shadow-sm mt-4">
            <div className="flex flex-col items-center text-center p-2 space-y-1">
              <Truck size={18} className="text-luxury-gold-dark" />
              <span className="text-[9px] font-bold text-gray-800 tracking-widest uppercase">FREE SHIPPING</span>
              <p className="text-[9px] text-gray-500">2-4 Business Days Express</p>
            </div>
            <div className="flex flex-col items-center text-center p-2 space-y-1 border-t sm:border-t-0 sm:border-l sm:border-r border-luxury-text/10">
              <RefreshCw size={18} className="text-luxury-gold-dark" />
              <span className="text-[9px] font-bold text-gray-800 tracking-widest uppercase">EASY RETURNS</span>
              <p className="text-[9px] text-gray-500">7-day free return policy</p>
            </div>
            <div className="flex flex-col items-center text-center p-2 space-y-1">
              <Shield size={18} className="text-luxury-gold-dark" />
              <span className="text-[9px] font-bold text-gray-800 tracking-widest uppercase">WARRANTY</span>
              <p className="text-[9px] text-gray-700 font-medium">{product.warrantyMonths || 12} Months Warranty</p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-luxury-gold-dark text-xs font-bold tracking-widest uppercase">{(product.category === 'Khronomaster' ? 'Classic' : product.category)} COLLECTION</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-luxury-text uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif' }}>{product.name}</h1>
            
            {/* Review Badge */}
            <div className="flex items-center space-x-2">
              <div className="flex text-luxury-gold-dark">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    fill={i < Math.floor(Number(averageRating || 0)) ? "var(--color-luxury-gold-dark)" : "none"} 
                    className="stroke-1"
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {averageRating ? `${averageRating} / 5.0 (${approvedReviews.length} reviews)` : 'No approved reviews yet'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {isDiscounted ? (
              <div className="space-y-1">
                <p className="text-[14px] text-red-400 line-through">{formatPrice(mrp, currentCurrency)}</p>
                <p className="text-2xl font-bold text-luxury-text">{formatPrice(sellingPrice, currentCurrency)}</p>
                <p className="text-[11px] text-luxury-gold uppercase tracking-[0.24em] font-semibold">Save {formatPrice(mrp - sellingPrice, currentCurrency)}</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-luxury-text">{formatPrice(sellingPrice, currentCurrency)}</p>
            )}
          </div>
           
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-normal">{product.description}</p>

          <div className="border-t border-b border-luxury-text/10 py-6 space-y-4">
            {/* Quantity Selector & Stock Indicator */}
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Select Quantity</span>
                  <div className="flex items-center border border-luxury-text/10 rounded bg-white">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                      className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-6 text-sm font-semibold text-luxury-text">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      disabled={qty >= (product?.stock ?? 0)}
                      className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1.5 justify-end">
                    <CheckCircle2 size={12} />
                    <span>{product.stock < 5 ? `Hurry, only ${product.stock} left!` : 'In Stock'}</span>
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Complementary Express Shipping & Returns</p>
                </div>
              </div>
            ) : (
              <span className="text-xs text-luxury-red font-semibold uppercase tracking-wider block">Currently Out of Stock</span>
            )}

            {/* Actions (Add to Cart / Buy Now / Wishlist) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {product.stock > 0 && (
                <>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-4 bg-luxury-red hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase transition duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-luxury-red/10"
                  >
                    <ShoppingBag size={16} />
                    <span>Add to Shopping Bag</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-4 bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-dark text-xs font-bold tracking-widest uppercase transition duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-luxury-gold/10"
                  >
                    <Zap size={16} />
                    <span>Buy Now</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => dispatch(toggleWishlist(product.id))}
                className={`py-4 px-5 border text-xs font-bold tracking-widest uppercase transition duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
                  isWishlisted 
                    ? 'border-luxury-gold-dark bg-luxury-gold-dark text-white'
                    : 'border-luxury-text/10 hover:border-luxury-text text-luxury-text bg-white'
                }`}
              >
                <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
              </button>
            </div>
          </div>

          {/* Delivery Pincode Checker */}
          <div className="bg-luxury-gray border border-white/5 p-4 rounded space-y-3">
            <div className="flex items-center space-x-2">
              <Truck size={14} className="text-luxury-gold-dark" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-text">Estimated Delivery Courier</h4>
            </div>
            
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  setIsChecked(false);
                }}
                placeholder="Enter pincode (e.g. 110001)"
                maxLength={8}
                className="flex-1 bg-white border border-gray-300 rounded text-xs px-3 py-2 focus:outline-none focus:border-luxury-gold-dark text-luxury-text"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold-dark transition cursor-pointer"
              >
                Check
              </button>
            </form>

            {isChecked && deliveryEstimate && (
              <div className="pt-2.5 border-t border-white/5 space-y-1">
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Estimated Delivery</p>
                <p className="text-xs font-semibold text-luxury-text">{deliveryEstimate}</p>
                <p className="text-[8px] text-gray-500 font-light leading-relaxed">Secure courier service dispatched directly from our Indian Manufacture headquarters.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tabs Menu: Specifications & Details */}
      <section className="space-y-6">
        <div className="flex border-b border-luxury-text/10">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-6 text-xs font-bold tracking-widest uppercase border-b-2 cursor-pointer transition ${
              activeTab === 'specs' 
                ? 'border-luxury-gold-dark text-luxury-gold-dark' 
                : 'border-transparent text-luxury-muted hover:text-luxury-text'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-6 text-xs font-bold tracking-widest uppercase border-b-2 cursor-pointer transition ${
              activeTab === 'details' 
                ? 'border-luxury-gold-dark text-luxury-gold-dark' 
                : 'border-transparent text-luxury-muted hover:text-luxury-text'
            }`}
          >
            Craftsmanship
          </button>
        </div>

        {/* Tab Content: Specs */}
        {activeTab === 'specs' && (
          <div className="text-xs bg-white border border-luxury-text/10 rounded p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {[
                { label: 'Movement Type',    value: product.specs?.movement },
                { label: 'Case Dimensions',  value: product.specs?.case },
                { label: 'Dial Color',       value: product.specs?.dialColor },
                { label: 'Case Material',    value: product.specs?.caseMaterial },
                { label: 'Strap Material',   value: product.specs?.strap },
                { label: 'Water Resistance', value: product.specs?.waterResistance },
                { label: 'Dial Glass Type',  value: product.specs?.glass },
                { label: 'Function',         value: product.specs?.watchFunction },
                { label: 'Collection',       value: product.specs?.collection || product.category },
                { label: 'Gender',           value: product.gender ? (product.gender.toLowerCase() === 'men' ? "Men's" : product.gender.toLowerCase() === 'women' ? "Women's" : (product.gender.toLowerCase() === 'unisex' ? 'Unisex' : product.gender)) : '' },
                { label: 'Warranty Details', value: product.specs?.warrantyDetails },
                { label: 'Warranty Period',  value: (() => {
                    if (product.specs?.warrantyPeriod) return product.specs.warrantyPeriod;
                    const m = Number(product.warrantyMonths) || 0;
                    if (m <= 0) return '';
                    return m % 12 === 0 ? `${m / 12} Year${m / 12 > 1 ? 's' : ''}` : `${m} Month${m > 1 ? 's' : ''}`;
                  })() },
                { label: 'Origin',           value: product.specs?.origin },
              ].map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  className={`flex justify-between py-2.5 border-b border-luxury-text/10 ${
                    i >= arr.length - 2 ? 'md:border-b-0' : ''
                  } ${i === arr.length - 1 ? 'border-b-0' : ''}`}
                >
                  <span className="text-gray-500 tracking-wider uppercase">{label}</span>
                  <span className="text-gray-800 font-semibold uppercase text-right ml-4">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Tab Content: Details */}
        {activeTab === 'details' && (
          <div className="space-y-4 text-xs sm:text-sm text-gray-800 font-normal leading-relaxed max-w-4xl bg-white border border-luxury-text/10 rounded p-6 sm:p-8 shadow-sm">
            <h4 className="text-gray-800 font-bold tracking-wider uppercase text-xs">The Khroniq Spirit of Innovation</h4>
            <p className="text-gray-600 font-normal">
              Each Khroniq watch is crafted with painstaking precision in our state-of-the-art manufacture. By integrating design, case tooling, assembly, and fine-tuning calibration under a single roof, Khroniq ensures every component complies with strict chronometer specifications and Swadeshi premium quality.
            </p>
            <p className="text-gray-600 font-normal">
              The double anti-reflective mineral dial glass ensures absolute clarity, shielding the watch indexes from solar glare and scratches. Fitted with premium gaskets, the case delivers advanced seals for water safety, maintaining structural integrity across varying atmospheres.
            </p>
          </div>
        )}
      </section>

      {/* Reviews Tab & Add Review form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: View Reviews */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-lg font-bold font-serif uppercase tracking-widest text-luxury-text">Client Reviews</h3>
          
          {approvedReviews.length === 0 ? (
            <p className="text-gray-500 text-xs italic">No reviews found for this timepiece yet.</p>
          ) : (
            <div className="space-y-4">
              {approvedReviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-luxury-text/10 p-5 rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-gray-800 text-xs font-semibold">{rev.userName}</p>
                      {/* Star icons */}
                      <div className="flex text-luxury-gold-dark">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={10} 
                            fill={i < rev.rating ? "var(--color-luxury-gold-dark)" : "none"} 
                            className="stroke-1"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{rev.date}</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-3 leading-relaxed font-normal">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Write Review Form */}
        <div className="lg:col-span-5 bg-white border border-luxury-text/10 p-6 rounded-md space-y-4 h-fit shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-luxury-text">Write a Review</h3>
          
          {reviewMessage && (
            <div className="p-3 bg-luxury-gold-dark/10 border border-luxury-gold-dark/30 rounded text-luxury-gold-dark text-xs font-medium">
              {reviewMessage}
            </div>
          )}

          {currentUser ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Rating selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block">
                    Rating Score
                  </label>
                  {(hoverRating > 0 || ratingInput > 0) && (
                    <span className="text-[10px] text-luxury-gold-dark font-bold tracking-wider uppercase">
                      {hoverRating || ratingInput} / 5 Stars
                    </span>
                  )}
                </div>
                <div 
                  className="flex space-x-2 py-0.5"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeScore = hoverRating || ratingInput;
                    const isFilled = star <= activeScore;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="text-luxury-gold-dark focus:outline-none hover:scale-125 transition-transform duration-150 cursor-pointer p-0.5"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <Star 
                          size={22} 
                          fill={isFilled ? "var(--color-luxury-gold-dark, #b8860b)" : "none"} 
                          stroke={isFilled ? "var(--color-luxury-gold-dark, #b8860b)" : "#9ca3af"}
                          className="transition-colors duration-150"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block">Review Details</label>
                <textarea
                  rows="4"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your experience wearing this luxury timepiece..."
                  className="w-full bg-luxury-bg border border-luxury-text/10 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-luxury-gold-dark"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 font-bold text-xs tracking-widest uppercase transition cursor-pointer shadow-sm"
                style={{ background: '#111111', color: '#ffffff' }}
                onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                onMouseLeave={e => e.currentTarget.style.background = '#111111'}
              >
                Submit Review
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-gray-600 text-xs">Please log in to submit a rating and review for this timepiece.</p>
              <button
                onClick={() => onPageChange('login', { redirect: `product-detail:${product.id}` })}
                className="px-4 py-2 bg-transparent border border-luxury-text/20 text-luxury-text font-semibold text-xs tracking-widest uppercase hover:border-luxury-text transition cursor-pointer"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Related Products Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-bold font-serif uppercase tracking-widest text-luxury-text">Suggested Timepieces</h3>
          <div className="w-10 h-[1.5px] bg-luxury-gold-dark mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {relatedProducts.map((relProduct) => (
            <ProductCard 
              key={relProduct.id} 
              product={relProduct} 
              onPageChange={onPageChange} 
            />
          ))}
        </div>
      </section>

    </div>
  );
}
import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, toggleWishlist, selectCurrentCurrency, formatPrice, getDiscountedPrice } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

export default function ProductCard({ product, onPageChange, showRemove = false }) {
  const dispatch = useDispatch();
  const wishlist = useSelector(state => state.watch.wishlist);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const isWishlisted = wishlist.includes(product.id);

  /* Toast state */
  const [toast, setToast] = useState(null); // 'added' | 'removed' | null
  const toastTimer = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const approvedReviews = product.reviews?.filter(r => r.status === 'approved') || [];
  const averageRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : null;

  /* ── 3-D tilt on hover ── */
  const cardRef = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [8, -8]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-8, 8]), { stiffness: 180, damping: 18 });

  const handleMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };
  
  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const result = await dispatch(addToCart(product.id, 1));
    if (result && result.success) {
      alert("ADDED TO CART");
    } else {
      alert(result?.message || "Failed to add to cart");
    }
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const willAdd = !isWishlisted;
    dispatch(toggleWishlist(product.id));

    /* Show toast */
    clearTimeout(toastTimer.current);
    setToast(willAdd ? 'added' : 'removed');
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  const specItems = [];
  if (product.specs?.case) specItems.push(product.specs.case);
  if (product.specs?.movement) specItems.push(product.specs.movement);
  if (product.specs?.strap) specItems.push(product.specs.strap);
  const specLine = specItems.length > 0 ? specItems.join(' • ') : 'Khroniq Caliber';
  const discountedPrice = getDiscountedPrice(product);
  const isDiscounted = Number(product.discountPercent) > 0 && discountedPrice < product.price;
  const savedAmount = isDiscounted ? product.price - discountedPrice : 0;

  return (
    <div
      ref={cardRef}
      onClick={(e) => {
        if (e.target.closest('.action-btn')) return;
        onPageChange('product-detail', { id: product.id });
      }}
      onMouseMove={handleMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        handleLeave();
        setIsHovered(false);
      }}
      style={{ perspective: 800 }}
      className="group relative flex flex-col h-full cursor-pointer bg-transparent"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={{ z: isHovered ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col h-full w-full"
      >
        {/* Image */}
        <div className="aspect-square bg-[#f6f6f6] rounded-sm overflow-hidden relative flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => handleImageError(e)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
          />

          {/* Hover shimmer */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none transition-transform duration-700 ease-in-out"
            style={{ transform: isHovered ? 'translateX(120%)' : 'translateX(-120%)' }}
          />

          {product.discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-luxury-red text-white uppercase text-[10px] tracking-[0.2em] font-semibold px-2.5 py-1 rounded-sm shadow-lg shadow-black/20">
              {product.discountPercent}% OFF
            </div>
          )}

          {product.badge && (
            <div className="absolute top-3 right-3 bg-luxury-gold-dark uppercase text-[10px] tracking-[0.2em] font-semibold px-2.5 py-1 rounded-sm shadow-lg shadow-black/20" style={{ color: '#ffffff' }}>
              {product.badge}
            </div>
          )}
          
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-[#f6f6f6]/80 flex items-center justify-center">
              <span className="text-luxury-red font-bold text-[10px] tracking-widest uppercase border border-luxury-red px-2.5 py-1">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div
          className="pt-3 pb-2 bg-transparent space-y-1 flex flex-col justify-between flex-1 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0.85 }}
        >
          <div className="space-y-0.5">
            <h3
              className="text-luxury-text text-sm font-semibold tracking-wide line-clamp-1 transition-all duration-300"
              style={{
                color: isHovered ? '#000000' : 'inherit',
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
              }}
            >
              {product.name}
            </h3>
            <p className="text-[11px] text-luxury-muted font-normal tracking-wide">{specLine}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              {isDiscounted ? (
                <>
                  <p className="text-[10px] text-red-400 line-through">{formatPrice(product.price, currentCurrency)}</p>
                  <p
                    className="text-luxury-text text-xs sm:text-sm font-semibold transition-transform duration-300"
                    style={{
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'left center',
                    }}
                  >
                    {formatPrice(discountedPrice, currentCurrency)}
                  </p>
                </>
              ) : (
                <p
                  className="text-luxury-text text-xs sm:text-sm font-semibold transition-transform duration-300"
                  style={{
                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin: 'left center',
                  }}
                >
                  {formatPrice(product.price, currentCurrency)}
                </p>
              )}
            </div>
             
            {/* Cart and Wishlist Action Buttons */}
            <div className="flex items-center space-x-1.5 ml-2">
              {/* Wishlist Heart Button */}
              <button
                onClick={handleWishlistToggle}
                className="action-btn p-1.5 text-neutral-500 hover:text-luxury-red transition duration-200 cursor-pointer rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 relative flex items-center justify-center"
                title="Add to Wishlist"
              >
                <Heart
                  size={15}
                  fill={isWishlisted ? '#e10600' : 'none'}
                  stroke={isWishlisted ? '#e10600' : '#737373'}
                />
                
                {/* Wishlist burst animation */}
                <AnimatePresence>
                  {isWishlisted && (
                    <motion.span
                      key="burst"
                      className="absolute inset-0 rounded-full border border-red-500 pointer-events-none"
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{}}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </AnimatePresence>
              </button>

              {/* Cart Button */}
              <button
                onClick={handleAddToCart}
                className="action-btn p-1.5 text-neutral-500 hover:text-black transition duration-200 cursor-pointer rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center justify-center"
                title="Add to Cart"
              >
                <ShoppingBag size={15} />
              </button>
            </div>
          </div>

          {showRemove && (
            <button
              onClick={handleWishlistToggle}
              className="action-btn mt-2.5 w-full py-2 bg-transparent border border-red-500/25 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold tracking-widest uppercase transition duration-300 cursor-pointer rounded-sm"
            >
              Remove
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

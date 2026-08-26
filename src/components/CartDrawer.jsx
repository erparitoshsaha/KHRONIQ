import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCartQty, removeFromCart, selectCurrentCurrency, formatPrice, getDiscountedPrice  } from '../store/slices/watchSlice';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer({ isOpen, onClose, onPageChange }) {
  const dispatch = useDispatch();
  const cart = useSelector(state => state.watch.cart);
  const products = useSelector(state => state.watch.products);
  const currentUser = useSelector(state => state.watch.currentUser);
  const currentCurrency = useSelector(selectCurrentCurrency);

  // Calculate prices
  const cartItemsWithDetails = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product !== undefined);

  const subtotal = cartItemsWithDetails.reduce((sum, item) => sum + ((item.price !== undefined ? item.price : getDiscountedPrice(item.product)) * item.quantity), 0);
  const handleCheckoutClick = () => {
    onClose();
    if (currentUser) {
      onPageChange('checkout');
    } else {
      alert('Please log in or register an account before proceeding to checkout.');
      onPageChange('login', { redirect: 'checkout' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white border-l border-luxury-text/10 z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-luxury-text/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="text-luxury-gold-dark" size={20} />
                <h2 className="text-lg font-semibold tracking-widest text-luxury-text uppercase">Your Shopping Bag</h2>
              </div>
              <button
                onClick={onClose}
                className="text-luxury-muted hover:text-luxury-text p-1 hover:bg-luxury-bg/50 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItemsWithDetails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-luxury-bg flex items-center justify-center text-luxury-muted">
                    <ShoppingBag size={32} />
                  </div>
                  <div>
                    <h3 className="text-luxury-text font-medium text-base tracking-wide">Your bag is empty</h3>
                    <p className="text-luxury-muted text-xs mt-1">Explore our luxury timepiece collections to find your style.</p>
                  </div>
                  <button
                    onClick={() => { onClose(); onPageChange('shop'); }}
                    className="px-6 py-2.5 bg-luxury-gold-dark text-white text-xs font-semibold tracking-widest uppercase hover:bg-neutral-700 transition cursor-pointer"
                  >
                    Shop Collections
                  </button>
                </div>
              ) : (
                cartItemsWithDetails.map((item) => (
                  <div key={item.productId} className="flex space-x-4 border-b border-luxury-text/10 pb-6">
                    <div className="w-24 h-24 bg-luxury-gray/40 border border-luxury-text/5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center p-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 
                            onClick={() => { onClose(); onPageChange('product-detail', { id: item.productId }); }}
                            className="text-luxury-text text-sm font-semibold tracking-wide hover:text-luxury-gold-dark transition cursor-pointer line-clamp-1"
                          >
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => dispatch(removeFromCart(item.productId, item.customization))}
                            className="text-luxury-muted hover:text-luxury-red transition ml-2 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-luxury-gold-dark text-xs font-medium mt-1">
                          {formatPrice(item.price !== undefined ? item.price : getDiscountedPrice(item.product), currentCurrency)} each
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-luxury-text/10 rounded-md bg-luxury-bg">
                          <button
                            onClick={() => dispatch(updateCartQty(item.productId, item.quantity - 1, item.customization))}
                            className="p-1.5 text-luxury-muted hover:text-luxury-text transition cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-xs font-semibold text-luxury-text">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => dispatch(updateCartQty(item.productId, item.quantity + 1, item.customization))}
                            className="p-1.5 text-luxury-muted hover:text-luxury-text transition cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Total Price for item */}
                        <p className="text-luxury-text text-sm font-bold">
                          {formatPrice((item.price !== undefined ? item.price : getDiscountedPrice(item.product)) * item.quantity, currentCurrency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary (Only visible if cart has items) */}
            {cartItemsWithDetails.length > 0 && (
              <div className="p-6 border-t border-luxury-text/10 bg-luxury-bg/30 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-luxury-muted tracking-wider">Subtotal</span>
                  <span className="text-luxury-text font-bold text-lg">{formatPrice(subtotal, currentCurrency)}</span>
                </div>
                
                <p className="text-luxury-muted text-[10px] leading-relaxed">
                  Shipping, taxes, and discounts calculated at checkout. Khroniq timepieces feature free secure priority shipping.
                </p>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full py-4 bg-luxury-red text-white text-xs font-bold tracking-widest uppercase hover:bg-red-700 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={14} />
                  </button>
                  
                  <button
                    onClick={() => { onClose(); onPageChange('cart'); }}
                    className="w-full py-3 bg-transparent border border-luxury-text/10 text-luxury-text text-xs font-semibold tracking-widest uppercase hover:bg-luxury-bg transition cursor-pointer"
                  >
                    View Shopping Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCartQty, removeFromCart, selectCurrentCurrency, formatPrice, getDiscountedPrice } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import { ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartPage({ onPageChange }) {
  const dispatch = useDispatch();
  const cart = useSelector(state => state.watch.cart);
  const products = useSelector(state => state.watch.products);
  const coupons = useSelector(state => state.watch.coupons);
  const currentUser = useSelector(state => state.watch.currentUser);
  const currentCurrency = useSelector(selectCurrentCurrency);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Assemble full item details
  const cartItemsWithDetails = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    const itemPrice = item.price !== undefined ? item.price : getDiscountedPrice(product);
    return {
      ...item,
      product,
      itemPrice
    };
  }).filter(item => item.product !== undefined);
 
  // Permanently prune stale cart entries (products that no longer exist) from Redux/localStorage,
  // not just from what's displayed — keeps cart counts (e.g. Navbar badge) accurate everywhere.
  useEffect(() => {
    if (products.length === 0) return; // don't prune before products have loaded
    const staleItems = cart.filter(item => !products.some(p => p.id === item.productId));
    staleItems.forEach(item => dispatch(removeFromCart(item.productId)));
  }, [cart, products]);

  // Compute prices
  const subtotal = cartItemsWithDetails.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
   
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    
    if (!couponInput.trim()) return;

    const matchedCoupon = coupons.find(c => c.code.toUpperCase() === couponInput.toUpperCase().trim());
    if (matchedCoupon) {
      setAppliedCoupon(matchedCoupon);
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Please try again.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const discount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const total = subtotal - discount;

  const handleCheckoutClick = () => {
    if (currentUser) {
      // Pass coupon details if any to the checkout screen
      onPageChange('checkout', { appliedCoupon });
    } else {
      alert('Please log in or register before checking out.');
      onPageChange('login', { redirect: 'checkout', appliedCoupon });
    }
  };

  if (cartItemsWithDetails.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 bg-white border border-luxury-text/10 rounded-full flex items-center justify-center mx-auto text-luxury-muted shadow-sm">
          <ShoppingBag size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-serif uppercase tracking-widest text-luxury-text">Your Bag is Empty</h1>
          <p className="text-luxury-muted text-xs leading-relaxed font-light">
            You haven\'t added any luxury timepieces to your order. Explore our catalog to choose a classic piece.
          </p>
        </div>
        <button
          onClick={() => onPageChange('shop')}
          className="px-8 py-3 bg-luxury-gold-dark text-white text-xs font-bold tracking-widest uppercase hover:bg-luxury-gold transition cursor-pointer"
        >
          Explore Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-luxury-text/10 pb-4">
        <h1 className="font-serif text-2xl font-bold uppercase tracking-widest text-luxury-text">Shopping Bag</h1>
        <p className="text-xs text-luxury-muted mt-1">Review the luxury items selected in your order before checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Cart Items Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="hidden md:grid grid-cols-12 text-[10px] font-bold text-luxury-muted tracking-widest uppercase pb-4 border-b border-luxury-text/10 px-2">
            <span className="col-span-6">Product Details</span>
            <span className="col-span-2 text-center">Price</span>
            <span className="col-span-2 text-center">Quantity</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          <div className="space-y-6">
            {cartItemsWithDetails.map((item) => (
              <div 
                key={item.productId + '-' + JSON.stringify(item.customization || {})}
                className="flex flex-col md:grid md:grid-cols-12 items-center gap-4 bg-white border border-luxury-text/10 p-4 rounded-md shadow-sm"
              >
                {/* Info (Column 6) */}
                <div className="col-span-6 flex items-center space-x-4 w-full">
                  <div 
                    onClick={() => onPageChange('product-detail', { id: item.productId })}
                    className="w-20 h-20 bg-luxury-gray/40 border border-luxury-text/5 rounded flex-shrink-0 flex items-center justify-center p-0 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={(e) => handleImageError(e)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 
                      onClick={() => onPageChange('product-detail', { id: item.productId })}
                      className="text-luxury-text text-xs sm:text-sm font-semibold hover:text-luxury-gold-dark transition cursor-pointer line-clamp-1"
                    >
                      {item.product.name}
                    </h3>
                    <p className="text-[10px] text-luxury-muted uppercase tracking-widest mt-1">Category: {item.product.category}</p>
                    {item.customization && (
                      <div className="text-[10px] text-luxury-muted space-y-0.5 mt-1 font-sans">
                        {item.customization.dialColor && <div>Dial Color: <span className="font-semibold">{item.customization.dialColor}</span></div>}
                        {item.customization.strapMaterial && <div>Strap: <span className="font-semibold">{item.customization.strapMaterial}</span></div>}
                        {item.customization.caseFinish && <div>Case: <span className="font-semibold">{item.customization.caseFinish}</span></div>}
                        {item.customization.engraving && <div className="italic">Engraving: "{item.customization.engraving}"</div>}
                      </div>
                    )}
                    <button
                      onClick={() => dispatch(removeFromCart(item.productId, item.customization))}
                      className="text-[10px] text-luxury-red hover:text-red-400 font-semibold tracking-wider uppercase mt-2 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Price (Column 2) */}
                <div className="col-span-2 text-center flex md:block justify-between w-full md:w-auto border-t md:border-t-0 border-luxury-text/10 pt-2 md:pt-0">
                  <span className="md:hidden text-[10px] text-luxury-muted font-bold uppercase">Price</span>
                  <div className="space-y-1">
                    {item.itemPrice !== item.product.price ? (
                      <>
                        <span className="text-[10px] text-red-400 line-through block">{formatPrice(item.product.price, currentCurrency)}</span>
                        <span className="text-luxury-gold-dark text-xs font-semibold">{formatPrice(item.itemPrice, currentCurrency)}</span>
                      </>
                    ) : (
                      <span className="text-luxury-gold-dark text-xs font-semibold">{formatPrice(item.itemPrice, currentCurrency)}</span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls (Column 2) */}
                <div className="col-span-2 flex md:justify-center justify-between items-center w-full md:w-auto">
                  <span className="md:hidden text-[10px] text-luxury-muted font-bold uppercase">Quantity</span>
                  <div className="flex items-center border border-luxury-text/10 rounded bg-luxury-bg">
                    <button
                      onClick={() => dispatch(updateCartQty(item.productId, item.quantity - 1, item.customization))}
                      className="p-1 text-luxury-muted hover:text-luxury-text cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-3 text-xs font-bold text-luxury-text">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateCartQty(item.productId, item.quantity + 1, item.customization))}
                      className="p-1 text-luxury-muted hover:text-luxury-text cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Total (Column 2) */}
                <div className="col-span-2 text-right flex md:block justify-between w-full md:w-auto border-t md:border-t-0 border-luxury-text/10 pt-2 md:pt-0">
                  <span className="md:hidden text-[10px] text-luxury-muted font-bold uppercase">Total</span>
                  <span className="text-luxury-text text-xs font-bold">{formatPrice(item.itemPrice * item.quantity, currentCurrency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary & Promo Code */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Box */}
          <div className="bg-white border border-luxury-text/10 rounded-md p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold tracking-widest text-luxury-text uppercase border-b border-luxury-text/10 pb-3">Order Summary</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex justify-between text-luxury-muted">
                <span className="tracking-wide">Bag Subtotal</span>
                <span className="font-semibold text-luxury-text">{formatPrice(subtotal, currentCurrency)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <div className="flex items-center space-x-1.5">
                    <Tag size={12} />
                    <span>Coupon ({appliedCoupon.code} - {appliedCoupon.discountPercent}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>-{formatPrice(discount, currentCurrency)}</span>
                    <button 
                      onClick={handleRemoveCoupon} 
                      className="text-luxury-muted hover:text-luxury-text text-[10px] uppercase font-bold cursor-pointer"
                    >
                      (Remove)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-luxury-muted border-b border-luxury-text/10 pb-4">
                <span className="tracking-wide">Secure Courier Delivery</span>
                <span className="text-emerald-600 font-semibold uppercase tracking-wider">Complementary</span>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-luxury-text pt-2">
                <span className="uppercase tracking-widest text-xs">Total Order Value</span>
                <span className="text-lg font-extrabold text-luxury-gold-dark">{formatPrice(total, currentCurrency)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="w-full py-4 bg-luxury-red hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase transition flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-luxury-red/10"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} />
            </button>
          </div>



          {/* Guarantee Badging */}
          <div className="border border-luxury-text/10 bg-white p-4 rounded text-center text-luxury-muted space-y-2 shadow-sm">
            <ShieldCheck className="mx-auto text-luxury-gold-dark" size={24} />
            <h4 className="text-[10px] font-bold tracking-widest text-luxury-text uppercase">Secure Checkout Guarantee</h4>
            <p className="text-[10px] leading-relaxed">
              We secure transactions via SSL bank encryption. Each Khroniq purchase is packaged in a deluxe leather presentation box.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

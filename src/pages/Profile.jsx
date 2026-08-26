import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, cancelOrder, updateUserProfile, requestExchangeRefund } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import ProductCard from '../components/ProductCard';
import { Heart, User, Package, LogOut } from 'lucide-react';

const getStatusStepIndex = (status) => {
  switch (status) {
    case 'Pending':
    case 'Paid':
      return 0;
    case 'Processing':
      return 1;
    case 'Shipped':
      return 2;
    case 'Delivered':
    case 'Exchange/Refund Requested':
      return 3;
    default:
      return -1;
  }
};

const renderOrderTracker = (status) => {
  const stepIndex = getStatusStepIndex(status);
  
  if (status === 'Cancelled') {
    return (
      <div 
        className="py-2.5 px-3 rounded flex items-center justify-between text-[11px]"
        style={{ backgroundColor: 'rgba(225, 6, 0, 0.05)', border: '1px solid rgba(225, 6, 0, 0.15)', color: '#e10600' }}
      >
        <span className="font-bold uppercase tracking-wider">Order Status: Cancelled</span>
        <span className="text-[9px]" style={{ color: 'rgba(32, 30, 27, 0.6)' }}>Restored to inventory</span>
      </div>
    );
  }

  const steps = [
    { label: 'Confirmed', desc: 'Order Placed' },
    { label: 'Dispatched', desc: 'Preparation' },
    { label: 'Shipped', desc: 'In Transit' },
    { label: 'Delivered', desc: 'Arrived' }
  ];

  const progressPercent = stepIndex <= 0 ? 0 : (stepIndex / 3) * 100;

  return (
    <div className="py-4 border-b border-white/5 space-y-4">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(32, 30, 27, 0.6)' }}>
        <span>TRACKING PROGRESS</span>
        <span style={{ color: '#c5a880' }}>
          {status === 'Exchange/Refund Requested' ? 'DELIVERED (EXCHANGE/REFUND)' : status.toUpperCase()}
        </span>
      </div>
      <div className="relative flex items-center justify-between w-full pt-1.5 pb-2">
        {/* Progress Line */}
        <div 
          className="absolute left-8 right-8 top-[18px] h-[2px] -z-0" 
          style={{ backgroundColor: 'rgba(32, 30, 27, 0.08)' }}
        />
        {progressPercent > 0 && (
          <div 
            className="absolute left-8 top-[18px] h-[2px] transition-all duration-500 -z-0" 
            style={{ 
              backgroundColor: '#c5a880', 
              width: `calc(${progressPercent}% - 32px)` 
            }}
          />
        )}

        {steps.map((step, idx) => {
          const isCompleted = idx < stepIndex;
          const isActive = idx === stepIndex;
          
          let circleStyle = {
            backgroundColor: '#ffffff',
            color: 'rgba(32, 30, 27, 0.4)',
            borderColor: 'rgba(32, 30, 27, 0.15)'
          };
          if (isCompleted) {
            circleStyle = {
              backgroundColor: '#c5a880',
              color: '#ffffff',
              borderColor: '#c5a880'
            };
          } else if (isActive) {
            circleStyle = {
              backgroundColor: '#ffffff',
              color: '#c5a880',
              borderColor: '#c5a880',
              boxShadow: '0 0 10px rgba(197, 168, 128, 0.4)'
            };
          }

          let labelColor = 'rgba(32, 30, 27, 0.4)';
          if (isActive) labelColor = '#93744d';
          else if (isCompleted) labelColor = '#201e1b';

          return (
            <div key={idx} className="flex flex-col items-center flex-1 text-center relative z-10">
              {/* Step indicator circle */}
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all duration-300 border"
                style={circleStyle}
              >
                {idx + 1}
              </div>
              {/* Step Labels */}
              <span 
                className="text-[9px] font-bold uppercase tracking-wider mt-1.5 block"
                style={{ color: labelColor }}
              >
                {step.label}
              </span>
              <span 
                className="text-[8px] font-light block mt-0.5"
                style={{ color: 'rgba(32, 30, 27, 0.5)' }}
              >
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Profile({ params, onPageChange }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.watch.currentUser);
  const orders = useSelector(state => state.watch.orders);
  const wishlist = useSelector(state => state.watch.wishlist);
  const products = useSelector(state => state.watch.products);

  // Tab State
  const [activeTab, setActiveTab] = useState(params?.tab || 'orders');
  
  // Settings Form States
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const profileEmail = currentUser?.email || '';
  const [streetAddress, setStreetAddress] = useState(currentUser?.shippingAddress?.streetAddress || '');
  const [city, setCity] = useState(currentUser?.shippingAddress?.city || '');
  const [stateVal, setStateVal] = useState(currentUser?.shippingAddress?.state || '');
  const [postalCode, setPostalCode] = useState(currentUser?.shippingAddress?.postalCode || '');
  const [country, setCountry] = useState(currentUser?.shippingAddress?.country || '');
  const [phone, setPhone] = useState(currentUser?.shippingAddress?.phone || '');
  useEffect(() => {
    document.title = 'Client Profile | KHRONIQ';
  }, []);

  // Sync tab and user profile updates
  useEffect(() => {
    if (params?.tab) {
      setActiveTab(params.tab);
    }
  }, [params]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setStreetAddress(currentUser.shippingAddress?.streetAddress || '');
      setCity(currentUser.shippingAddress?.city || '');
      setStateVal(currentUser.shippingAddress?.state || '');
      setPostalCode(currentUser.shippingAddress?.postalCode || '');
      setCountry(currentUser.shippingAddress?.country || '');
      setPhone(currentUser.shippingAddress?.phone || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400">Please sign in to access your profile account.</p>
        <button
          onClick={() => onPageChange('login')}
          className="px-6 py-2.5 bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold-dark transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Filter orders matching current user
  const userOrders = orders.filter(o => o.userEmail === currentUser.email);

  // Filter wishlist matching current user
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsMessage('');
    
    const shippingAddress = {
      streetAddress,
      city,
      state: stateVal,
      postalCode,
      country,
      phone
    };

    const res = await dispatch(updateUserProfile(profileName, currentUser.email, shippingAddress));
    if (res.success) {
      setSettingsMessage('Settings and shipping address saved successfully!');
    } else {
      setSettingsMessage(res.message || 'Failed to update settings.');
    }
    setTimeout(() => setSettingsMessage(''), 5000);
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm(`Are you sure you want to cancel order ${orderId}?`)) {
      const res = await dispatch(cancelOrder(orderId));
      if (res && res.success) {
        alert('Order cancelled and stock restored successfully.');
      } else {
        alert(res?.message || 'Failed to cancel order.');
      }
    }
  };

  const handleExchangeRefund = async (orderId) => {
    if (window.confirm(`Are you sure you want to request an Exchange/Refund for order ${orderId}?`)) {
      const res = await dispatch(requestExchangeRefund(orderId));
      if (res && res.success) {
        alert('Your Exchange/Refund request has been submitted successfully.');
      } else {
        alert(res?.message || 'Failed to submit Exchange/Refund request.');
      }
    }
  };

  const handleExchangeRefundClick = (order) => {
    if (order.status !== 'Delivered') {
      alert('Exchange/Refund requests can only be made after the order has been delivered.');
      return;
    }
    handleExchangeRefund(order.id);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    onPageChange('home');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Profile Header Banner */}
      <div className="bg-luxury-gray border border-white/5 p-6 sm:p-8 rounded-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-luxury-dark rounded-full border border-luxury-gold/50 flex items-center justify-center text-luxury-gold text-xl font-bold">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">{currentUser.name}</h1>
            <p className="text-xs text-gray-400 font-light mt-0.5">{currentUser.email}</p>
            {currentUser.role === 'admin' && (
              <span className="inline-block bg-luxury-red text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase mt-1">
                ADMIN ACCESS
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onPageChange('admin')}
              className="px-5 py-2.5 bg-luxury-gold text-luxury-dark text-xs font-bold tracking-widest uppercase hover:bg-luxury-gold-dark transition cursor-pointer"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-transparent border border-white/10 text-gray-300 hover:text-luxury-red hover:border-luxury-red/40 text-xs font-bold tracking-widest uppercase transition flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-3">
          <div className="flex lg:flex-col border lg:border-0 border-white/5 rounded overflow-hidden text-xs text-gray-400">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 lg:flex-none text-left py-3.5 px-4 font-bold tracking-wider uppercase cursor-pointer border-r lg:border-r-0 lg:border-b border-black/10 transition flex items-center space-x-2 ${
                activeTab === 'orders' ? 'bg-red-50 text-gray-900 border-l-2 border-l-red-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Package size={14} />
              <span>My Orders ({userOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 lg:flex-none text-left py-3.5 px-4 font-bold tracking-wider uppercase cursor-pointer border-r lg:border-r-0 lg:border-b border-black/10 transition flex items-center space-x-2 ${
                activeTab === 'wishlist' ? 'bg-red-50 text-gray-900 border-l-2 border-l-red-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Heart size={14} />
              <span>Wishlist ({wishlistedProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 lg:flex-none text-left py-3.5 px-4 font-bold tracking-wider uppercase cursor-pointer transition flex items-center space-x-2 ${
                activeTab === 'settings' ? 'bg-red-50 text-gray-900 border-l-2 border-l-red-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <User size={14} />
              <span>Account Settings</span>
            </button>
          </div>
        </aside>

        {/* Details Panel */}
        <div className="lg:col-span-9 bg-luxury-gray/20 border border-white/5 rounded-md p-6 sm:p-8 min-h-[300px]">
          
          {/* Tab 1: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">Purchase History</h2>
              
              {userOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-4">
                  <p className="text-xs">No orders recorded under this account.</p>
                  <button
                    onClick={() => onPageChange('shop')}
                    className="px-6 py-2.5 bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold-dark transition"
                  >
                    Browse Timepieces
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {userOrders.map((order) => (
                    <div key={order.id} className="bg-luxury-gray border border-white/5 rounded p-5 space-y-4">
                      
                      {/* Order info header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 text-xs">
                        <div>
                          <p className="font-bold text-white uppercase tracking-wider font-mono">ORDER REF: {order.id}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">Placed on {order.date} at {order.time}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Status Badge */}
                          <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            order.status === 'Delivered' 
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : order.status === 'Cancelled'
                              ? 'border-red-500 bg-red-500/10 text-red-400'
                              : order.status === 'Shipped'
                              ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                              : order.status === 'Exchange/Refund Requested'
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                              : 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {order.status}
                          </span>

                          {/* Cancellation Button (Before Dispatch: Pending only) */}
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-[9px] text-luxury-red hover:text-red-400 font-bold uppercase border border-luxury-red/20 hover:border-luxury-red/50 px-2 py-1 rounded transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Exchange/Refund Button (Available after payment) */}
                          {(order.status === 'Paid' || order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') && (
                            <button
                              onClick={() => handleExchangeRefundClick(order)}
                              className="text-[9px] text-purple-400 hover:text-purple-300 font-bold uppercase border border-purple-500/20 hover:border-purple-500/50 px-2 py-1 rounded transition cursor-pointer bg-purple-500/5"
                            >
                              Exchange / Refund
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delivery Status Tracker Progress Stepper */}
                      {renderOrderTracker(order.status)}

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-luxury-dark rounded border border-white/5 flex items-center justify-center p-1">
                                <img src={item.image} alt={item.name} onError={(e) => handleImageError(e)} className="max-h-full max-w-full object-contain" />
                              </div>
                              <span className="line-clamp-1">{item.name} (×{item.quantity})</span>
                            </div>
                            <span className="font-semibold text-white">${(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals footer */}
                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs text-gray-400">
                        <p><span className="font-semibold text-white">Courier:</span> Free Secure priority courier</p>
                        <p className="font-bold text-white">Total Charge: <span className="text-luxury-gold">${order.total.toLocaleString()}</span></p>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">My Saved Pieces</h2>
              
              {wishlistedProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-4">
                  <p className="text-xs">Your wishlist is currently empty.</p>
                  <button
                    onClick={() => onPageChange('shop')}
                    className="px-6 py-2.5 bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold-dark transition"
                  >
                    Add Items
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wishlistedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPageChange={onPageChange}
                      showRemove={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">Account Details</h2>
              
              {settingsMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                  {settingsMessage}
                </div>
              )}

              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled
                    value={profileEmail}
                    className="w-full bg-luxury-dark/50 border border-white/10 rounded text-gray-500 text-xs p-3 cursor-not-allowed focus:outline-none"
                  />
                  <span className="text-[9px] text-gray-500 block">Contact support to modify email bindings.</span>
                </div>

                <h2 className="text-sm font-bold uppercase tracking-widest text-white border-b border-white/5 pt-6 pb-3">Default Shipping Address</h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Street Address</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Local Address"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-black font-bold uppercase tracking-widest block">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Geneva"
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-black font-bold uppercase tracking-widest block">State / Region</label>
                    <input
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      placeholder="Geneva"
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="400001"
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-white hover:bg-luxury-gold text-luxury-dark font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer"
                >
                  Save Settings
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

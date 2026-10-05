import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, cancelOrder, updateUserProfile, requestExchangeRefund, setShippingCountryAction, forgotPassword, changePassword } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import ProductCard from '../components/ProductCard';
import { Heart, User, Package, LogOut, KeyRound, ShieldCheck, Eye, EyeOff, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { isAdminRole, isSuperAdminRole } from '../constants/permissions';
import PhoneInput from '../components/PhoneInput';
import { useSEO } from '../utils/seo';
import { showToast } from '../utils/toast';



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
  const [country, setCountry] = useState(
    currentUser?.shippingAddress?.country ||
    (typeof window !== 'undefined' ? localStorage.getItem('khroniq_shipping_country') : '') ||
    'India'
  );
  const [phone, setPhone] = useState(currentUser?.shippingAddress?.phone || '');
  const [settingsMessage, setSettingsMessage] = useState('');

  // Forgot / Reset Password & Direct Password Update states
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassSuccess, setChangePassSuccess] = useState('');
  const [changePassError, setChangePassError] = useState('');

  // 60-second cooldown timer for password reset link requests
  useEffect(() => {
    let timer;
    if (forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const handleSendForgotLink = async () => {
    if (!currentUser?.email) return;
    if (forgotCooldown > 0 || forgotLoading) return;

    setForgotLoading(true);
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    try {
      const res = await dispatch(forgotPassword(currentUser.email));
      if (res && res.success) {
        setForgotSuccessMsg(`A secure password reset link has been dispatched to ${currentUser.email}. Please check your inbox or spam folder.`);
        setForgotCooldown(60);
        showToast(`Reset link dispatched to ${currentUser.email}`, 'success');
      } else {
        setForgotErrorMsg(res?.message || 'Failed to dispatch reset link. Please try again.');
        showToast(res?.message || 'Failed to send reset link.', 'error');
      }
    } catch (err) {
      setForgotErrorMsg('Something went wrong. Please try again later.');
      showToast('Failed to send reset link.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e?.preventDefault?.();
    setChangePassError('');
    setChangePassSuccess('');

    if (!currentPassword) {
      setChangePassError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setChangePassError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setChangePassError('New password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setChangePassError('New password must contain at least one lowercase letter.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>-_]/.test(newPassword)) {
      setChangePassError('New password must contain at least one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError('New passwords do not match.');
      return;
    }

    setChangePassLoading(true);
    try {
      const res = await dispatch(changePassword(currentPassword, newPassword));
      if (res && res.success) {
        setChangePassSuccess('Password updated successfully!');
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setChangePassSuccess(''), 5000);
      } else {
        setChangePassError(res?.message || 'Failed to update password.');
        showToast(res?.message || 'Failed to update password.', 'error');
      }
    } catch (err) {
      setChangePassError('Something went wrong updating password.');
      showToast('Error updating password.', 'error');
    } finally {
      setChangePassLoading(false);
    }
  };
  useSEO({
    title: 'Client Profile & Orders | KHRONIQ',
    description: 'Manage your KHRONIQ client profile, order history, and personal preferences.',
    canonicalUrl: 'https://www.khroniq.com/profile',
    robots: 'noindex, nofollow'
  });


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
      setCountry(
        currentUser.shippingAddress?.country ||
        (typeof window !== 'undefined' ? localStorage.getItem('khroniq_shipping_country') : '') ||
        'India'
      );
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

    if (country) {
      dispatch(setShippingCountryAction(country));
      try {
        localStorage.setItem('khroniq_shipping_country', country);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('khroniq_shipping_country_changed', { detail: country }));
      } catch {}
    }

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
        showToast('Order cancelled and stock restored successfully.', 'success');
      } else {
        showToast(res?.message || 'Failed to cancel order.', 'error');
      }
    }
  };

  const handleExchangeRefund = async (orderId) => {
    if (window.confirm(`Are you sure you want to request an Exchange/Refund for order ${orderId}?`)) {
      const res = await dispatch(requestExchangeRefund(orderId));
      if (res && res.success) {
        showToast('Your Exchange/Refund request has been submitted successfully.', 'success');
      } else {
        showToast(res?.message || 'Failed to submit Exchange/Refund request.', 'error');
      }
    }
  };

  const handleExchangeRefundClick = (order) => {
    if (order.status !== 'Delivered') {
      showToast('Exchange/Refund requests can only be made after the order has been delivered.', 'info');
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
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">{currentUser.name}</h1>
          <p className="text-xs text-gray-400 font-light mt-0.5">{currentUser.email}</p>
          {isAdminRole(currentUser.role) && (
            <span className={`inline-block ${isSuperAdminRole(currentUser.role) ? 'bg-luxury-gold text-black' : 'bg-luxury-red text-white'} text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase mt-1`}>
              {isSuperAdminRole(currentUser.role) ? 'SUPER ADMIN ACCESS' : 'ADMIN ACCESS'}
            </span>
          )}
        </div>

        <div className="flex space-x-3">
          {isAdminRole(currentUser.role) && (
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

                {/* Account Security & Forgot / Reset Password Section */}
                <div className="pt-6 border-t border-black/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-black">Account Security &amp; Password</h2>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Reset your forgotten password or update your login credentials.</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-neutral-700">
                      <ShieldCheck size={16} />
                    </div>
                  </div>

                  {/* Forgot Password Action Card */}
                  <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-md space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <KeyRound size={15} className="text-[#93744d]" />
                          <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Forgot Password?</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Send a secure password reset link to <strong className="text-neutral-900 font-semibold">{currentUser?.email}</strong>.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendForgotLink}
                        disabled={forgotLoading || forgotCooldown > 0}
                        className={`px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                          forgotCooldown > 0
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : forgotCooldown > 0 ? (
                          <>
                            <Mail size={13} />
                            <span>Resend in {forgotCooldown}s</span>
                          </>
                        ) : (
                          <>
                            <Mail size={13} />
                            <span>Send Reset Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Forgot Password Alerts */}
                    {forgotSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded flex items-start gap-2 animate-in fade-in">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p>{forgotSuccessMsg}</p>
                      </div>
                    )}
                    {forgotErrorMsg && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded flex items-start gap-2 animate-in fade-in">
                        <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                        <p>{forgotErrorMsg}</p>
                      </div>
                    )}
                  </div>

                  {/* Option to change password directly */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(!showChangePassword);
                        setChangePassError('');
                        setChangePassSuccess('');
                      }}
                      className="text-xs font-bold tracking-wider uppercase text-neutral-800 hover:text-black flex items-center gap-1.5 cursor-pointer underline decoration-dotted underline-offset-4"
                    >
                      <KeyRound size={13} />
                      <span>{showChangePassword ? 'Hide Direct Password Update' : 'Know your current password? Update it here directly'}</span>
                    </button>

                    {showChangePassword && (
                      <div className="mt-3 p-4 bg-white border border-neutral-200 rounded-md space-y-4 animate-in fade-in shadow-sm">
                        {changePassSuccess && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            <span>{changePassSuccess}</span>
                          </div>
                        )}
                        {changePassError && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-600 shrink-0" />
                            <span>{changePassError}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Current Password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter your current password"
                              className="w-full bg-luxury-dark border border-white/10 rounded text-xs p-3 pr-10 focus:outline-none focus:border-luxury-gold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
                            >
                              {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-black font-bold uppercase tracking-widest block">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPass ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="w-full bg-luxury-dark border border-white/10 rounded text-xs p-3 pr-10 focus:outline-none focus:border-luxury-gold"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
                              >
                                {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Confirm New Password</label>
                            <div className="relative">
                              <input
                                type={showConfirmPass ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full bg-luxury-dark border border-white/10 rounded text-xs p-3 pr-10 focus:outline-none focus:border-luxury-gold"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
                              >
                                {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-neutral-100">
                          <span className="text-[10px] text-neutral-500">
                            Must contain at least 8 chars, 1 uppercase, 1 lowercase &amp; 1 symbol.
                          </span>
                          <button
                            type="button"
                            onClick={handleChangePasswordSubmit}
                            disabled={changePassLoading}
                            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            {changePassLoading ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <span>Update Password</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                      placeholder="Mumbai"
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-black font-bold uppercase tracking-widest block">State / Region</label>
                    <input
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      placeholder="Maharashtra"
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
                  <PhoneInput
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    country={country || 'India'}
                    placeholder="98765 43210"
                    theme="light"
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

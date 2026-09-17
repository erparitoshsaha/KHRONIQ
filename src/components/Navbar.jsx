import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, setCurrencyAction, selectCurrentCurrency } from '../store/slices/watchSlice';
import {
  ShoppingBag, Search, Menu, X, User, Heart, Star, Sparkles, Tag, ShieldAlert,
  ArrowRight, Shield, RefreshCw, Truck, Check, Trash2, Clock, CheckCircle2, ChevronRight, XCircle
} from 'lucide-react';
import { isAdminRole, isSuperAdminRole } from '../constants/permissions';


export default function Navbar({ onCartOpen, onPageChange, currentPage }) {
  const dispatch = useDispatch();
  const cart = useSelector(state => state.watch.cart);
  const wishlist = useSelector(state => state.watch.wishlist);
  const currentUser = useSelector(state => state.watch.currentUser);

  const handleLogout = () => {
    dispatch(logoutUser());
    setMobileMenuOpen(false);
    onPageChange('home');
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 80;
    }
    return false;
  });
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState('recipient');
  const [megaMenuForceClosed, setMegaMenuForceClosed] = useState(false);

  const currencyMap = {
    INR: { symbol: '₹', label: 'Indian Currency (Rupees)' },
    USD: { symbol: '$', label: 'US Currency (Dollar)' },
    EUR: { symbol: '€', label: 'British Currency (Euro)' }
  };

  // Synchronize navbar visibility and scrolled state on mount and route change
  useEffect(() => {
    const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    lastScrollYRef.current = currentScrollY;
    setVisible(true);
    setScrolled(currentScrollY > 80);
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Track scrolling for background transparency on homepage (threshold 80px)
      if (currentScrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Hide header on scroll down, show on scroll up
      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > lastScrollYRef.current) {
        setVisible(false); // Scrolling down
      } else {
        setVisible(true); // Scrolling up
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onPageChange('shop', { search: searchQuery });
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'HOME', page: 'home' },
    { label: 'MEN', page: 'shop', filter: { gender: 'men' } },
    { label: 'WOMEN', page: 'shop', filter: { gender: 'women' } },
    { label: 'SHOP ALL', page: 'shop', filter: { shopAll: true } },
    { label: 'CUSTOMIZE', page: 'customization' },
    { label: '🎁 GIFTING', page: 'gifting', megaMenu: true },
  ];

  const handleNavLinkClick = (link) => {
    if (link.filter) {
      localStorage.setItem('khroniq_is_gifting_journey', 'false');
      onPageChange('shop', link.filter);
    } else if (link.page === 'customization') {
      localStorage.setItem('khroniq_is_gifting_journey', 'false');
      onPageChange('customization', { reset: Date.now() });
    } else {
      if (link.page === 'gifting') {
        localStorage.setItem('khroniq_is_gifting_journey', 'true');
      } else {
        localStorage.setItem('khroniq_is_gifting_journey', 'false');
      }
      onPageChange(link.page);
    }
    setMobileMenuOpen(false);
  };

  const isHome = currentPage === 'home';
  const headerClass = `${isHome ? 'fixed' : 'sticky'
    } top-0 left-0 right-0 z-50 transition-[transform,background-color,box-shadow] duration-300 isolate transform ${visible ? 'translate-y-0' : 'translate-y-0 md:-translate-y-full'
    } ${isHome
      ? (scrolled ? 'bg-black/95 backdrop-blur-md shadow-md' : 'bg-transparent')
      : 'bg-[#111111] shadow-md'
    }`;

  const textColorClass = "text-white/80 hover:text-white";

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-20">

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-luxury-gold focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Left Navigation: Brand Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-5 text-[11px] lg:text-xs font-black tracking-wider">
            {navLinks.map((link, idx) => {
              if (link.dropdown) {
                return (
                  <div key={idx} className="relative group py-2">
                    <button
                      onClick={() => handleNavLinkClick(link)}
                      className={`whitespace-nowrap transition duration-200 cursor-pointer uppercase font-black tracking-wider ${textColorClass} ${currentPage === link.page ? 'text-luxury-gold' : ''
                        }`}
                    >
                      {link.label}
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-[#111111] border border-white/10 rounded shadow-xl py-2 hidden group-hover:block transition duration-200 z-50 text-left">
                      {[
                        { label: 'Our Story', view: 'about' },
                        { label: 'Contact', view: 'contact' },
                        { label: 'Client FAQ', view: 'faq' },
                        { label: 'Blogs & Editorial', view: 'blogs' },
                        { label: 'Legal Policies', view: 'policies' }
                      ].map((sub) => (
                        <button
                          key={sub.view}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPageChange('static', { view: sub.view });
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-white/10 text-gray-300 hover:text-white transition text-[11px] font-bold uppercase tracking-wider cursor-pointer block"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (link.megaMenu) {
                return (
                  <div key={idx} className="relative group h-20 flex items-center" onMouseEnter={() => setMegaMenuForceClosed(false)}>
                    <button
                      onClick={() => handleNavLinkClick(link)}
                      className={`whitespace-nowrap transition duration-200 cursor-pointer uppercase font-black tracking-wider ${textColorClass} ${currentPage === link.page ? 'text-luxury-gold' : ''
                        }`}
                    >
                      {link.label}
                    </button>

                    {/* FULL SCREEN WIDE LIGHT GLASSMORPHIC (LIQUIFIED) MEGA MENU */}
                    <div className={`fixed left-0 right-0 w-screen bg-white/40 backdrop-blur-2xl border-y border-white/20 shadow-[0_25px_50px_rgba(0,0,0,0.15)] p-0 hidden group-hover:block z-50 text-left transition-all duration-300 top-[80px] left-0 ${megaMenuForceClosed ? '!hidden' : ''}`}>
                      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-12 gap-10">
                        {/* Left Column: Category selectors */}
                        <div className="col-span-3 border-r border-neutral-200/40 pr-6 flex flex-col space-y-3">
                          <button
                            type="button"
                            onMouseEnter={() => setActiveSubMenu('price')}
                            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-between transition duration-200 ${activeSubMenu === 'price' ? 'bg-white/20 backdrop-blur-sm border border-neutral-900/20 text-black font-black scale-[1.02]' : 'text-neutral-700 hover:text-black hover:bg-neutral-900/5 border border-transparent'
                              }`}
                          >
                            <span>Shop By Price</span>
                            <span className="text-[10px]">&rarr;</span>
                          </button>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveSubMenu('recipient')}
                            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-between transition duration-200 ${activeSubMenu === 'recipient' ? 'bg-white/20 backdrop-blur-sm border border-neutral-900/20 text-black font-black scale-[1.02]' : 'text-neutral-700 hover:text-black hover:bg-neutral-900/5 border border-transparent'
                              }`}
                          >
                            <span>Watches For Recipient</span>
                            <span className="text-[10px]">&rarr;</span>
                          </button>
                        </div>

                        {/* Middle Column: Sub-menu items */}
                        <div className="col-span-5 px-6">
                          {activeSubMenu === 'price' && (
                            <div className="space-y-6">
                              <h4 className="text-[10px] font-black tracking-[0.25em] text-black uppercase">Shop By Price</h4>
                              <div className="grid grid-cols-2 gap-4">
                                {[
                                  { label: 'Under ₹50,000', maxPrice: 1000 },
                                  { label: '₹50,000 - ₹1,00,000', maxPrice: 2000 },
                                  { label: '₹1,00,000 - ₹2,00,000', maxPrice: 4500 },
                                  { label: 'Above ₹2,00,000', maxPrice: 6000 },
                                ].map((p) => (
                                  <button
                                    key={p.label}
                                    onClick={() => {
                                      localStorage.setItem('khroniq_is_gifting_journey', 'false');
                                      setMegaMenuForceClosed(true);
                                      onPageChange('shop', { maxPrice: p.maxPrice });
                                    }}
                                    className="text-left text-xs text-black hover:text-black/60 transition duration-150 font-bold uppercase tracking-wider py-1.5 cursor-pointer block border-b border-transparent hover:border-black/40 w-fit"
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeSubMenu === 'recipient' && (
                            <div className="space-y-6">
                              <h4 className="text-[10px] font-black tracking-[0.25em] text-black uppercase">Watches For Recipient</h4>
                              {/* 2 Column Recipient Layout to match screenshot */}
                              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                <div className="flex flex-col space-y-3.5">
                                  {[
                                    { label: 'Watches For Bride', filter: { gender: 'women' } },
                                    { label: 'Watches For Mother', filter: { gender: 'women' } },
                                    { label: 'Watches For Brother', filter: { gender: 'men' } },
                                  ].map((r) => (
                                    <button
                                      key={r.label}
                                      onClick={() => {
                                        localStorage.setItem('khroniq_is_gifting_journey', 'true');
                                        setMegaMenuForceClosed(true);
                                        onPageChange('shop', r.filter);
                                      }}
                                      className="text-left text-xs text-black hover:text-black/60 transition duration-150 font-bold uppercase tracking-wider py-1.5 cursor-pointer block border-b border-transparent hover:border-black/40 w-fit"
                                    >
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex flex-col space-y-3.5">
                                  {[
                                    { label: 'Watches For Groom', filter: { gender: 'men' } },
                                    { label: 'Watches For Father', filter: { gender: 'men' } },
                                    { label: 'Watches For Sister', filter: { gender: 'women' } },
                                  ].map((r) => (
                                    <button
                                      key={r.label}
                                      onClick={() => {
                                        localStorage.setItem('khroniq_is_gifting_journey', 'true');
                                        setMegaMenuForceClosed(true);
                                        onPageChange('shop', r.filter);
                                      }}
                                      className="text-left text-xs text-black hover:text-black/60 transition duration-150 font-bold uppercase tracking-wider py-1.5 cursor-pointer block border-b border-transparent hover:border-black/40 w-fit"
                                    >
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Looking for a Gift card */}
                        <div className="col-span-4 relative overflow-hidden rounded-xl bg-neutral-950 text-white flex flex-col justify-between p-6 min-h-[220px] shadow-lg group/gift">
                          <div className="absolute inset-0 bg-cover bg-center opacity-60 scale-100 group-hover/gift:scale-105 transition duration-700" style={{ backgroundImage: "url('/assets/gift_partner.jpg')" }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="relative z-10 space-y-1">
                            <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-luxury-gold">Curated Gifting</span>
                            <h4 className="font-serif text-2xl font-black tracking-wider leading-tight text-white mt-1">LOOKING<br />for<br />A GIFT?</h4>
                          </div>
                          <button
                            onClick={() => {
                              localStorage.setItem('khroniq_is_gifting_journey', 'true');
                              onPageChange('gifting');
                            }}
                            className="relative z-10 w-full py-3 bg-white text-neutral-950 font-black text-xs uppercase tracking-widest rounded-lg hover:bg-neutral-800 hover:text-white transition duration-300 shadow-md cursor-pointer"
                          >
                            Shop Gifting Solutions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleNavLinkClick(link)}
                  className={`whitespace-nowrap transition duration-200 cursor-pointer ${textColorClass} ${currentPage === link.page ? 'text-luxury-gold' : ''
                    }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Center Logo */}
          <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex-1 md:flex-none flex justify-center items-center min-w-0 px-2 z-20">
            <button
              onClick={() => {
                localStorage.setItem('khroniq_is_gifting_journey', 'false');
                onPageChange('home');
              }}
              className="flex flex-col items-center gap-0.5 sm:gap-1 transition duration-300 cursor-pointer py-1 max-w-[130px] sm:max-w-none"
            >
              <img
                src="/assets/logo_icon.png"
                alt="KHRONIQ Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain shrink-0"
              />
              <img
                src="/assets/logo_text.png"
                alt="KHRONIQ"
                className="h-3.5 sm:h-4 md:h-5 max-w-[100px] sm:max-w-[120px] md:max-w-none object-contain shrink-0"
              />
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4 md:space-x-5 text-white">
            {/* Search Icon / Bar (Desktop Only) */}
            <div className="hidden md:flex relative items-center">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search watches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 sm:w-48 bg-luxury-bg text-luxury-text text-xs px-3 py-1.5 rounded-l-md border border-luxury-text/10 focus:outline-none focus:border-luxury-gold-dark"
                    autoFocus
                  />
                  <button type="submit" className="bg-black text-white px-2.5 py-1.5 rounded-r-md border border-black hover:bg-neutral-700 transition cursor-pointer">
                    <Search size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="ml-2 text-white/60 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="transition cursor-pointer hover:text-luxury-gold"
                  title="Search"
                >
                  <Search size={24} />
                </button>
              )}
            </div>

            {/* Profile / Admin Icon (Desktop Only) */}
            <div className="hidden md:flex items-center">
              {currentUser ? (
                <div className="flex items-center space-x-3 text-[11px] font-bold uppercase tracking-widest">
                  <button
                    onClick={() => onPageChange(isAdminRole(currentUser.role) ? 'admin' : 'profile')}
                    className="flex items-center space-x-1.5 transition cursor-pointer text-white/90 hover:text-[#dfb76c]"
                    title={isSuperAdminRole(currentUser.role) ? 'Super Admin Dashboard' : isAdminRole(currentUser.role) ? 'Admin Dashboard' : 'My Account'}
                  >
                    {isAdminRole(currentUser.role) ? (
                      <ShieldAlert size={14} className={isSuperAdminRole(currentUser.role) ? "text-luxury-gold" : "text-luxury-red"} />
                    ) : (
                      <User size={14} />
                    )}
                    <span className="max-w-24 truncate font-bold">
                      {currentUser.name}
                    </span>
                  </button>
                  <span className="text-white/20 font-light">|</span>
                  <button
                    onClick={handleLogout}
                    className="transition cursor-pointer text-white/60 hover:text-luxury-red"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-[11px] font-bold uppercase tracking-widest">
                  <button
                    onClick={() => onPageChange('login')}
                    className="transition cursor-pointer text-white/90 hover:text-[#dfb76c]"
                    title="Sign In"
                  >
                    Sign In
                  </button>
                  <span className="text-white/20 font-light">|</span>
                  <button
                    onClick={() => onPageChange('login')}
                    className="transition cursor-pointer text-white/60 hover:text-[#dfb76c]"
                    title="Register"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist Icon (Desktop Only) */}
            <button
              onClick={() => onPageChange(currentUser ? 'profile' : 'login', currentUser ? { tab: 'wishlist' } : null)}
              className="hidden md:block relative transition cursor-pointer hover:text-luxury-gold"
              title="Wishlist"
            >
              <Heart size={24} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-luxury-gold-dark text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Currency Selector Dropdown (Desktop Only) */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 hover:border-luxury-gold hover:text-luxury-gold transition cursor-pointer text-lg font-black"
                title="Select Currency"
              >
                {currencyMap[currentCurrency]?.symbol || '$'}
              </button>
              {currencyOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-[#111111] border border-white/10 rounded shadow-xl py-2 z-50 text-xs text-white font-bold">
                  {Object.entries(currencyMap).map(([code, details]) => (
                    <button
                      key={code}
                      onClick={() => {
                        dispatch(setCurrencyAction(code));
                        setCurrencyOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-white/15 transition cursor-pointer flex justify-between items-center ${currentCurrency === code ? 'text-luxury-gold' : ''
                        }`}
                    >
                      <span>{details.label}</span>
                      {currentCurrency === code && <span className="text-luxury-gold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Icon (Always Visible) */}
            <button
              onClick={onCartOpen}
              className="relative transition cursor-pointer hover:text-luxury-gold"
              title="Shopping Cart"
            >
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-luxury-red text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-luxury-text/10 py-4 px-6 space-y-4 flex flex-col">
          {/* Search bar inside mobile drawer */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-luxury-text/10 rounded-md p-1.5 mb-2">
            <input
              type="text"
              placeholder="Search watches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-luxury-text text-xs px-2 focus:outline-none"
            />
            <button type="submit" className="text-luxury-muted hover:text-black p-1">
              <Search size={14} />
            </button>
          </form>

          {/* Navigation links */}
          {navLinks.map((link, idx) => {
            if (link.dropdown) {
              return (
                <div key={idx} className="flex flex-col space-y-1 py-1">
                  <span className="text-left text-xs text-luxury-gold-dark font-extrabold tracking-widest block uppercase pt-2 pb-1 border-b border-white/5">
                    {link.label}
                  </span>
                  {[
                    { label: 'Our Story', view: 'about' },
                    { label: 'Contact', view: 'contact' },
                    { label: 'Client FAQ', view: 'faq' },
                    { label: 'Blogs & Editorial', view: 'blogs' },
                    { label: 'Legal Policies', view: 'policies' }
                  ].map((sub) => (
                    <button
                      key={sub.view}
                      onClick={() => {
                        onPageChange('static', { view: sub.view });
                        setMobileMenuOpen(false);
                      }}
                      className="text-left text-[11px] text-gray-400 hover:text-white transition pl-3 py-1.5 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleNavLinkClick(link)}
                className="text-left text-sm text-luxury-text hover:text-luxury-gold-dark transition py-2 font-medium tracking-widest cursor-pointer"
              >
                {link.label}
              </button>
            );
          })}

          {/* Profile & Account options */}
          <div className="pt-2 border-t border-luxury-text/5 flex flex-col space-y-3">
            {currentUser ? (
              <button
                onClick={() => {
                  onPageChange(isAdminRole(currentUser.role) ? 'admin' : 'profile');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm text-luxury-text font-bold uppercase tracking-wider flex items-center space-x-2"
              >
                <User size={16} />
                <span>{isSuperAdminRole(currentUser.role) ? 'Super Admin Portal' : isAdminRole(currentUser.role) ? 'Admin Portal' : 'My Account'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onPageChange('login');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm text-luxury-text font-bold uppercase tracking-wider flex items-center space-x-2"
              >
                <User size={16} />
                <span>Login / Register</span>
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={() => {
                onPageChange(currentUser ? 'profile' : 'login', currentUser ? { tab: 'wishlist' } : null);
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm text-luxury-text font-bold uppercase tracking-wider flex items-center space-x-2"
            >
              <Heart size={16} />
              <span>Wishlist ({wishlist.length})</span>
            </button>

            {/* Currency Selector inside mobile drawer */}
            <div className="py-2">
              <p className="text-[10px] text-luxury-muted uppercase font-bold tracking-wider mb-1.5">Select Currency</p>
              <div className="flex space-x-2">
                {Object.entries(currencyMap).map(([code, details]) => (
                  <button
                    key={code}
                    onClick={() => {
                      dispatch(setCurrencyAction(code));
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded border text-xs font-semibold ${currentCurrency === code
                        ? 'border-black bg-black/5 text-black'
                        : 'border-luxury-text/10 text-luxury-text'
                      }`}
                  >
                    {details.symbol} {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentUser && (
            <button
              onClick={handleLogout}
              className="text-left text-sm text-luxury-red hover:text-red-400 transition py-2 font-medium tracking-widest cursor-pointer border-t border-luxury-text/5 pt-3"
            >
              LOGOUT
            </button>
          )}
        </div>
      )}
    </header>
  );
}

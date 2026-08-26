import { createSlice } from '@reduxjs/toolkit';

// Helper to safe-parse localStorage items
const loadSaved = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const getMockProducts = () => [
  {
    id: 'mock-1',
    _id: 'mock-1',
    name: 'Khroniq Heritage Rose Gold',
    image: '/assets/media__1782899491225.jpg',
    brand: 'KHRONIQ',
    price: 1250,
    stock: 8,
    category: 'Heritage',
    gender: 'women',
    description: "A luxurious timeless classic watch featuring a stunning rose gold casing and index numerals, matching its premium metallic link bracelet. A tribute to Khroniq's heritage.",
    specs: {
      movement: 'Automatic Chronometer',
      case: 'Rose Gold PVD Steel (40mm)',
      strap: 'Rose Gold Stainless Steel Bracelet',
      waterResistance: '50m (5 ATM)',
      glass: 'Scratch-resistant Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: [
      { id: 'rev-1', userName: 'John Doe', rating: 5, comment: 'Exquisite design, feels very premium and heavy. Highly recommend!', date: '2026-06-15', status: 'approved' },
      { id: 'rev-2', userName: 'Alice Smith', rating: 4, comment: 'Elegant dial, but the bracelet needed adjustment. Overall beautiful watch.', date: '2026-06-20', status: 'approved' }
    ]
  },
  {
    id: 'mock-2',
    _id: 'mock-2',
    name: 'Khroniq Khronomaster Black Edition',
    image: '/assets/media__1782899491297.jpg',
    brand: 'KHRONIQ',
    price: 4800,
    stock: 5,
    category: 'Khronomaster',
    gender: 'men',
    description: 'High-precision luxury chronograph watch in matte black design with silver sub-dials and detailed tachymeter scale. Equipped with the legendary El Primero movement DNA.',
    specs: {
      movement: 'El Primero Chronograph (36,000 vph)',
      case: 'Matte Black Ceramic (42mm)',
      strap: 'Black Rubberized Steel Link',
      waterResistance: '100m (10 ATM)',
      glass: 'Double Anti-reflective Sapphire'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: [
      { id: 'rev-3', userName: 'Marc V.', rating: 5, comment: 'The El Primero movement is flawless. The black ceramic case is scratchproof!', date: '2026-05-10', status: 'approved' }
    ]
  },
  {
    id: 'mock-3',
    _id: 'mock-3',
    name: 'Khroniq Elite Classic Brown',
    image: '/assets/media__1782899491320.jpg',
    brand: 'KHRONIQ',
    price: 2100,
    stock: 12,
    category: 'Elite',
    gender: 'unisex',
    description: 'An ultra-minimalist timepiece featuring an elegant cream white dial, gold baton markers, and a premium textured brown leather strap. Perfect for formal dress occasions.',
    specs: {
      movement: 'Elite Ultra-Thin Automatic',
      case: '18K Yellow Gold (39mm)',
      strap: 'Brown Alligator Leather',
      waterResistance: '30m (3 ATM)',
      glass: 'Dome Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: [
      { id: 'rev-4', userName: 'David K.', rating: 4, comment: 'Classic dress watch. Super thin and fits under any cuff.', date: '2026-06-01', status: 'approved' }
    ]
  },
  {
    id: 'mock-4',
    _id: 'mock-4',
    name: 'Khroniq Defy Automatic Steel',
    image: '/assets/media__1782899491366.jpg',
    brand: 'KHRONIQ',
    price: 3450,
    stock: 4,
    category: 'Defy',
    gender: 'men',
    description: 'A robust, sporty luxury watch with a brushed stainless steel case, textured black dial, day-date automatic calendar, and deep brown premium leather strap overlay.',
    specs: {
      movement: 'Automatic Calendar Caliber',
      case: 'Brushed Stainless Steel (41mm)',
      strap: 'Brown Leather with Rubber Backing',
      waterResistance: '100m (10 ATM)',
      glass: 'Scratch-resistant Sapphire'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: [
      { id: 'rev-5', userName: 'Sarah L.', rating: 5, comment: 'Sturdy yet elegant. Ideal everyday luxury watch.', date: '2026-06-25', status: 'approved' }
    ]
  },
  {
    id: 'mock-5',
    _id: 'mock-5',
    name: 'Khroniq Khronomaster Open Heart',
    image: '/assets/media__1782899491297.jpg',
    brand: 'KHRONIQ',
    price: 5200,
    stock: 6,
    category: 'Khronomaster',
    gender: 'men',
    description: 'An exquisite luxury timepiece featuring a dial opening revealing the high-frequency El Primero balance wheel. Crafted with a polished steel case.',
    specs: {
      movement: 'El Primero Automatic Chronograph',
      case: 'Polished Steel (42mm)',
      strap: 'Alligator Leather Strap',
      waterResistance: '100m (10 ATM)',
      glass: 'Domed Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  },
  {
    id: 'mock-6',
    _id: 'mock-6',
    name: 'Khroniq Heritage Star Dial',
    image: '/assets/media__1782899491225.jpg',
    brand: 'KHRONIQ',
    price: 3100,
    stock: 4,
    category: 'Heritage',
    gender: 'women',
    description: 'A dazzling feminine watch with a diamond-studded bezel and a guilloche mother-of-pearl dial. Elegant and graceful.',
    specs: {
      movement: 'Elite Automatic Caliber',
      case: 'Steel with Diamond Bezel (37mm)',
      strap: 'White Satin Strap',
      waterResistance: '30m (3 ATM)',
      glass: 'Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  },
  {
    id: 'mock-7',
    _id: 'mock-7',
    name: 'Khroniq Elite Moonphase',
    image: '/assets/media__1782899491320.jpg',
    brand: 'KHRONIQ',
    price: 2650,
    stock: 7,
    category: 'Elite',
    gender: 'unisex',
    description: 'A sophisticated dress watch displaying the moon phases at 6 o\'clock. Featuring a clean silver sunray dial and gold markers.',
    specs: {
      movement: 'Elite Moonphase Automatic',
      case: 'Yellow Gold PVD (40mm)',
      strap: 'Black Leather Strap',
      waterResistance: '50m (5 ATM)',
      glass: 'Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  },
  {
    id: 'mock-8',
    _id: 'mock-8',
    name: 'Khroniq Defy Skyline Skeleton',
    image: '/assets/media__1782899491366.jpg',
    brand: 'KHRONIQ',
    price: 4100,
    stock: 5,
    category: 'Defy',
    gender: 'men',
    description: 'A modern architectural masterpiece featuring an openworked black skeleton dial inside a sharp octagonal steel case.',
    specs: {
      movement: 'El Primero High-Frequency Automatic',
      case: 'Brushed Steel Octagonal (41mm)',
      strap: 'Black Rubber Strap',
      waterResistance: '100m (10 ATM)',
      glass: 'Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  },
  {
    id: 'mock-9',
    _id: 'mock-9',
    name: 'Khroniq Crescent Brown',
    image: '/assets/crescent_product.png',
    brand: 'KHRONIQ',
    price: 3200,
    stock: 6,
    category: 'Heritage',
    gender: 'men',
    description: 'An elite timekeeping masterpiece featuring a warm rose gold case, intricate multi-dial chronograph display, and a textured brown leather strap. Blending classic styling with robust mechanics.',
    specs: {
      movement: 'Automatic Chronograph',
      case: 'Rose Gold Steel (42mm)',
      strap: 'Brown Alligator Leather',
      waterResistance: '100m (10 ATM)',
      glass: 'Scratch-Resistant Sapphire'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  },
  {
    id: 'mock-10',
    _id: 'mock-10',
    name: 'Khroniq Gentleman Blue',
    image: '/assets/gentleman_product.png',
    brand: 'KHRONIQ',
    price: 4100,
    stock: 7,
    category: 'Defy',
    gender: 'men',
    description: 'A high-end skeleton watch displaying mechanical gears inside a polished steel case, matched with a luxurious deep blue textured leather strap. A perfect statement of engineering art.',
    specs: {
      movement: 'Skeleton Automatic Movement',
      case: 'Brushed Steel (41mm)',
      strap: 'Blue Alligator Leather',
      waterResistance: '100m (10 ATM)',
      glass: 'Double Anti-Reflective Sapphire'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  },
  {
    id: 'mock-11',
    _id: 'mock-11',
    name: 'Khroniq Aurex Green',
    image: '/assets/aurex_product.png',
    brand: 'KHRONIQ',
    price: 4500,
    stock: 8,
    category: 'Khronomaster',
    gender: 'men',
    description: 'A luxury steel bracelet timepiece presenting an elegant deep emerald green textured dial, framed within a distinctive octagonal bezel. Crafted for the vanguard of modern design.',
    specs: {
      movement: 'High-Frequency Automatic',
      case: 'Integrated Stainless Steel (40mm)',
      strap: 'Brushed Steel Link Bracelet',
      waterResistance: '100m (10 ATM)',
      glass: 'Domed Sapphire Crystal'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    reviews: []
  }
].map(p => ({ ...p, price: p.price * 83, discountPercent: p.discountPercent || 0 }));

const initialState = {
  products: getMockProducts(),
  cart: loadSaved('khroniq_cart', []),
  wishlist: loadSaved('khroniq_wishlist', []),
  orders: [],
  coupons: [],
  currentUser: null,
  currentCurrency: loadSaved('khroniq_currency', 'INR'),
  blogs: [
    {
      id: 'blog-1',
      title: "The Art of Swadeshi Horology",
      content: "Behind the scenes of KHRONIQ's Le Locle and Indian assembly processes, bringing high-precision chronometer watches to modern watch enthusiasts. Discover how we balance heritage design with modern components.",
      author: "Vikram R. Mehta",
      image: "/assets/gentleman_lifestyle.png",
      category: "Horology",
      date: "2026-07-01"
    },
    {
      id: 'blog-2',
      title: "Choosing the Right Case Finish",
      content: "A guide on selecting between polished stainless steel, rose gold PVD, and matte ceramic finishes for your bespoke timepiece. Learn which finish best suits your daily attire and lifestyle.",
      author: "Ananya Sharma",
      image: "/assets/aurex_lifestyle.png",
      category: "Guides",
      date: "2026-07-05"
    }
  ]
};

// Helper for standard API headers
const getHeaders = () => {
  const token = localStorage.getItem('khroniq_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const watchSlice = createSlice({
  name: 'watch',
  initialState,
  reducers: {
    setCurrentUserAction: (state, action) => {
      state.currentUser = action.payload;
    },
    logoutUserAction: (state) => {
      state.currentUser = null;
      state.cart = [];
      state.orders = [];
    },
    addToCartAction: (state, action) => {
      const { productId, quantity, price, customization } = action.payload;
      const existing = state.cart.find(item => 
        item.productId === productId && 
        JSON.stringify(item.customization || {}) === JSON.stringify(customization || {})
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.cart.push({ productId, quantity, price, customization });
      }
    },
    removeFromCartAction: (state, action) => {
      const { productId, customization } = action.payload;
      state.cart = state.cart.filter(item => 
        !(item.productId === productId && 
          JSON.stringify(item.customization || {}) === JSON.stringify(customization || {}))
      );
    },
    updateCartQtyAction: (state, action) => {
      const { productId, qty, customization } = action.payload;
      const existing = state.cart.find(item => 
        item.productId === productId && 
        JSON.stringify(item.customization || {}) === JSON.stringify(customization || {})
      );
      if (existing) {
        existing.quantity = qty;
      }
    },
    clearCartAction: (state) => {
      state.cart = [];
    },
    toggleWishlistAction: (state, action) => {
      const productId = action.payload;
      if (state.wishlist.includes(productId)) {
        state.wishlist = state.wishlist.filter(id => id !== productId);
      } else {
        state.wishlist.push(productId);
      }
    },
    setProductsAction: (state, action) => {
      state.products = action.payload;
    },
    setOrdersAction: (state, action) => {
      state.orders = action.payload;
    },
    setCouponsAction: (state, action) => {
      state.coupons = action.payload;
    },
    setCartAction: (state, action) => {
      state.cart = action.payload;
    },
    setWishlistAction: (state, action) => {
      state.wishlist = action.payload;
    },
    setCurrencyAction: (state, action) => {
      state.currentCurrency = action.payload;
      localStorage.setItem('khroniq_currency', action.payload);
    },
    setBlogsAction: (state, action) => {
      state.blogs = action.payload;
    }
  }
});

export const {
  setCurrentUserAction,
  logoutUserAction,
  addToCartAction,
  removeFromCartAction,
  updateCartQtyAction,
  clearCartAction,
  toggleWishlistAction,
  setProductsAction,
  setOrdersAction,
  setCouponsAction,
  setCartAction,
  setWishlistAction,
  setCurrencyAction,
  setBlogsAction
} = watchSlice.actions;

export const selectCurrentCurrency = state => state.watch.currentCurrency || 'INR';

const clampDiscountPercent = (value) => {
  const percent = Number(value);
  if (Number.isNaN(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
};

export const formatPrice = (price, currency) => {
  const numPrice = Number(price) || 0;
  if (currency === 'INR') {
    return `₹ ${numPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  } else if (currency === 'EUR') {
    return `€ ${(numPrice / 90).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  }
  return `$ ${(numPrice / 83).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export const getDiscountedPrice = (product) => {
  if (!product) return 0;
  const discountPercent = clampDiscountPercent(product.discountPercent);
  return Math.round(product.price * (100 - discountPercent) / 100);
};

export const getDiscountAmount = (product) => {
  if (!product) return 0;
  return Math.max(0, product.price - getDiscountedPrice(product));
};

// Async Thunks using native fetch
export const fetchProducts = () => async (dispatch) => {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
      // Normalize: ensure every product has `id` set from `_id` and image is valid
      const normalized = data.products.map(p => ({
        ...p,
        id: p.id || (p._id ? p._id.toString() : undefined),
        image: (p.image && p.image !== '/placeholder.jpg' && p.image.trim() !== '') ? p.image : '/assets/placeholder.jpg',
      }));
      dispatch(setProductsAction(normalized));
      return;
    }
  } catch (error) {
    console.error('Failed to fetch products from API:', error);
  }
  dispatch(setProductsAction(getMockProducts()));
};

export const fetchCoupons = () => async (dispatch) => {
  try {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    if (data && data.success) {
      dispatch(setCouponsAction(data.coupons));
      return;
    }
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
  }
  dispatch(setCouponsAction([
    { code: 'KHRONIQSTAR', discountPercent: 20, description: '20% off Khroniq Signature Collection' },
    { code: 'WELCOME10', discountPercent: 10, description: '10% off for first-time buyers' }
  ]));
};

export const fetchOrders = () => async (dispatch) => {
  try {
    const res = await fetch('/api/orders', {
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(setOrdersAction(data.orders));
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  }
};

export const fetchCartFromDb = () => async (dispatch) => {
  try {
    const res = await fetch('/api/cart', {
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(setCartAction(data.cart));
    }
  } catch (error) {
    console.error('Failed to fetch cart from DB:', error);
  }
};

export const syncCartWithDb = (guestCart) => async (dispatch) => {
  try {
    const res = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ guestCart })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(setCartAction(data.cart));
    }
  } catch (error) {
    console.error('Failed to sync cart with DB:', error);
  }
};

export const fetchWishlistFromDb = () => async (dispatch) => {
  try {
    const res = await fetch('/api/wishlist', {
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(setWishlistAction(data.wishlist));
    }
  } catch (error) {
    console.error('Failed to fetch wishlist from DB:', error);
  }
};

export const fetchUserProfile = () => async (dispatch) => {
  const token = localStorage.getItem('khroniq_token');
  if (!token) return;
  try {
    const res = await fetch('/api/auth/profile', {
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(setCurrentUserAction(data.user));
      dispatch(fetchOrders());
      dispatch(fetchCartFromDb());
      dispatch(fetchWishlistFromDb());
    } else {
      localStorage.removeItem('khroniq_token');
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    localStorage.removeItem('khroniq_token');
  }
};

export const registerUser = (name, email, password) => async (dispatch, getState) => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('khroniq_token', data.token);
      dispatch(setCurrentUserAction(data.user));

      const guestCart = getState().watch.cart;
      if (guestCart && guestCart.length > 0) {
        dispatch(syncCartWithDb(guestCart));
      } else {
        dispatch(fetchCartFromDb());
      }
      dispatch(fetchWishlistFromDb());

      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Registration failed. Server error.' };
  }
};

export const loginUser = (email, password) => async (dispatch, getState) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('khroniq_token', data.token);
      dispatch(setCurrentUserAction(data.user));
      dispatch(fetchOrders());

      const guestCart = getState().watch.cart;
      if (guestCart && guestCart.length > 0) {
        dispatch(syncCartWithDb(guestCart));
      } else {
        dispatch(fetchCartFromDb());
      }
      dispatch(fetchWishlistFromDb());

      return { success: true, role: data.user.role };
    } else {
      return { success: false, message: data.message, remainingSeconds: data.remainingSeconds };
    }
  } catch (error) {
    return { success: false, message: 'Login failed. Server error.' };
  }
};

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('khroniq_token');
  dispatch(logoutUserAction());
};

export const checkAdminEmail = (email) => async () => {
  try {
    const res = await fetch('/api/auth/check-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return { isAdmin: !!data.isAdmin };
  } catch (error) {
    return { isAdmin: false };
  }
};

export const requestAdminCode = (email) => async () => {
  try {
    const res = await fetch('/api/auth/admin/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to send code. Server error.' };
  }
};

export const verifyAdminCode = (email, code) => async (dispatch, getState) => {
  try {
    const res = await fetch('/api/auth/admin/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('khroniq_token', data.token);
      dispatch(setCurrentUserAction(data.user));
      dispatch(fetchOrders());

      const guestCart = getState().watch.cart;
      if (guestCart && guestCart.length > 0) {
        dispatch(syncCartWithDb(guestCart));
      } else {
        dispatch(fetchCartFromDb());
      }
      dispatch(fetchWishlistFromDb());

      return { success: true, role: data.user.role };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Verification failed. Server error.' };
  }
};

export const updateUserProfile = (name, email, shippingAddress) => async (dispatch) => {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, shippingAddress })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(setCurrentUserAction(data.user));
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { success: false, message: 'Failed to update profile. Server error.' };
  }
};

export const addToCart = (productId, quantity = 1, price = null, customization = null) => async (dispatch, getState) => {
  const { products, cart, currentUser } = getState().watch;
  const product = products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };

  const cartItem = cart.find(item => 
    item.productId === productId && 
    JSON.stringify(item.customization || {}) === JSON.stringify(customization || {})
  );
  const currentQty = cartItem ? cartItem.quantity : 0;

  if (currentQty + quantity > product.stock) {
    return { success: false, message: `Only ${product.stock} items in stock.` };
  }

  const finalPrice = price !== null ? price : getDiscountedPrice(product);

  if (currentUser) {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity, price: finalPrice, customization })
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setCartAction(data.cart));
        return { success: true, message: 'Added to Cart' };
      }
    } catch (error) {
      console.error('Failed to add to database cart:', error);
    }
  }

  dispatch(addToCartAction({ productId, quantity, price: finalPrice, customization }));
  return { success: true, message: 'Added to Cart' };
};

export const updateCartQty = (productId, qty, customization = null) => async (dispatch, getState) => {
  const { products, currentUser } = getState().watch;
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (qty <= 0) {
    dispatch(removeFromCart(productId, customization));
    return;
  }

  if (qty > product.stock) {
    alert(`Only ${product.stock} items are in stock.`);
    qty = product.stock;
  }

  if (currentUser) {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, qty, customization })
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setCartAction(data.cart));
        return;
      }
    } catch (error) {
      console.error('Failed to update database cart qty:', error);
    }
  }

  dispatch(updateCartQtyAction({ productId, qty, customization }));
};

export const removeFromCart = (productId, customization = null) => async (dispatch, getState) => {
  const { currentUser } = getState().watch;

  if (currentUser) {
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, customization })
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setCartAction(data.cart));
        return;
      }
    } catch (error) {
      console.error('Failed to remove from database cart:', error);
    }
  }

  dispatch(removeFromCartAction({ productId, customization }));
};

export const toggleWishlist = (productId) => async (dispatch, getState) => {
  const { currentUser } = getState().watch;

  if (currentUser) {
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setWishlistAction(data.wishlist));
        return;
      }
    } catch (error) {
      console.error('Failed to toggle database wishlist:', error);
    }
  }

  dispatch(toggleWishlistAction(productId));
};

export const placeOrder = (shippingDetails, paymentDetails, appliedCoupon, giftingOptions) => async (dispatch, getState) => {
  const { products, cart, currentUser } = getState().watch;
  if (!currentUser) return { success: false, message: 'Please log in to checkout.' };
  if (cart.length === 0) return { success: false, message: 'Cart is empty' };

  let subtotal = 0;
  const items = cart.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    const finalPrice = item.price !== undefined ? item.price : getDiscountedPrice(p);
    subtotal += finalPrice * item.quantity;
    return {
      productId: item.productId,
      name: p.name,
      price: finalPrice,
      quantity: item.quantity,
      image: p.image
    };
  });

  let discount = 0;
  if (appliedCoupon) {
    discount = Math.round(subtotal * (appliedCoupon.discountPercent / 100));
  }
  const total = subtotal - discount;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        items,
        subtotal,
        discount,
        total,
        shippingDetails,
        paymentDetails,
        giftingOptions
      })
    });
    const data = await res.json();
    if (data.success) {
      if (currentUser) {
        try {
          await fetch('/api/cart/clear', {
            method: 'POST',
            headers: getHeaders()
          });
        } catch (err) {
          console.error('Failed to clear database cart on checkout success:', err);
        }
      }
      dispatch(clearCartAction());
      dispatch(fetchProducts()); // Refresh stocks
      dispatch(fetchOrders());   // Refresh orders list
      return { success: true, order: data.order };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Checkout failed. Server error.' };
  }
};

export const cancelOrder = (orderId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchOrders());
      dispatch(fetchProducts());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Cancellation failed. Server error.' };
  }
};

export const updateOrderStatus = (orderId, newStatus) => async (dispatch) => {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchOrders());
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to update order status:', error);
  }
};

export const updateItemWarranty = (orderId, itemIndex, { serialNumber, claimCode }) => async (dispatch) => {
  try {
    const res = await fetch(`/api/orders/${orderId}/items/${itemIndex}/warranty`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ serialNumber, claimCode })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchOrders());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to update warranty details.' };
  }
};

export const addProduct = (productData) => async (dispatch) => {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchProducts());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to create product.' };
  }
};

export const editProduct = (productId, updatedData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedData)
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchProducts());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to update product.' };
  }
};

export const deleteProduct = (productId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchProducts());
      dispatch(removeFromCartAction(productId));
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to delete product.' };
  }
};

export const addCoupon = (code, discountPercent, description) => async (dispatch) => {
  try {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, discountPercent, description })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchCoupons());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to add coupon.' };
  }
};

export const deleteCoupon = (code) => async (dispatch) => {
  try {
    const res = await fetch(`/api/coupons/${code}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchCoupons());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to delete coupon.' };
  }
};

export const addReview = (productId, rating, comment) => async (dispatch) => {
  try {
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating, comment })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchProducts());
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to post review.' };
  }
};

export const moderateReview = (productId, reviewId, status) => async (dispatch) => {
  try {
    const res = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchProducts());
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to moderate review:', error);
  }
};

export const forgotPassword = (email) => async () => {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Request failed. Server error.' };
  }
};

export const resetPassword = (token, password) => async () => {
  try {
    const res = await fetch(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Reset failed. Server error.' };
  }
};

export const validateCoupon = (code, subtotal) => async () => {
  try {
    const res = await fetch('/api/payments/validate-coupon', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, subtotal })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to validate coupon.' };
  }
};

export const createRazorpayOrder = (amount) => async () => {
  try {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to initiate payment.' };
  }
};

export const verifyRazorpayPayment = (paymentData) => async (dispatch) => {
  try {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData)
    });
    const data = await res.json();
    if (data.success) {
      if (dispatch) {
        // Refresh state after successful payment
        dispatch(clearCartAction());
      }
      try {
        await fetch('/api/cart/clear', { method: 'POST', headers: getHeaders() });
      } catch (err) {
        console.error('Failed to clear database cart:', err);
      }
      dispatch(fetchProducts());
      dispatch(fetchOrders());
    }
    return data;
  } catch (error) {
    return { success: false, message: 'Payment verification failed.' };
  }
};

export const fetchAnalytics = () => async (dispatch) => {
  try {
    const res = await fetch('/api/admin/analytics', {
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      return data.analytics;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
};

export const requestExchangeRefund = (orderId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/orders/${orderId}/exchange-refund`, {
      method: 'PUT',
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchOrders());
      return { success: true };
    } else {
      return { success: false, message: 'Failed to request Exchange/Refund. Server error.' };
    }
  } catch (error) {
    return { success: false, message: 'Failed to request Exchange/Refund. Server error.' };
  }
}

export const fetchBlogs = () => async (dispatch) => {
  try {
    const res = await fetch('/api/blogs');
    const data = await res.json();
    if (data && data.success) {
      dispatch(setBlogsAction(data.blogs));
    }
  } catch (error) {
    console.error('Failed to fetch blogs from API:', error);
  }
};

export const addBlog = (blogData) => async (dispatch) => {
  try {
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(blogData)
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchBlogs());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to add blog.' };
  }
};

export const deleteBlog = (blogId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchBlogs());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to delete blog.' };
  }
};

export const updateBlog = (blogId, blogData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/blogs/${blogId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(blogData)
    });
    const data = await res.json();
    if (data.success) {
      dispatch(fetchBlogs());
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Failed to update blog.' };
  }
};

export default watchSlice.reducer;
import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_CONTENT_SECTIONS } from '../../constants/defaultContent.js';
export { DEFAULT_CONTENT_SECTIONS };

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
    image: '/assets/wt5.png',
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
    name: 'Khroniq Classic Black Edition',
    image: '/assets/watch_black_steel.png',
    brand: 'KHRONIQ',
    price: 4800,
    stock: 5,
    category: 'Khronomaster',
    gender: 'men',
    description: 'High-precision luxury chronograph watch in matte black design with silver sub-dials and detailed tachymeter scale. Equipped with a high-precision automatic movement.',
    specs: {
      movement: 'Automatic Chronograph',
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
      { id: 'rev-3', userName: 'Marc V.', rating: 5, comment: 'The automatic movement is flawless. The black case finish is scratchproof!', date: '2026-05-10', status: 'approved' }
    ]
  },
  {
    id: 'mock-3',
    _id: 'mock-3',
    name: 'Khroniq Elite Classic Brown',
    image: '/assets/wt4.png',
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
    image: '/assets/watch_uploaded_2.png',
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
    name: 'Khroniq Classic Open Heart',
    image: '/assets/watch_red.jpg',
    brand: 'KHRONIQ',
    price: 5200,
    stock: 6,
    category: 'Khronomaster',
    gender: 'men',
    description: 'An exquisite luxury timepiece featuring an open dial revealing the precision balance wheel. Crafted with a polished stainless steel case.',
    specs: {
      movement: 'Automatic Chronograph',
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
    image: '/assets/wt3.png',
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
    image: '/assets/wt1.png',
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
    image: '/assets/watch_black_steel.png',
    brand: 'KHRONIQ',
    price: 4100,
    stock: 5,
    category: 'Defy',
    gender: 'men',
    description: 'A modern architectural masterpiece featuring an openworked black skeleton dial inside a sharp octagonal steel case.',
    specs: {
      movement: 'Automatic Chronometer',
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
    image: '/assets/wt8.png',
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
    image: '/assets/watch_blue_brown.png',
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
    image: '/assets/watch_green.jpg',
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

const DEFAULT_FILTER_CATEGORIES = [
  {
    id: 'cat-gender',
    _id: 'cat-gender',
    name: 'Gender',
    slug: 'gender',
    type: 'multi',
    order: 1,
    isActive: true,
    options: [
      { id: 'opt-men', _id: 'opt-men', name: "Men's Watches", slug: 'men', value: 'men', order: 1, isActive: true },
      { id: 'opt-women', _id: 'opt-women', name: "Women's Watches", slug: 'women', value: 'women', order: 2, isActive: true }
    ]
  },
  {
    id: 'cat-collection',
    _id: 'cat-collection',
    name: 'Collection',
    slug: 'collection',
    type: 'multi',
    order: 2,
    isActive: true,
    options: [
      { id: 'opt-deevaaz', _id: 'opt-deevaaz', name: 'Deevaaz', slug: 'deevaaz', value: 'deevaaz', order: 1, isActive: true },
      { id: 'opt-classic', _id: 'opt-classic', name: 'Classic', slug: 'classic', value: 'classic', order: 2, isActive: true }
    ]
  },
  {
    id: 'cat-movement',
    _id: 'cat-movement',
    name: 'Movement',
    slug: 'movement',
    type: 'multi',
    order: 3,
    isActive: true,
    options: [
      { id: 'opt-auto', _id: 'opt-auto', name: 'Automatic', slug: 'automatic', value: 'automatic', order: 1, isActive: true },
      { id: 'opt-dig', _id: 'opt-dig', name: 'Digital', slug: 'digital', value: 'digital', order: 2, isActive: true },
      { id: 'opt-qtz', _id: 'opt-qtz', name: 'Quartz', slug: 'quartz', value: 'quartz', order: 3, isActive: true }
    ]
  },
  {
    id: 'cat-strap',
    _id: 'cat-strap',
    name: 'Strap',
    slug: 'strap',
    type: 'multi',
    order: 4,
    isActive: true,
    options: [
      { id: 'opt-leather', _id: 'opt-leather', name: 'Leather Strap', slug: 'leather-strap', value: 'leather-strap', order: 1, isActive: true },
      { id: 'opt-chain', _id: 'opt-chain', name: 'Chain Strap', slug: 'chain-strap', value: 'chain-strap', order: 2, isActive: true },
      { id: 'opt-steel', _id: 'opt-steel', name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel', order: 3, isActive: true },
      { id: 'opt-alloy', _id: 'opt-alloy', name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy', order: 4, isActive: true }
    ]
  },
  {
    id: 'cat-dial',
    _id: 'cat-dial',
    name: 'Dial',
    slug: 'dial',
    type: 'multi',
    order: 5,
    isActive: true,
    options: [
      { id: 'opt-analog', _id: 'opt-analog', name: 'Analog', slug: 'analog', value: 'analog', order: 1, isActive: true },
      { id: 'opt-digital', _id: 'opt-digital', name: 'Digital', slug: 'digital', value: 'digital', order: 2, isActive: true },
      { id: 'opt-diganalog', _id: 'opt-diganalog', name: 'Digital Analog', slug: 'digital-analog', value: 'digital-analog', order: 3, isActive: true }
    ]
  },
  {
    id: 'cat-case',
    _id: 'cat-case',
    name: 'Case',
    slug: 'case',
    type: 'multi',
    order: 6,
    isActive: true,
    options: [
      { id: 'opt-casesteel', _id: 'opt-casesteel', name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel', order: 1, isActive: true },
      { id: 'opt-casealloy', _id: 'opt-casealloy', name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy', order: 2, isActive: true }
    ]
  }
];

export const DEFAULT_FOOTER_SECTIONS = [
  {
    id: 'sec-collections',
    _id: 'sec-collections',
    title: 'Collections',
    slug: 'collections',
    type: 'dynamic_collection',
    order: 1,
    isActive: true,
    links: []
  },
  {
    id: 'sec-legal',
    _id: 'sec-legal',
    title: 'Legal',
    slug: 'legal',
    type: 'custom',
    order: 2,
    isActive: true,
    links: [
      { id: 'link-appt', _id: 'link-appt', label: 'Book an Appointment', page: 'static', args: { view: 'contact' }, order: 1, isActive: true },
      { id: 'link-reg', _id: 'link-reg', label: 'Register My Watch', action: 'warranty', order: 2, isActive: true },
      { id: 'link-boutique', _id: 'link-boutique', label: 'Contact', page: 'static', args: { view: 'contact' }, order: 3, isActive: true }
    ]
  },
  {
    id: 'sec-policies',
    _id: 'sec-policies',
    title: 'Policies',
    slug: 'policies',
    type: 'custom',
    order: 3,
    isActive: true,
    links: [
      { id: 'link-priv', _id: 'link-priv', label: 'Privacy Policy', page: 'static', args: { view: 'privacy' }, order: 1, isActive: true },
      { id: 'link-cod', _id: 'link-cod', label: 'COD Policy', page: 'static', args: { view: 'cod' }, order: 2, isActive: true },
      { id: 'link-cookie', _id: 'link-cookie', label: 'Cookie Policy', page: 'static', args: { view: 'cookie' }, order: 3, isActive: true },
      { id: 'link-gift', _id: 'link-gift', label: 'Gifting Policy', page: 'static', args: { view: 'gifting' }, order: 4, isActive: true },
      { id: 'link-repair', _id: 'link-repair', label: 'Repair & Service', page: 'static', args: { view: 'repair' }, order: 5, isActive: true },
      { id: 'link-comm', _id: 'link-comm', label: 'Community Guidelines', page: 'static', args: { view: 'community' }, order: 6, isActive: true },
      { id: 'link-canc', _id: 'link-canc', label: 'Cancellation Policy', page: 'static', args: { view: 'cancellation' }, order: 7, isActive: true },
      { id: 'link-repl', _id: 'link-repl', label: 'Replacement Policy', page: 'static', args: { view: 'exchange' }, order: 8, isActive: true },
      { id: 'link-ref', _id: 'link-ref', label: 'Refund Policy', page: 'static', args: { view: 'refund' }, order: 9, isActive: true },
      { id: 'link-warr', _id: 'link-warr', label: 'Warranty Policy', page: 'static', args: { view: 'warranty' }, order: 10, isActive: true },
      { id: 'link-ship', _id: 'link-ship', label: 'Shipping Policy', page: 'static', args: { view: 'shipping' }, order: 11, isActive: true }
    ]
  },
  {
    id: 'sec-brand',
    _id: 'sec-brand',
    title: 'The Brand',
    slug: 'the-brand',
    type: 'custom',
    order: 4,
    isActive: true,
    links: [
      { id: 'link-hist', _id: 'link-hist', label: 'Our History', page: 'static', args: { view: 'about' }, order: 1, isActive: true },
      { id: 'link-manuf', _id: 'link-manuf', label: 'The Manufacture', page: 'static', args: { view: 'about' }, order: 2, isActive: true },
      { id: 'link-sust', _id: 'link-sust', label: 'Sustainability', page: 'static', args: { view: 'about' }, order: 3, isActive: true },
      { id: 'link-blogs', _id: 'link-blogs', label: 'Blogs & Editorial', page: 'static', args: { view: 'blogs' }, order: 4, isActive: true },
      { id: 'link-faq', _id: 'link-faq', label: 'FAQ', page: 'static', args: { view: 'faq' }, order: 5, isActive: true }
    ]
  }
];

const initialState = {
  products: getMockProducts(),
  productsLoaded: false,
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
      content: "Behind the scenes of KHRONIQ's design and assembly processes, bringing high-precision watches to modern watch enthusiasts. Discover how we balance heritage design with modern components.",
      author: "Vikram R. Mehta",
      image: "/assets/lifestyle_black_cafe.jpg",
      category: "Horology",
      date: "2026-07-01"
    },
    {
      id: 'blog-2',
      title: "Choosing the Right Case Finish",
      content: "A guide on selecting between polished stainless steel, rose gold PVD, and matte ceramic finishes for your bespoke timepiece. Learn which finish best suits your daily attire and lifestyle.",
      author: "Ananya Sharma",
      image: "/assets/lifestyle_pink_cafe.jpg",
      category: "Guides",
      date: "2026-07-05"
    }
  ],
  filters: DEFAULT_FILTER_CATEGORIES,
  adminFilters: DEFAULT_FILTER_CATEGORIES,
  footerSections: DEFAULT_FOOTER_SECTIONS,
  adminFooterSections: DEFAULT_FOOTER_SECTIONS,
  contentSections: DEFAULT_CONTENT_SECTIONS,
  adminContentSections: DEFAULT_CONTENT_SECTIONS,
  activeSessions: [],
  loginActivities: [],
  currentSessionId: null,
  adminUsers: [],
  adminUsersLoading: false
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
      const targetId = (productId?._id || productId)?.toString();
      const existing = state.cart.find(item => {
        const itemProdId = (item.productId?._id || item.productId)?.toString();
        return itemProdId === targetId && 
          JSON.stringify(item.customization || {}) === JSON.stringify(customization || {});
      });
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.cart.push({ productId: targetId, quantity, price, customization });
      }
    },
    removeFromCartAction: (state, action) => {
      const { productId, customization } = action.payload;
      const targetId = (productId?._id || productId)?.toString();
      state.cart = state.cart.filter(item => {
        const itemProdId = (item.productId?._id || item.productId)?.toString();
        return !(itemProdId === targetId && 
          JSON.stringify(item.customization || {}) === JSON.stringify(customization || {}));
      });
    },
    updateCartQtyAction: (state, action) => {
      const { productId, qty, customization } = action.payload;
      const targetId = (productId?._id || productId)?.toString();
      const existing = state.cart.find(item => {
        const itemProdId = (item.productId?._id || item.productId)?.toString();
        return itemProdId === targetId && 
          JSON.stringify(item.customization || {}) === JSON.stringify(customization || {});
      });
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
      state.productsLoaded = true;
    },
    setProductsLoadedAction: (state, action) => {
      state.productsLoaded = action.payload;
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
    },
    setFiltersAction: (state, action) => {
      state.filters = action.payload;
    },
    setAdminFiltersAction: (state, action) => {
      state.adminFilters = action.payload;
    },
    setFooterSectionsAction: (state, action) => {
      state.footerSections = action.payload;
    },
    setAdminFooterSectionsAction: (state, action) => {
      state.adminFooterSections = action.payload;
    },
    setActiveSessionsAction: (state, action) => {
      state.activeSessions = action.payload;
    },
    setLoginActivitiesAction: (state, action) => {
      state.loginActivities = action.payload;
    },
    setCurrentSessionIdAction: (state, action) => {
      state.currentSessionId = action.payload;
    },
    setContentSectionsAction: (state, action) => {
      state.contentSections = action.payload;
    },
    setAdminContentSectionsAction: (state, action) => {
      state.adminContentSections = action.payload;
    },
    setAdminUsersAction: (state, action) => {
      state.adminUsers = action.payload;
    },
    setAdminUsersLoadingAction: (state, action) => {
      state.adminUsersLoading = action.payload;
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
  setProductsLoadedAction,
  setOrdersAction,
  setCouponsAction,
  setCartAction,
  setWishlistAction,
  setCurrencyAction,
  setBlogsAction,
  setFiltersAction,
  setAdminFiltersAction,
  setFooterSectionsAction,
  setAdminFooterSectionsAction,
  setContentSectionsAction,
  setAdminContentSectionsAction,
  setActiveSessionsAction,
  setLoginActivitiesAction,
  setCurrentSessionIdAction,
  setAdminUsersAction,
  setAdminUsersLoadingAction
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
      // Normalize: ensure every product has `id` set from `_id` and images array is preserved
      const normalized = data.products.map(p => {
        const cleanImage = (typeof p.image === 'string') ? p.image.trim() : '';
        const cleanImages = Array.isArray(p.images) && p.images.length > 0
          ? p.images.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
          : (cleanImage ? [cleanImage] : []);
        return {
          ...p,
          id: p.id || (p._id ? p._id.toString() : undefined),
          image: cleanImage || (cleanImages[0] || ''),
          images: cleanImages
        };
      });
      dispatch(setProductsAction(normalized));
      return;
    }
  } catch (error) {
    console.error('Failed to fetch products from API:', error);
  }
  dispatch(setProductsAction(getMockProducts()));
};

export const fetchSingleProduct = (identifier) => async (dispatch, getState) => {
  if (!identifier) return { success: false };
  const decoded = decodeURIComponent(identifier).trim();

  // 1. Check if product is already in current Redux state
  const state = getState();
  const existing = state.watch.products.find(p => {
    if (!p) return false;
    const lower = decoded.toLowerCase();
    if (p.slug && p.slug.trim().toLowerCase() === lower) return true;
    if ((p.id || '').toString().toLowerCase() === lower || (p._id || '').toString().toLowerCase() === lower) return true;
    if (p.modelNo && p.modelNo.trim().toLowerCase() === lower) return true;
    if (p.serialNo && p.serialNo.trim().toLowerCase() === lower) return true;
    return false;
  });

  if (existing) {
    return { success: true, product: existing };
  }

  // 2. Otherwise, try fetching single product from backend endpoint
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(decoded)}`);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.success && data.product) {
        const p = data.product;
        const cleanImage = (typeof p.image === 'string') ? p.image.trim() : '';
        const cleanImages = Array.isArray(p.images) && p.images.length > 0
          ? p.images.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
          : (cleanImage ? [cleanImage] : []);
        const normalized = {
          ...p,
          id: p.id || (p._id ? p._id.toString() : undefined),
          image: cleanImage || (cleanImages[0] || ''),
          images: cleanImages
        };
        const currentProducts = getState().watch.products;
        if (!currentProducts.some(cp => cp.id === normalized.id)) {
          dispatch(setProductsAction([...currentProducts, normalized]));
        }
        return { success: true, product: normalized };
      }
    }
  } catch (err) {
    console.error('Failed to fetch single product from API endpoint:', err);
  }

  // 3. Fallback: Fetch full catalog and resolve
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data && data.success && Array.isArray(data.products)) {
      const normalized = data.products.map(p => {
        const cleanImage = (typeof p.image === 'string') ? p.image.trim() : '';
        const cleanImages = Array.isArray(p.images) && p.images.length > 0
          ? p.images.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
          : (cleanImage ? [cleanImage] : []);
        return {
          ...p,
          id: p.id || (p._id ? p._id.toString() : undefined),
          image: cleanImage || (cleanImages[0] || ''),
          images: cleanImages
        };
      });
      dispatch(setProductsAction(normalized));
      const lower = decoded.toLowerCase();
      const found = normalized.find(p => {
        if (!p) return false;
        if (p.slug && p.slug.trim().toLowerCase() === lower) return true;
        if ((p.id || '').toString().toLowerCase() === lower || (p._id || '').toString().toLowerCase() === lower) return true;
        if (p.modelNo && p.modelNo.trim().toLowerCase() === lower) return true;
        if (p.serialNo && p.serialNo.trim().toLowerCase() === lower) return true;
        return false;
      });
      if (found) {
        return { success: true, product: found };
      }
    }
  } catch (err) {
    console.error('Failed to fallback fetch products catalog:', err);
  }

  return { success: false };
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
    } else if (res.status === 401) {
      localStorage.removeItem('khroniq_token');
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
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
    return {
      isAdmin: !!data.isAdmin,
      isSuperAdmin: !!data.isSuperAdmin,
      requiresOtp: !!data.requiresOtp,
      isActive: data.isActive !== false
    };
  } catch (error) {
    return { isAdmin: false, isSuperAdmin: false, requiresOtp: false, isActive: true };
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
  const targetId = (productId?._id || productId)?.toString();
  const product = products.find(p => (p.id && p.id.toString() === targetId) || (p._id && p._id.toString() === targetId));
  if (!product) return { success: false, message: 'Product not found' };

  const availableStock = Math.max(0, product.stock ?? 0);
  if (availableStock <= 0) {
    return { success: false, message: 'This item is currently out of stock.' };
  }

  const cartItem = cart.find(item => {
    const itemProdId = (item.productId?._id || item.productId)?.toString();
    return itemProdId === targetId && 
      JSON.stringify(item.customization || {}) === JSON.stringify(customization || {});
  });
  const currentQty = cartItem ? cartItem.quantity : 0;

  if (currentQty >= availableStock) {
    return { success: false, message: `Maximum available stock (${availableStock}) is already in your cart.` };
  }

  // Cap requested quantity to remaining available stock
  const remainingStock = availableStock - currentQty;
  const addQty = Math.min(quantity, remainingStock);

  const finalPrice = price !== null ? price : getDiscountedPrice(product);

  if (currentUser) {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId: targetId, quantity: addQty, price: finalPrice, customization })
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

  dispatch(addToCartAction({ productId: targetId, quantity: addQty, price: finalPrice, customization }));
  return { success: true, message: 'Added to Cart' };
};

export const updateCartQty = (productId, qty, customization = null) => async (dispatch, getState) => {
  const { products, currentUser } = getState().watch;
  const targetId = (productId?._id || productId)?.toString();
  const product = products.find(p => (p.id && p.id.toString() === targetId) || (p._id && p._id.toString() === targetId));
  if (!product) return;

  const availableStock = Math.max(0, product.stock ?? 0);

  if (qty <= 0) {
    dispatch(removeFromCart(productId, customization));
    return;
  }

  let finalQty = qty;
  if (finalQty > availableStock) {
    finalQty = availableStock;
  }

  if (finalQty <= 0) {
    dispatch(removeFromCart(productId, customization));
    return;
  }

  if (currentUser) {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId: targetId, qty: finalQty, customization })
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

  dispatch(updateCartQtyAction({ productId: targetId, qty: finalQty, customization }));
};

export const removeFromCart = (productId, customization = null) => async (dispatch, getState) => {
  const { currentUser } = getState().watch;
  const targetId = (productId?._id || productId)?.toString();

  if (currentUser) {
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId: targetId, customization })
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

  dispatch(removeFromCartAction({ productId: targetId, customization }));
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
      await dispatch(fetchProducts());
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
      await dispatch(fetchProducts());
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

export const createRazorpayOrder = (orderData) => async () => {
  try {
    const payload = (typeof orderData === 'object' && orderData !== null && !Array.isArray(orderData))
      ? orderData
      : { amount: orderData };

    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
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

// ─── Filter System Async Thunks ───────────────────────────────────────

// Helper to safely parse JSON response or return error message
const parseApiResponse = async (res, defaultErrMsg) => {
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return { success: false, message: res.ok ? defaultErrMsg : `Server error (${res.status})` };
  } catch (err) {
    return { success: false, message: defaultErrMsg };
  }
};

export const fetchFilters = () => async (dispatch) => {
  try {
    const res = await fetch('/api/filters');
    const data = await parseApiResponse(res, 'Failed to fetch filters');
    if (data.success) {
      dispatch(setFiltersAction(data.categories || []));
      return { success: true, categories: data.categories };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('fetchFilters error:', error);
    return { success: false, message: 'Failed to fetch filters' };
  }
};

export const fetchAdminFilters = () => async (dispatch) => {
  try {
    const res = await fetch('/api/filters/admin', {
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to fetch admin filters');
    if (data.success) {
      dispatch(setAdminFiltersAction(data.categories || []));
      return { success: true, categories: data.categories };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('fetchAdminFilters error:', error);
    return { success: false, message: 'Failed to fetch admin filters' };
  }
};

export const seedDefaultFilters = () => async (dispatch) => {
  try {
    const res = await fetch('/api/filters/seed-defaults', {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to seed default filters.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to seed default filters.' };
  }
};

export const createFilterCategory = (categoryData) => async (dispatch) => {
  try {
    const res = await fetch('/api/filters/categories', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(categoryData)
    });
    const data = await parseApiResponse(res, 'Failed to create filter category.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true, category: data.category };
    }
    return { success: false, message: data.message || 'Failed to create filter category.' };
  } catch (error) {
    console.error('createFilterCategory error:', error);
    return { success: false, message: error.message || 'Failed to create filter category.' };
  }
};

export const updateFilterCategory = (categoryId, categoryData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/filters/categories/${categoryId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(categoryData)
    });
    const data = await parseApiResponse(res, 'Failed to update filter category.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true, category: data.category };
    }
    return { success: false, message: data.message || 'Failed to update filter category.' };
  } catch (error) {
    console.error('updateFilterCategory error:', error);
    return { success: false, message: error.message || 'Failed to update filter category.' };
  }
};

export const deleteFilterCategory = (categoryId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/filters/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete filter category.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true };
    }
    return { success: false, message: data.message || 'Failed to delete filter category.' };
  } catch (error) {
    console.error('deleteFilterCategory error:', error);
    return { success: false, message: error.message || 'Failed to delete filter category.' };
  }
};

export const createFilterOption = (categoryId, optionData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/filters/categories/${categoryId}/options`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(optionData)
    });
    const data = await parseApiResponse(res, 'Failed to create filter option.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true, category: data.category };
    }
    return { success: false, message: data.message || 'Failed to create filter option.' };
  } catch (error) {
    console.error('createFilterOption error:', error);
    return { success: false, message: error.message || 'Failed to create filter option.' };
  }
};

export const updateFilterOption = (categoryId, optionId, optionData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/filters/categories/${categoryId}/options/${optionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(optionData)
    });
    const data = await parseApiResponse(res, 'Failed to update filter option.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true, category: data.category };
    }
    return { success: false, message: data.message || 'Failed to update filter option.' };
  } catch (error) {
    console.error('updateFilterOption error:', error);
    return { success: false, message: error.message || 'Failed to update filter option.' };
  }
};

export const deleteFilterOption = (categoryId, optionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/filters/categories/${categoryId}/options/${optionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete filter option.');
    if (data.success) {
      dispatch(fetchAdminFilters());
      dispatch(fetchFilters());
      return { success: true };
    }
    return { success: false, message: data.message || 'Failed to delete filter option.' };
  } catch (error) {
    console.error('deleteFilterOption error:', error);
    return { success: false, message: error.message || 'Failed to delete filter option.' };
  }
};


// ─── FOOTER MANAGEMENT ASYNC THUNKS ─────────────────────────────────────────
export const fetchFooterSections = () => async (dispatch) => {
  try {
    const res = await fetch('/api/footer');
    const data = await parseApiResponse(res, 'Failed to fetch public footer.');
    if (data.success && data.sections) {
      dispatch(setFooterSectionsAction(data.sections));
      return { success: true, sections: data.sections };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to fetch public footer.' };
  }
};

export const fetchAdminFooterSections = () => async (dispatch) => {
  try {
    const res = await fetch('/api/footer/admin', {
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to fetch admin footer sections.');
    if (data.success && data.sections) {
      dispatch(setAdminFooterSectionsAction(data.sections));
      return { success: true, sections: data.sections };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to fetch admin footer sections.' };
  }
};

export const seedDefaultFooter = () => async (dispatch) => {
  try {
    const res = await fetch('/api/footer/seed-defaults', {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to seed default footer.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to seed default footer.' };
  }
};

export const createFooterSection = (sectionData) => async (dispatch) => {
  try {
    const res = await fetch('/api/footer/sections', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sectionData)
    });
    const data = await parseApiResponse(res, 'Failed to create footer section.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to create footer section.' };
  }
};

export const updateFooterSection = (sectionId, sectionData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sectionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(sectionData)
    });
    const data = await parseApiResponse(res, 'Failed to update footer section.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to update footer section.' };
  }
};

export const deleteFooterSection = (sectionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sectionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete footer section.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to delete footer section.' };
  }
};

export const createFooterLink = (sectionId, linkData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sectionId}/links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(linkData)
    });
    const data = await parseApiResponse(res, 'Failed to add footer link.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to add footer link.' };
  }
};

export const updateFooterLink = (sectionId, linkId, linkData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sectionId}/links/${linkId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(linkData)
    });
    const data = await parseApiResponse(res, 'Failed to update footer link.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to update footer link.' };
  }
};

export const deleteFooterLink = (sectionId, linkId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sectionId}/links/${linkId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete footer link.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to delete footer link.' };
  }
};

export const moveFooterLink = (sourceSectionId, linkId, targetSectionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sourceSectionId}/links/${linkId}/move`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ targetSectionId })
    });
    const data = await parseApiResponse(res, 'Failed to move footer link.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, message: data.message, targetSection: data.targetSection, sourceSection: data.sourceSection };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to move footer link.' };
  }
};

export const moveAllFooterLinks = (sourceSectionId, targetSectionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/footer/sections/${sourceSectionId}/move-all-links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetSectionId })
    });
    const data = await parseApiResponse(res, 'Failed to move all footer links.');
    if (data.success) {
      await dispatch(fetchAdminFooterSections());
      await dispatch(fetchFooterSections());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to move all footer links.' };
  }
};


export const fetchActiveSessions = () => async (dispatch) => {
  try {
    const res = await fetch('/api/auth/sessions', {
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to fetch active sessions.');
    if (data.success && data.sessions) {
      dispatch(setActiveSessionsAction(data.sessions));
      if (data.currentSessionId) {
        dispatch(setCurrentSessionIdAction(data.currentSessionId));
      }
      return { success: true, sessions: data.sessions, currentSessionId: data.currentSessionId };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to fetch active sessions.' };
  }
};

export const fetchLoginActivity = () => async (dispatch) => {
  try {
    const res = await fetch('/api/auth/login-activity', {
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to fetch login activity.');
    if (data.success && data.activities) {
      dispatch(setLoginActivitiesAction(data.activities));
      return { success: true, activities: data.activities };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to fetch login activity.' };
  }
};

export const revokeAdminSession = (sessionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/auth/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to revoke session.');
    if (data.success) {
      await dispatch(fetchActiveSessions());
      await dispatch(fetchLoginActivity());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Unable to revoke this session.' };
  }
};

export const revokeAllOtherSessions = () => async (dispatch) => {
  try {
    const res = await fetch('/api/auth/sessions/revoke-others', {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to revoke other sessions.');
    if (data.success) {
      await dispatch(fetchActiveSessions());
      await dispatch(fetchLoginActivity());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Unable to revoke other sessions.' };
  }
};

// ----------------------------------------------------
// WEBSITE CONTENT MANAGEMENT THUNKS
// ----------------------------------------------------

export const fetchContentSections = (page = '') => async (dispatch) => {
  try {
    const url = page ? `/api/content?page=${encodeURIComponent(page)}` : '/api/content';
    const res = await fetch(url);
    const data = await parseApiResponse(res, 'Failed to fetch content sections.');
    if (data.success && Array.isArray(data.sections) && data.sections.length > 0) {
      dispatch(setContentSectionsAction(data.sections));
      return { success: true, sections: data.sections };
    }
  } catch (error) {
    // continue to fallback
  }
  const defaults = DEFAULT_CONTENT_SECTIONS.filter(s => !page || s.page === page);
  dispatch(setContentSectionsAction(defaults));
  return { success: true, sections: defaults };
};

export const fetchAdminContentSections = (page = '') => async (dispatch) => {
  try {
    const url = page ? `/api/content/admin/all?page=${encodeURIComponent(page)}` : '/api/content/admin/all';
    const res = await fetch(url, { headers: getHeaders() });
    const data = await parseApiResponse(res, 'Failed to fetch admin content sections.');
    if (data.success && Array.isArray(data.sections) && data.sections.length > 0) {
      dispatch(setAdminContentSectionsAction(data.sections));
      return { success: true, sections: data.sections };
    }
  } catch (error) {
    // continue to fallback
  }

  // Fallback 1: Attempt public content API
  try {
    const pubUrl = page ? `/api/content?page=${encodeURIComponent(page)}` : '/api/content';
    const pubRes = await fetch(pubUrl);
    const pubData = await parseApiResponse(pubRes, 'Failed to fetch public content');
    if (pubData.success && Array.isArray(pubData.sections) && pubData.sections.length > 0) {
      dispatch(setAdminContentSectionsAction(pubData.sections));
      return { success: true, sections: pubData.sections };
    }
  } catch (err) {
    // continue to static defaults
  }

  // Fallback 2: Built-in default sections (100% faithful to existing website content)
  const defaults = DEFAULT_CONTENT_SECTIONS.filter(s => !page || s.page === page);
  dispatch(setAdminContentSectionsAction(defaults));
  return { success: true, sections: defaults };
};

export const updateContentSection = (sectionId, updateData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await parseApiResponse(res, 'Failed to update section.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to update section.' };
  }
};

export const createContentSection = (sectionData) => async (dispatch) => {
  try {
    const res = await fetch('/api/content/sections', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sectionData)
    });
    const data = await parseApiResponse(res, 'Failed to create section.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, section: data.section };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to create section.' };
  }
};

export const deleteContentSection = (sectionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete section.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to delete section.' };
  }
};

export const toggleContentSection = (sectionId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}/toggle`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to toggle section status.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, isActive: data.isActive };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to toggle section status.' };
  }
};

export const reorderContentSections = (sectionIds) => async (dispatch) => {
  try {
    const res = await fetch('/api/content/sections/reorder', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ sectionIds })
    });
    const data = await parseApiResponse(res, 'Failed to reorder sections.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to reorder sections.' };
  }
};

export const addContentItem = (sectionId, itemData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(itemData)
    });
    const data = await parseApiResponse(res, 'Failed to add content item.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, item: data.item };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to add content item.' };
  }
};

export const updateContentItem = (sectionId, itemId, updateData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}/items/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await parseApiResponse(res, 'Failed to update content item.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, item: data.item };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to update content item.' };
  }
};

export const deleteContentItem = (sectionId, itemId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}/items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete content item.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to delete content item.' };
  }
};

export const toggleContentItem = (sectionId, itemId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}/items/${itemId}/toggle`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to toggle item.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, isActive: data.isActive };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to toggle item.' };
  }
};

export const reorderContentItems = (sectionId, itemIds) => async (dispatch) => {
  try {
    const res = await fetch(`/api/content/sections/${sectionId}/items/reorder`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ itemIds })
    });
    const data = await parseApiResponse(res, 'Failed to reorder items.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to reorder items.' };
  }
};

export const seedDefaultContent = () => async (dispatch) => {
  try {
    const res = await fetch('/api/content/seed-defaults', {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to seed default content.');
    if (data.success) {
      await dispatch(fetchAdminContentSections());
      await dispatch(fetchContentSections());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Failed to seed default content.' };
  }
};


// ─── ADMIN MANAGEMENT THUNKS (SUPER ADMIN ONLY) ──────────────────────────

export const fetchAdminUsers = () => async (dispatch) => {
  dispatch(setAdminUsersLoadingAction(true));
  try {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to fetch admin users.');
    if (data.success) {
      dispatch(setAdminUsersAction(data.admins || []));
      return { success: true, admins: data.admins };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('fetchAdminUsers error:', error);
    return { success: false, message: 'Server error fetching admins.' };
  } finally {
    dispatch(setAdminUsersLoadingAction(false));
  }
};

export const createAdminUser = (adminData) => async (dispatch) => {
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(adminData)
    });
    const data = await parseApiResponse(res, 'Failed to create admin user.');
    if (data.success) {
      await dispatch(fetchAdminUsers());
      return { success: true, message: data.message, admin: data.admin };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('createAdminUser error:', error);
    return { success: false, message: 'Server error creating admin account.' };
  }
};

export const updateAdminUser = (id, updateData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await parseApiResponse(res, 'Failed to update admin user.');
    if (data.success) {
      await dispatch(fetchAdminUsers());
      return { success: true, message: data.message, admin: data.admin };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('updateAdminUser error:', error);
    return { success: false, message: 'Server error updating admin account.' };
  }
};

export const updateAdminPermissions = (id, permissions) => async (dispatch) => {
  try {
    const res = await fetch(`/api/admin/users/${id}/permissions`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ permissions })
    });
    const data = await parseApiResponse(res, 'Failed to update permissions.');
    if (data.success) {
      await dispatch(fetchAdminUsers());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('updateAdminPermissions error:', error);
    return { success: false, message: 'Server error updating permissions.' };
  }
};

export const toggleAdminStatus = (id, isActive) => async (dispatch) => {
  try {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isActive })
    });
    const data = await parseApiResponse(res, 'Failed to update admin status.');
    if (data.success) {
      await dispatch(fetchAdminUsers());
      return { success: true, message: data.message, isActive: data.isActive };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('toggleAdminStatus error:', error);
    return { success: false, message: 'Server error updating status.' };
  }
};

export const resetAdminPassword = (id, newPassword, confirmPassword) => async (dispatch) => {
  try {
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword, confirmPassword })
    });
    const data = await parseApiResponse(res, 'Failed to reset admin password.');
    if (data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('resetAdminPassword error:', error);
    return { success: false, message: 'Server error resetting password.' };
  }
};

export const deleteAdminUser = (id) => async (dispatch) => {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to delete admin user.');
    if (data.success) {
      await dispatch(fetchAdminUsers());
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('deleteAdminUser error:', error);
    return { success: false, message: 'Server error deleting admin account.' };
  }
};

export const fetchAdminUserSessions = (id) => async () => {
  try {
    const res = await fetch(`/api/admin/users/${id}/sessions`, {
      headers: getHeaders()
    });
    const data = await parseApiResponse(res, 'Failed to fetch sessions.');
    if (data.success) {
      return { success: true, sessions: data.sessions || [] };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('fetchAdminUserSessions error:', error);
    return { success: false, message: 'Server error fetching sessions.' };
  }
};

export default watchSlice.reducer;
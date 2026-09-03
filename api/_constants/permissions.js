export const PERMISSIONS = {
  ANALYTICS: 'analytics',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  REVIEWS: 'reviews',
  WEBSITE_CONTENT: 'website_content',
  CATALOG_FILTERS: 'catalog_filters',
  FOOTER_MANAGEMENT: 'footer_management',
  HOMEPAGE_MEDIA: 'homepage_media',
  BRAND_UPDATES: 'brand_updates',
  BLOGS: 'blogs',
  LOGIN_ACTIVITY: 'login_activity'
};

export const PERMISSION_LIST = [
  { key: 'analytics', label: 'Store Analytics', description: 'View sales trends, revenue metrics, and performance charts' },
  { key: 'products', label: 'Products / Timepieces', description: 'Manage watches, specifications, images, and catalog details' },
  { key: 'inventory', label: 'Inventory', description: 'Monitor stock levels, manage serial/claim codes, and export CSV' },
  { key: 'orders', label: 'Orders / Order Dispatcher', description: 'Process customer orders, update delivery status and warranties' },
  { key: 'coupons', label: 'Coupon Builder', description: 'Create and revoke promotional discount coupon codes' },
  { key: 'reviews', label: 'Reviews Manager', description: 'Moderate, approve, and remove customer watch reviews' },
  { key: 'website_content', label: 'Website Content', description: 'Edit homepage sections, banners, timepieces, and CMS copy' },
  { key: 'catalog_filters', label: 'Catalog Filters', description: 'Configure filter categories (gender, collection, movement, etc.)' },
  { key: 'footer_management', label: 'Footer Management', description: 'Manage footer sections, links, and customer care directories' },
  { key: 'brand_updates', label: 'Brand Updates', description: 'Publish and expire live brand news bulletins and announcements' },
  { key: 'homepage_media', label: 'Homepage Media', description: 'Upload and manage hero banner videos and images' },
  { key: 'blogs', label: 'Blogs Editorial', description: 'Create, edit, and publish editorial horology articles' },
  { key: 'login_activity', label: 'Login Activity', description: 'View administrative login history and active session devices' }
];

export const VALID_PERMISSIONS = PERMISSION_LIST.map(p => p.key);

export const DEFAULT_LOCATIONS = [
  { id: 'loc-flagship', name: 'Main Boutique (Flagship)' },
  { id: 'loc-delhi', name: 'Delhi Store' },
  { id: 'loc-mumbai', name: 'Mumbai Store' },
  { id: 'loc-bengaluru', name: 'Bengaluru Store' },
  { id: 'loc-online', name: 'Online / Atelier Hub' }
];

export const isAdminRole = (role) => role === 'admin' || role === 'super_admin';
export const isSuperAdminRole = (role) => role === 'super_admin';
export const isRestrictedAdminRole = (role) => role === 'admin';

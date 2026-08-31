import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateOrderStatus, 
  updateItemWarranty, 
  addProduct, 
  editProduct, 
  deleteProduct, 
  addCoupon, 
  deleteCoupon, 
  moderateReview,
  fetchAnalytics,
  selectCurrentCurrency,
  formatPrice,
  logoutUser,
  fetchBlogs,
  addBlog,
  deleteBlog,
  updateBlog,
  fetchOrders,
  getDiscountedPrice,
  fetchAdminFilters,
  createFilterCategory,
  updateFilterCategory,
  deleteFilterCategory,
  createFilterOption,
  updateFilterOption,
  deleteFilterOption,
  seedDefaultFilters,
  fetchAdminFooterSections,
  seedDefaultFooter,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  moveFooterLink,
  moveAllFooterLinks,
  fetchActiveSessions,
  fetchLoginActivity,
  revokeAdminSession,
  revokeAllOtherSessions
} from '../store/slices/watchSlice';
import { 
  BarChart3, Plus, Edit, Trash2, Check, X, Tag, Star, 
  Package, AlertTriangle, ShieldAlert, ArrowLeft, ArrowUpRight,
  CheckCircle2, LogOut, Newspaper, ImagePlus, BookOpen, Gift, Download,
  SlidersHorizontal,
  LayoutTemplate,
  ShieldCheck,
  Smartphone,
  Monitor,
  Globe,
  KeyRound,
  Laptop,
  Tablet
} from 'lucide-react';

const PRESET_STRAPS = [
  { name: 'Tan Leather', image: '/assets/wt4.png' },
  { name: 'Diamond Silver Link', image: '/assets/wt3.png' },
  { name: 'Classic Gold Chain', image: '/assets/wt5.png' },
  { name: 'Forest Green Rubber', image: '/assets/wt8.png' },
  { name: 'Brushed Steel Link', image: '/assets/watch_black_steel.png' }
];

const generateUnitCodePair = () => ({
  serialNumber: `KHQ-${new Date().getFullYear()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
  claimCode: `CLM-${Math.random().toString(16).slice(2, 12).toUpperCase()}`
});

// Mirrors the backend's formatWarrantyPeriod() so the admin panel can preview
// the auto-generated Warranty Period text before saving.
const formatWarrantyPeriod = (months) => {
  const m = Number(months) || 0;
  if (m <= 0) return 'No Warranty';
  if (m % 12 === 0) {
    const years = m / 12;
    return `${years} Year${years > 1 ? 's' : ''}`;
  }
  return `${m} Month${m > 1 ? 's' : ''}`;
};

const DIAL_COLOR_PRESETS = [
  { name: 'Midnight Black', hex: '#0a0a0f' },
  { name: 'Pearl White', hex: '#f5f0e8' },
  { name: 'Navy Blue', hex: '#1a2a4a' },
  { name: 'Forest Green', hex: '#1c3a2a' },
  { name: 'Champagne Gold', hex: '#c8a96a' },
  { name: 'Crimson Red', hex: '#6b1515' },
  { name: 'Beige Dial', hex: '#f5f5dc' }
];

export default function Admin({ onPageChange }) {
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);
  const orders = useSelector(state => state.watch.orders);
  const coupons = useSelector(state => state.watch.coupons);
  const currentUser = useSelector(state => state.watch.currentUser);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const blogs = useSelector(state => state.watch.blogs || []);
  const adminFilters = useSelector(state => state.watch.adminFilters || []);

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | products | orders | coupons | reviews | updates | blogs

  // Filter Management State
  const [selectedCatForOptions, setSelectedCatForOptions] = useState(null);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', slug: '', type: 'multi', order: 0, isActive: true });
  const [editingCat, setEditingCat] = useState(null);

  const [showAddOptModal, setShowAddOptModal] = useState(false);
  const [newOptForm, setNewOptForm] = useState({ name: '', slug: '', value: '', order: 0, isActive: true });
  const [editingOpt, setEditingOpt] = useState(null);
  const [filterActionMsg, setFilterActionMsg] = useState(null);

  const adminFooterSections = useSelector(state => state.watch.adminFooterSections || []);

  // Footer Management State
  const [selectedSecForLinks, setSelectedSecForLinks] = useState(null);
  const [showAddSecModal, setShowAddSecModal] = useState(false);
  const [newSecForm, setNewSecForm] = useState({ title: '', order: 0, isActive: true });
  const [editingSec, setEditingSec] = useState(null);

  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLinkForm, setNewLinkForm] = useState({
    label: '',
    linkType: 'static',
    page: 'static',
    url: '',
    argsView: 'contact',
    action: '',
    order: 0,
    isActive: true
  });
  const [editingLink, setEditingLink] = useState(null);
  const [footerActionMsg, setFooterActionMsg] = useState(null);
  const [movingLink, setMovingLink] = useState(null);
  const [deleteSecPrompt, setDeleteSecPrompt] = useState(null);

  // Security / Login Activity State
  const activeSessions = useSelector(state => state.watch.activeSessions || []);
  const loginActivities = useSelector(state => state.watch.loginActivities || []);
  const currentSessionId = useSelector(state => state.watch.currentSessionId);
  const [sessionActionMsg, setSessionActionMsg] = useState(null);
  const [revokingSession, setRevokingSession] = useState(null);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);

  const dynamicCollectionOptions = (() => {
    const colCat = adminFilters.find(c => c.slug === 'collection');
    if (colCat && colCat.options && colCat.options.length > 0) {
      return colCat.options.filter(o => o.isActive).map(o => ({ label: o.name, value: o.name }));
    }
    return [
      { label: 'Deevaaz', value: 'Deevaaz' },
      { label: 'Classic', value: 'Classic' }
    ];
  })();

  useEffect(() => {
    dispatch(fetchAdminFilters());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'filters') {
      dispatch(fetchAdminFilters());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === 'security') {
      dispatch(fetchActiveSessions());
      dispatch(fetchLoginActivity());
    }
    if (activeTab === 'footer') {
      dispatch(fetchAdminFooterSections());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    document.title = 'Master Atelier Dashboard | KHRONIQ';
  }, []);

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    modelNo: '',
    serialNo: '',
    uniqueCode: '',
    price: '',
    stock: '',
    discountPercent: 0,
    badge: '',
    unitCodes: [],
    badgeMode: 'none',
    warrantyMonths: 6,
    category: 'Classic',
    gender: 'unisex',
    description: '',
    image: '', // default copy
    specs: {
      movement: 'Automatic',
      case: '40mm',
      caseMaterial: 'Stainless Steel',
      strap: 'Leather strap',
      waterResistance: '50m',
      glass: 'Sapphire Crystal',
      dialColor: 'Black',
      watchFunction: 'Hours, Minutes, Seconds',
      warrantyDetails: 'Manufacturer Warranty',
      collection: 'Khronomaster',
      warrantyPeriod: '2 Years'
    },
    customizable: true,
    allowStrapCustomization: true,
    allowCaseCustomization: true,
    allowDialCustomization: true,
    customizationOptions: {
      dialColors: [],
      strapMaterials: [],
      customStrapName: '',
      customStrapImage: '',
      customCaseName: '',
      customCaseColor: '#ffffff',
      customStraps: [],
      customCases: []
    }
  });

  // Edit Product Form State
  const [editingId, setEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const [expandedNotes, setExpandedNotes] = useState({});
// Add Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Customization Options temporary states and helper functions
  const [tempStrapName, setTempStrapName] = useState('');
  const [tempStrapImage, setTempStrapImage] = useState('');
  const [tempCaseName, setTempCaseName] = useState('');
const [tempCaseColor, setTempCaseColor] = useState('#ffffff');
  const [tempCasePrice, setTempCasePrice] = useState('');
  const [tempDialColor, setTempDialColor] = useState('#ffffff');
  const [tempDialPrice, setTempDialPrice] = useState('');
  
  

  const handleTempStrapImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setTempStrapImage(data.imageUrl);
      } else {
        alert(data.message || 'Failed to upload strap image');
      }
    } catch (err) {
      console.error('Strap image upload error:', err);
      alert(err.message || 'Failed to upload strap image');
    }
  };

  const handleAddCustomStrap = (isEdit = false) => {
    if (!tempStrapName.trim()) {
      alert('Please enter a name for the custom strap.');
      return;
    }
    const newStrap = { name: tempStrapName.trim(), image: tempStrapImage };
    if (isEdit) {
      const currentStraps = editForm.customizationOptions?.customStraps || [];
      setEditForm({
        ...editForm,
        customizationOptions: {
          ...editForm.customizationOptions,
          customStraps: [...currentStraps, newStrap]
        }
      });
    } else {
      const currentStraps = newProduct.customizationOptions?.customStraps || [];
      setNewProduct({
        ...newProduct,
        customizationOptions: {
          ...newProduct.customizationOptions,
          customStraps: [...currentStraps, newStrap]
        }
      });
    }
    setTempStrapName('');
    setTempStrapImage('');
  };

  const handleRemoveCustomStrap = (idx, isEdit = false) => {
    if (isEdit) {
      const currentStraps = editForm.customizationOptions?.customStraps || [];
      const updated = currentStraps.filter((_, i) => i !== idx);
      setEditForm({
        ...editForm,
        customizationOptions: {
          ...editForm.customizationOptions,
          customStraps: updated
        }
      });
    } else {
      const currentStraps = newProduct.customizationOptions?.customStraps || [];
      const updated = currentStraps.filter((_, i) => i !== idx);
      setNewProduct({
        ...newProduct,
        customizationOptions: {
          ...newProduct.customizationOptions,
          customStraps: updated
        }
      });
    }
  };

  const handleAddCustomCase = (isEdit = false) => {
    if (!tempCaseName.trim()) {
      alert('Please enter a name for the custom case finish.');
      return;
    }
    const priceVal = Number(tempCasePrice) || 0;
    const newCase = { name: tempCaseName.trim(), color: tempCaseColor, price: priceVal };
    if (isEdit) {
      const currentCases = editForm.customizationOptions?.customCases || [];
      const updatedPrices = { ...(editForm.customizationOptions?.casePrices || {}) };
      updatedPrices[newCase.name] = priceVal;
      setEditForm({
        ...editForm,
        customizationOptions: {
          ...editForm.customizationOptions,
          customCases: [...currentCases, newCase],
          casePrices: updatedPrices
        }
      });
    } else {
      const currentCases = newProduct.customizationOptions?.customCases || [];
      const updatedPrices = { ...(newProduct.customizationOptions?.casePrices || {}) };
      updatedPrices[newCase.name] = priceVal;
      setNewProduct({
        ...newProduct,
        customizationOptions: {
          ...newProduct.customizationOptions,
          customCases: [...currentCases, newCase],
          casePrices: updatedPrices
        }
      });
    }
    setTempCaseName('');
    setTempCaseColor('#ffffff');
    setTempCasePrice('');
  };

  const handleRemoveCustomCase = (idx, isEdit = false) => {
    if (isEdit) {
      const currentCases = editForm.customizationOptions?.customCases || [];
      const caseToRemove = currentCases[idx];
      const updated = currentCases.filter((_, i) => i !== idx);
      const updatedPrices = { ...(editForm.customizationOptions?.casePrices || {}) };
      if (caseToRemove) delete updatedPrices[caseToRemove.name];
      setEditForm({
        ...editForm,
        customizationOptions: {
          ...editForm.customizationOptions,
          customCases: updated,
          casePrices: updatedPrices
        }
      });
    } else {
      const currentCases = newProduct.customizationOptions?.customCases || [];
      const caseToRemove = currentCases[idx];
      const updated = currentCases.filter((_, i) => i !== idx);
      const updatedPrices = { ...(newProduct.customizationOptions?.casePrices || {}) };
      if (caseToRemove) delete updatedPrices[caseToRemove.name];
      setNewProduct({
        ...newProduct,
        customizationOptions: {
          ...newProduct.customizationOptions,
          customCases: updated,
          casePrices: updatedPrices
        }
      });
    }
  };

  const handleAddCustomDialColor = (isEdit = false) => {
    const priceVal = Number(tempDialPrice) || 0;
    const target = isEdit ? editForm : newProduct;
    const currentColors = target.customizationOptions?.dialColors || [];
    if (currentColors.includes(tempDialColor)) {
      alert('This dial color is already added.');
      return;
    }
    const updatedColors = [...currentColors, tempDialColor];
    const updatedPrices = { ...(target.customizationOptions?.dialPrices || {}) };
    updatedPrices[tempDialColor] = priceVal;

    if (isEdit) {
      setEditForm({
        ...editForm,
        customizationOptions: { ...editForm.customizationOptions, dialColors: updatedColors, dialPrices: updatedPrices }
      });
    } else {
      setNewProduct({
        ...newProduct,
        customizationOptions: { ...newProduct.customizationOptions, dialColors: updatedColors, dialPrices: updatedPrices }
      });
    }
    setTempDialColor('#ffffff');
    setTempDialPrice('');
  };

  const handleRemoveCustomDialColor = (hex, isEdit = false) => {
    const target = isEdit ? editForm : newProduct;
    const updatedColors = (target.customizationOptions?.dialColors || []).filter(c => c !== hex);
    const updatedPrices = { ...(target.customizationOptions?.dialPrices || {}) };
    delete updatedPrices[hex];

    if (isEdit) {
      setEditForm({
        ...editForm,
        customizationOptions: { ...editForm.customizationOptions, dialColors: updatedColors, dialPrices: updatedPrices }
      });
    } else {
      setNewProduct({
        ...newProduct,
        customizationOptions: { ...newProduct.customizationOptions, dialColors: updatedColors, dialPrices: updatedPrices }
      });
    }
  };


  // Analytics State


  // Analytics State
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      dispatch(fetchAnalytics()).then((data) => {
        if (data) setAnalytics(data);
      });
    }
  }, [currentUser, dispatch]);

  // --- BRAND UPDATES ADMIN STATES & OPERATIONS ---
  const [adminUpdates, setAdminUpdates] = useState([]);
  const [showAddUpdateForm, setShowAddUpdateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', detail: '', approved: true, durationHours: 24 });
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editUpdateForm, setEditUpdateForm] = useState(null);

// --- MEDIA MANAGER STATES ---
  const [mediaSection, setMediaSection] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('khroniq_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const HOMEPAGE_SECTIONS = [
    { key: 'gender_men', label: "Shop by Gender — Men's Banner" },
    { key: 'gender_women', label: "Shop by Gender — Women's Banner" },
    { key: 'collection_khronomaster', label: 'Collection Tile — Classic' },
    { key: 'collection_defy', label: 'Collection Tile — Defy' },
    { key: 'collection_heritage', label: 'Collection Tile — Elite & Heritage' },
    { key: 'khronomaster_professional', label: 'Classic Professional — Hero Image' },
    { key: 'dive_deeper_tile1', label: 'Classic Professional — Tile 1 (Emerald Green)' },
    { key: 'dive_deeper_tile2', label: 'Classic Professional — Tile 2 (Crimson Red)' },
    { key: 'khroniq_updates', label: 'Khroniq Updates — Drawer / Header Banner' },
    { key: 'hero_slide1_lifestyle', label: 'Hero Slide 1 — Crimson Red (Lifestyle)' },
    { key: 'hero_slide1_product', label: 'Hero Slide 1 — Crimson Red (Watch)' },
    { key: 'hero_slide2_lifestyle', label: 'Hero Slide 2 — Emerald Green (Lifestyle)' },
    { key: 'hero_slide2_product', label: 'Hero Slide 2 — Emerald Green (Watch)' },
    { key: 'hero_slide3_lifestyle', label: 'Hero Slide 3 — Midnight Black (Lifestyle)' },
    { key: 'hero_slide3_product', label: 'Hero Slide 3 — Midnight Black (Watch)' },
    { key: 'hero_slide4_lifestyle', label: 'Hero Slide 4 — Cobalt Blue (Lifestyle)' },
    { key: 'hero_slide4_product', label: 'Hero Slide 4 — Cobalt Blue (Watch)' },
    { key: 'hero_slide5_lifestyle', label: 'Hero Slide 5 — Sterling Silver (Lifestyle)' },
    { key: 'hero_slide5_product', label: 'Hero Slide 5 — Sterling Silver (Watch)' }
  ];

  useEffect(() => {
    if (currentUser?.role === 'admin' && activeTab === 'media') {
      const token = localStorage.getItem('khroniq_token');
      fetch('/api/admin/media', {
        headers: { ...getAuthHeaders() }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const lookup = {};
            data.media.forEach(doc => {
              if (!lookup[doc.section]) lookup[doc.section] = doc.url; // newest first, already sorted server-side
            });
            setMediaList(lookup);
          }
        })
        .catch(err => console.error('Failed to fetch media:', err));
    }
  }, [currentUser, activeTab]);

  const handleSectionImageUpload = async (e, sectionKey) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('section', sectionKey);
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.media?.[0]) {
        setMediaList(prev => ({ ...prev, [sectionKey]: data.media[0].url }));
      } else {
        alert(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Section image upload error:', err);
      alert(err.message || 'Failed to upload image.');
    } finally {
      setUploadingMedia(false);
    }
  };

  // --- BLOGS ADMIN STATES & OPERATIONS ---
  const [showAddBlogForm, setShowAddBlogForm] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', category: 'Horology', image: '', content: '', author: '' });
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [editBlogForm, setEditBlogForm] = useState(null);
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);

  const handleStrapImageChange = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Failed to upload strap image');
        return;
      }

      if (isEdit) {
        setEditForm(prev => ({
          ...prev,
          customizationOptions: { ...prev.customizationOptions, customStrapImage: data.imageUrl }
        }));
      } else {
        setNewProduct(prev => ({
          ...prev,
          customizationOptions: { ...prev.customizationOptions, customStrapImage: data.imageUrl }
        }));
      }
    } catch (err) {
      console.error('Strap image upload error:', err);
      alert(err.message || 'Failed to upload strap image');
    }
  };

  const handleStrapCheckboxChange = (strapName, isEdit = false) => {
    const target = isEdit ? editForm : newProduct;
    const currentStraps = target.customizationOptions?.strapMaterials || [];
    let updatedStraps;
    if (currentStraps.includes(strapName)) {
      updatedStraps = currentStraps.filter(s => s !== strapName);
    } else {
      updatedStraps = [...currentStraps, strapName];
    }
    
    if (isEdit) {
      setEditForm({
        ...editForm,
        customizationOptions: {
          ...editForm.customizationOptions,
          strapMaterials: updatedStraps
        }
      });
    } else {
      setNewProduct({
        ...newProduct,
        customizationOptions: {
          ...newProduct.customizationOptions,
          strapMaterials: updatedStraps
        }
      });
    }
  };

  const handleDialColorCheckboxChange = (colorHex, isEdit = false) => {
    const target = isEdit ? editForm : newProduct;
    const currentColors = target.customizationOptions?.dialColors || [];
    let updatedColors;
    if (currentColors.includes(colorHex)) {
      updatedColors = currentColors.filter(c => c !== colorHex);
    } else {
      updatedColors = [...currentColors, colorHex];
    }
    
    if (isEdit) {
      setEditForm({
        ...editForm,
        customizationOptions: {
          ...editForm.customizationOptions,
          dialColors: updatedColors
        }
      });
    } else {
      setNewProduct({
        ...newProduct,
        customizationOptions: {
          ...newProduct.customizationOptions,
          dialColors: updatedColors
        }
      });
    }
  };

  const fetchAdminUpdates = async () => {
    try {
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/brand-updates/admin', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (data && data.success) {
        setAdminUpdates(data.updates);
      }
    } catch (err) {
      console.error('Error fetching admin updates:', err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      dispatch(fetchOrders());
      if (activeTab === 'updates') {
        fetchAdminUpdates();
      } else if (activeTab === 'blogs') {
        dispatch(fetchBlogs());
      }
    }
  }, [activeTab, currentUser, dispatch]);

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) {
      alert('Please fill out both Title and Content.');
      return;
    }
    const res = await dispatch(addBlog(newBlog));
    if (res?.success) {
      setNewBlog({ title: '', category: 'Horology', image: '', content: '', author: '' });
      setShowAddBlogForm(false);
    } else {
      alert(res?.message || 'Failed to create blog post.');
    }
  };

  const handleBlogImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingBlogImage(true);
  try {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('khroniq_token');

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      setNewBlog({ ...newBlog, image: data.imageUrl });
    } else {
      alert(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Blog image upload error:', error);
    alert('Failed to upload image');
  } finally {
    setUploadingBlogImage(false);
  }
};

const handleEditBlogImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingBlogImage(true);
  try {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('khroniq_token');

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      setEditBlogForm({ ...editBlogForm, image: data.imageUrl });
    } else {
      alert(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Blog image upload error:', error);
    alert('Failed to upload image');
  } finally {
    setUploadingBlogImage(false);
  }
};

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      const res = await dispatch(deleteBlog(blogId));
      if (!res?.success) {
        alert(res?.message || 'Failed to delete blog post.');
      }
    }
  };

  const handleEditBlogInit = (blog) => {
    setEditingBlogId(blog.id || blog._id);
    setEditBlogForm({
      title: blog.title,
      category: blog.category,
      author: blog.author,
      image: blog.image,
      content: blog.content
    });
    setShowAddBlogForm(false);
  };

  const handleUpdateBlogSubmit = async (e) => {
    e.preventDefault();
    if (!editBlogForm.title || !editBlogForm.content) {
      alert('Please fill out both Title and Content.');
      return;
    }
    const res = await dispatch(updateBlog(editingBlogId, editBlogForm));
    if (res?.success) {
      setEditingBlogId(null);
      setEditBlogForm(null);
    } else {
      alert(res?.message || 'Failed to update blog post.');
    }
  };


  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.title || !newUpdate.detail) {
      alert('Please fill out both Title and Details.');
      return;
    }
    try {
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/brand-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newUpdate)
      });
      const data = await res.json();
      if (data.success) {
        alert('Brand update created successfully!');
        setShowAddUpdateForm(false);
        setNewUpdate({ title: '', detail: '', approved: true, durationHours: 24 });
        fetchAdminUpdates();
      } else {
        alert(data.message || 'Failed to create update.');
      }
    } catch (err) {
      console.error('Create update error:', err);
    }
  };

  const handleToggleUpdateApproval = async (id, currentApproved) => {
    try {
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch(`/api/brand-updates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ approved: !currentApproved })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminUpdates();
      } else {
        alert(data.message || 'Failed to toggle approval.');
      }
    } catch (err) {
      console.error('Toggle approval error:', err);
    }
  };

  const handleEditUpdateInit = (update) => {
    setEditingUpdateId(update.id || update._id);
    setEditUpdateForm({ ...update });
  };

  const handleUpdateUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch(`/api/brand-updates/${editingUpdateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editUpdateForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('Brand update edited successfully!');
        setEditingUpdateId(null);
        setEditUpdateForm(null);
        fetchAdminUpdates();
      } else {
        alert(data.message || 'Failed to edit update.');
      }
    } catch (err) {
      console.error('Edit update error:', err);
    }
  };

  const handleDeleteUpdate = async (id) => {
    if (!window.confirm('Delete this brand update permanently?')) return;
    try {
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch(`/api/brand-updates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Brand update removed!');
        fetchAdminUpdates();
      } else {
        alert(data.message || 'Failed to remove update.');
      }
    } catch (err) {
      console.error('Delete update error:', err);
    }
  };


  // Validation checking for security
  if (!currentUser || currentUser.role !== 'admin') {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('khroniq_token');
    if (hasToken && !currentUser) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 text-luxury-gold">
          <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">Verifying Admin Session...</p>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto text-center py-20 bg-luxury-gray border border-white/5 rounded p-8 space-y-6">
        <ShieldAlert className="mx-auto text-luxury-red animate-bounce" size={48} />
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-white uppercase tracking-widest">Unauthorized Access</h1>
          <p className="text-xs text-gray-400">Your account credentials do not grant administrator permissions to modify system states.</p>
        </div>
        <button
          onClick={() => onPageChange('login')}
          className="px-6 py-2.5 bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold-dark transition"
        >
          Authenticate Admin Account
        </button>
      </div>
    );
  }

  // --- ANALYTICS CALCULATIONS ---
// --- ANALYTICS CALCULATIONS (fallback client-side values, used until backend analytics loads) ---
  const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Real category sales — sourced directly from backend analytics (analytics.salesByCategory),
  // not recalculated client-side. No mock/fallback numbers — shows real 0 when there are no sales.
  const categories = ['Khronomaster', 'Defy', 'Heritage', 'Elite'];
  const displaySales = { Khronomaster: 0, Defy: 0, Heritage: 0, Elite: 0 };

  if (analytics?.salesByCategory) {
    analytics.salesByCategory.forEach(entry => {
      const rawCat = (entry._id || 'Heritage').toString().trim().toLowerCase();
      const matchedKey = categories.find(c => c.toLowerCase() === rawCat);
      if (matchedKey) {
        displaySales[matchedKey] += entry.revenue || 0;
      } else {
        displaySales.Heritage += entry.revenue || 0; // unmatched/unknown categories bucket into Heritage
      }
    });
  }

  const maxVal = Math.max(...Object.values(displaySales), 1000);

  // Compile all active (approved) reviews for management
  const activeReviews = [];
  products.forEach(p => {
    p.reviews?.forEach(r => {
      if (r.status === 'approved') {
        activeReviews.push({
          productId: p.id,
          productName: p.name,
          review: r
        });
      }
    });
  });




const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('khroniq_token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      setNewProduct({ ...newProduct, image: data.imageUrl });
    } else {
      alert(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    alert(error.message || 'Failed to upload image');
  } finally {
    setUploadingImage(false);
  }
};

const handleEditImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('khroniq_token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      setEditForm({ ...editForm, image: data.imageUrl });
    } else {
      alert(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    alert(error.message || 'Failed to upload image');
  } finally {
    setUploadingImage(false);
  }
};



  // --- ACTIONS HANDLERS ---
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert('Please fill out Name, Price and Stock.');
      return;
    }
    // Auto append custom fields
    let customOpts = { ...(newProduct.customizationOptions || {}) };
    if (customOpts.customStrapName && !customOpts.strapMaterials?.includes(customOpts.customStrapName)) {
      customOpts.strapMaterials = [...(customOpts.strapMaterials || []), customOpts.customStrapName];
    }
    const finalProduct = {
      ...newProduct,
      discountPercent: Number(newProduct.discountPercent) || 0,
      customizationOptions: customOpts
    };
    const res = await dispatch(addProduct(finalProduct));
    if (res && res.success) {
      alert('Product created successfully!');
      setShowAddForm(false);
      setNewProduct({
        name: '', modelNo: '', serialNo: '', uniqueCode: '', price: '', stock: '', discountPercent: 0, badge: '', badgeMode: 'none',unitCodes: [],  warrantyMonths: 12, category: 'Khronomaster', description: '',
        image: '',
        specs: { movement: 'Automatic', case: '40mm', strap: 'Leather', waterResistance: '50m', glass: 'Sapphire', dialColor: 'Black', caseMaterial: 'Stainless Steel', watchFunction: 'Hours, Minutes, Seconds', warrantyDetails: 'Manufacturer Warranty', collection: 'Khronomaster', warrantyPeriod: '2 Years' },
        customizable: true,
        allowStrapCustomization: true,
        allowCaseCustomization: true,
        customizationOptions: {
          dialColors: [],
          strapMaterials: [],
          customStrapName: '',
          customStrapImage: '',
          customCaseName: '',
          customCaseColor: '#ffffff'
        },

      });
    } else {
      alert(res?.message || 'Failed to create product.');
    }
  };

  const handleEditProductInit = (product) => {
    setEditingId(product.id);
    setEditForm({ 
      ...product, 
      modelNo: product.modelNo || '',
      serialNo: product.serialNo || '',
      uniqueCode: product.uniqueCode || '',
      discountPercent: product.discountPercent ?? 0,
      badge: product.badge ?? '',
      badgeMode: ['New', 'Limited Edition', 'Bestseller'].includes(product.badge) ? product.badge : (product.badge ? 'custom' : 'none'),
      existingUnitCodes: product.unitCodes || [],
      newUnitCodes: [],
      customizable: product.customizable ?? false,
      allowStrapCustomization: product.allowStrapCustomization ?? true,
      allowCaseCustomization: product.allowCaseCustomization ?? true,
      specs: {
        movement: product.specs?.movement || 'Automatic Chronometer',
        case: product.specs?.case || 'Stainless Steel (40mm)',
        strap: product.specs?.strap || 'Leather',
        waterResistance: product.specs?.waterResistance || '50m',
        glass: product.specs?.glass || 'Sapphire Crystal',
        dialColor: product.specs?.dialColor || 'Black',
        caseMaterial: product.specs?.caseMaterial || 'Stainless Steel',
        watchFunction: product.specs?.watchFunction || 'Hours, Minutes, Seconds',
        warrantyDetails: product.specs?.warrantyDetails || 'Manufacturer Warranty',
        collection: product.specs?.collection || 'Khronomaster',
        warrantyPeriod: product.specs?.warrantyPeriod || '2 Years'
      },
      customizationOptions: {
        dialColors: product.customizationOptions?.dialColors || [],
        strapMaterials: product.customizationOptions?.strapMaterials || [],
        customStrapName: product.customizationOptions?.customStrapName || '',
        customStrapImage: product.customizationOptions?.customStrapImage || '',
        customCaseName: product.customizationOptions?.customCaseName || '',
        customCaseColor: product.customizationOptions?.customCaseColor || '#ffffff'
      }
    });
  };

  const handleUpdateProduct = async (e) => {
    
    e.preventDefault();
    let customOpts = { ...(editForm.customizationOptions || {}) };
    if (customOpts.customStrapName && !customOpts.strapMaterials?.includes(customOpts.customStrapName)) {
      customOpts.strapMaterials = [...(customOpts.strapMaterials || []), customOpts.customStrapName];
    }
    const finalProduct = {
      ...editForm,
      unitCodes: editForm.newUnitCodes || [],
      customizationOptions: customOpts
    };
    const res = await dispatch(editProduct(editingId, finalProduct));
    if (res && res.success) {
      alert('Product edited successfully!');
      setEditingId(null);
      setEditForm(null);
    } else {
      alert(res?.message || 'Failed to update product.');
    }
  };


  const handleDownloadInventoryCSV = () => {
    const rows = [];
    products.forEach((p) => {
      (p.unitCodes || []).forEach((code) => {
        rows.push({
          watchName: p.name,
          serialNumber: code.serialNumber || '',
          claimCode: code.claimCode || '',
          status: code.used ? 'Sold' : 'Available'
        });
      });
    });

    if (rows.length === 0) {
      alert('No serial/claim code records found.');
      return;
    }

    const headers = ['Watch Name', 'Serial Number', 'Claim Code', 'Status'];
    const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csvLines = [
      headers.join(','),
      ...rows.map(r => [r.watchName, r.serialNumber, r.claimCode, r.status].map(escapeCsv).join(','))
    ];
    const csvContent = csvLines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khroniq-inventory-codes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  

  const handleDeleteProductClick = (id) => {
    if (window.confirm('Delete this timepiece from store inventory?')) {
      dispatch(deleteProduct(id));
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponDiscount) return;
    const res = await dispatch(addCoupon(newCouponCode, newCouponDiscount, newCouponDesc));
    if (res && res.success) {
      alert('Coupon code activated!');
      setNewCouponCode('');
      setNewCouponDiscount('');
      setNewCouponDesc('');
    } else {
      alert(res?.message || 'Failed to add coupon.');
    }
  };

  const handleReviewStatus = (productId, reviewId, status) => {
    dispatch(moderateReview(productId, reviewId, status));
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold uppercase text-white tracking-widest">Admin Control Center</h1>
          <p className="text-gray-400 text-xs mt-1">Configure Khroniq store parameters, monitor sales trends, and verify stock thresholds.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange('home')}
            className="px-4 py-2 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Exit Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              dispatch(logoutUser());
              onPageChange('home');
            }}
            className="px-4 py-2 bg-luxury-red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer rounded-sm"
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Selectors */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-white/5 pb-4">
        {[
          { key: 'analytics', label: 'Store Analytics', icon: BarChart3 },
          { key: 'products', label: 'Timepiece Section', icon: Package },
          { key: 'orders', label: 'Order Dispatcher', icon: CheckCircle2 },
          { key: 'coupons', label: 'Coupon Builder', icon: Tag },
          { key: 'reviews', label: 'Reviews Manager', icon: Star },
          
          { key: 'filters', label: 'Catalog Filters', icon: SlidersHorizontal },
          { key: 'footer', label: 'Footer Management', icon: LayoutTemplate },
          { key: 'security', label: 'Login Activity', icon: ShieldCheck },
          { key: 'updates', label: 'Brand Updates', icon: Newspaper },
          { key: 'media', label: 'Homepage Media', icon: ImagePlus },
          { key: 'blogs', label: 'Blogs Editorial', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2.5 px-4 font-black uppercase tracking-widest cursor-pointer transition flex items-center space-x-1.5 rounded-sm border ${
                activeTab === tab.key 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
              style={{
                color: activeTab === tab.key ? '#ffffff' : '#000000',
                backgroundColor: activeTab === tab.key ? '#000000' : '#ffffff',
                borderColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
              }}
            >
              <Icon size={14} style={{ color: activeTab === tab.key ? '#ffffff' : '#000000' }} />
              <span style={{ color: activeTab === tab.key ? '#ffffff' : '#000000' }}>{tab.label}</span>
              {tab.key === 'reviews' && activeReviews.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-medium ml-1">
                  {activeReviews.length}
                </span>
              )}
            </button>
          );
        })}
      </div>


                  {/* ─── TAB CONTENT: CATALOG FILTERS ───────────────────────────── */}
      {activeTab === 'filters' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-luxury-gray border border-white/10 p-6 rounded-md">
            <div>
              <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <SlidersHorizontal size={18} className="text-luxury-gold" />
                <span>{selectedCatForOptions ? `${selectedCatForOptions.name} Options` : 'Catalog Filters'}</span>
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {selectedCatForOptions 
                  ? `Managing filter options for ${selectedCatForOptions.name}. Any changes synchronize with the customer catalog.` 
                  : 'Manage customer-facing filter categories (Gender, Collection, Movement, Strap, Dial, Case) and options.'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedCatForOptions ? (
                <>
                  <button
                    onClick={() => setSelectedCatForOptions(null)}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-600 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition rounded shadow-sm hover:bg-neutral-800 flex items-center space-x-1.5 cursor-pointer"
                    style={{ backgroundColor: '#171717', color: '#ffffff', borderColor: '#525252' }}
                  >
                    <ArrowLeft size={14} style={{ color: '#ffffff' }} />
                    <span>Back to All Categories</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewOptForm({ 
                        name: '', 
                        order: (selectedCatForOptions.options?.length || 0) + 1, 
                        isActive: true 
                      });
                      setShowAddOptModal(true);
                    }}
                    className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-black uppercase tracking-wider transition rounded shadow flex items-center space-x-1.5 cursor-pointer border border-[#d4af37]"
                    style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                  >
                    <Plus size={14} style={{ strokeWidth: 3, color: '#000000' }} />
                    <span>Add Option</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      const res = await dispatch(seedDefaultFilters());
                      if (res.success) {
                        setFilterActionMsg({ type: 'success', text: 'Default filter categories verified and active.' });
                      } else {
                        setFilterActionMsg({ type: 'error', text: res.message || 'Seeding failed.' });
                      }
                      setTimeout(() => setFilterActionMsg(null), 4000);
                    }}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-600 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition rounded shadow-sm hover:bg-neutral-800 cursor-pointer"
                    style={{ backgroundColor: '#171717', color: '#ffffff', borderColor: '#525252' }}
                  >
                    Verify / Seed Defaults
                  </button>
                  <button
                    onClick={() => {
                      setNewCatForm({ name: '', order: adminFilters.length + 1, isActive: true });
                      setShowAddCatModal(true);
                    }}
                    className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-black uppercase tracking-wider transition rounded shadow flex items-center space-x-1.5 cursor-pointer border border-[#d4af37]"
                    style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                  >
                    <Plus size={14} style={{ strokeWidth: 3, color: '#000000' }} />
                    <span>Add New Category</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Feedback Message Notification */}
          {filterActionMsg && (
            <div className={`p-4 rounded border text-xs font-bold flex items-center justify-between transition-all ${
              filterActionMsg.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' 
                : 'bg-red-950/90 border-red-500 text-red-300'
            }`}
            style={{
              backgroundColor: filterActionMsg.type === 'success' ? '#022c22' : '#450a0a',
              borderColor: filterActionMsg.type === 'success' ? '#10b981' : '#ef4444',
              color: filterActionMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
            }}>
              <span>{filterActionMsg.text}</span>
              <button onClick={() => setFilterActionMsg(null)} className="cursor-pointer text-white/60 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ─── VIEW 1: MANAGE OPTIONS VIEW ───────────────────────────── */}
          {selectedCatForOptions ? (
            <div className="space-y-4">
              <div className="bg-luxury-gray border border-white/10 rounded-md overflow-hidden shadow-lg">
                <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">{selectedCatForOptions.name} Options</span>
                    <span className="text-[10px] text-gray-400">({(selectedCatForOptions.options || []).length} total)</span>
                  </div>
                  <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-wider">
                    Click 'Edit' to rename, or 'Disable' to hide from customers
                  </span>
                </div>

                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/20 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="p-4">Option Name</th>
                      <th className="p-4 text-center">Display Order</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(!selectedCatForOptions.options || selectedCatForOptions.options.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-gray-500 italic space-y-2">
                          <p>No options found for this category.</p>
                          <button
                            onClick={() => {
                              setNewOptForm({ name: '', order: 1, isActive: true });
                              setShowAddOptModal(true);
                            }}
                            className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] rounded text-xs font-extrabold cursor-pointer transition shadow border border-[#d4af37]"
                            style={{ backgroundColor: '#d4af37', color: '#000000' }}
                          >
                            + Add the first option
                          </button>
                        </td>
                      </tr>
                    ) : (
                      selectedCatForOptions.options.map((opt) => (
                        <tr key={opt.id || opt._id} className="hover:bg-white/[0.02] transition">
                          <td className="p-4 font-bold text-white text-sm">
                            {opt.name}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-white">
                            {opt.order || 0}
                          </td>
                          <td className="p-4 text-center">
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                              style={{
                                backgroundColor: opt.isActive ? '#022c22' : '#171717',
                                color: opt.isActive ? '#6ee7b7' : '#a3a3a3',
                                borderColor: opt.isActive ? '#10b981' : '#525252'
                              }}
                            >
                              {opt.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingOpt({
                                  catId: selectedCatForOptions.id || selectedCatForOptions._id,
                                  optId: opt.id || opt._id,
                                  name: opt.name,
                                  order: opt.order || 0,
                                  isActive: opt.isActive
                                });
                              }}
                              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 hover:border-white rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                              style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                const catId = selectedCatForOptions.id || selectedCatForOptions._id;
                                const optId = opt.id || opt._id;
                                const res = await dispatch(updateFilterOption(catId, optId, { isActive: !opt.isActive }));
                                if (res.success) {
                                  const updatedCats = await dispatch(fetchAdminFilters());
                                  if (updatedCats.categories) {
                                    const refreshed = updatedCats.categories.find(c => (c.id || c._id) === catId);
                                    if (refreshed) setSelectedCatForOptions(refreshed);
                                  }
                                  setFilterActionMsg({
                                    type: 'success',
                                    text: `Option "${opt.name}" is now ${!opt.isActive ? 'Active' : 'Disabled'}.`
                                  });
                                  setTimeout(() => setFilterActionMsg(null), 3000);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border"
                              style={{
                                backgroundColor: opt.isActive ? '#451a03' : '#022c22',
                                color: opt.isActive ? '#fcd34d' : '#6ee7b7',
                                borderColor: opt.isActive ? '#f59e0b' : '#10b981',
                              }}
                            >
                              {opt.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete the "${opt.name}" option?\n(Existing products using this attribute will not be deleted)`)) {
                                  const catId = selectedCatForOptions.id || selectedCatForOptions._id;
                                  const optId = opt.id || opt._id;
                                  const res = await dispatch(deleteFilterOption(catId, optId));
                                  if (res.success) {
                                    const updatedCats = await dispatch(fetchAdminFilters());
                                    if (updatedCats.categories) {
                                      const refreshed = updatedCats.categories.find(c => (c.id || c._id) === catId);
                                      if (refreshed) setSelectedCatForOptions(refreshed);
                                    }
                                    setFilterActionMsg({ type: 'success', text: `Option "${opt.name}" deleted.` });
                                    setTimeout(() => setFilterActionMsg(null), 3000);
                                  } else {
                                    setFilterActionMsg({ type: 'error', text: res.message || 'Failed to delete option.' });
                                  }
                                }
                              }}
                              className="px-3.5 py-1.5 bg-red-950/90 border border-red-500 text-red-300 hover:bg-red-900 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                              style={{ backgroundColor: '#450a0a', color: '#fca5a5', borderColor: '#ef4444' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ─── VIEW 2: ALL CATEGORIES DASHBOARD ───────────────────────────── */
            <div className="space-y-4">
              <div className="bg-luxury-gray border border-white/10 rounded-md overflow-hidden shadow-lg">
                <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest">Active Catalog Filter Categories</span>
                  <span className="text-[10px] text-gray-400">Total Categories: {adminFilters.length}</span>
                </div>

                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/20 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="p-4">Category Name</th>
                      <th className="p-4">Options Summary</th>
                      <th className="p-4 text-center">Display Order</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminFilters.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-400 space-y-4">
                          <p className="text-sm">No filter categories loaded from database.</p>
                          <button
                            onClick={async () => {
                              const res = await dispatch(seedDefaultFilters());
                              if (res.success) {
                                setFilterActionMsg({ type: 'success', text: 'Default categories initialized.' });
                              }
                            }}
                            className="px-5 py-2.5 bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-black uppercase tracking-wider rounded cursor-pointer transition shadow border border-[#d4af37]"
                            style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                          >
                            Initialize Default Categories
                          </button>
                        </td>
                      </tr>
                    ) : (
                      adminFilters.map((cat) => {
                        const totalOpts = (cat.options || []).length;
                        const activeOpts = (cat.options || []).filter(o => o.isActive).length;
                        const previewNames = (cat.options || [])
                          .slice(0, 3)
                          .map(o => o.name)
                          .join(', ');

                        return (
                          <tr key={cat.id || cat._id} className="hover:bg-white/[0.02] transition">
                            <td className="p-4">
                              <div className="font-bold text-white text-sm">{cat.name}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {totalOpts} option{totalOpts !== 1 ? 's' : ''} configured
                              </div>
                            </td>
                            <td className="p-4 text-gray-400 text-xs max-w-xs truncate">
                              {previewNames ? (
                                <span>
                                  {previewNames}
                                  {totalOpts > 3 ? `, +${totalOpts - 3} more` : ''}
                                </span>
                              ) : (
                                <span className="italic text-gray-500">No options yet</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-white">
                              {cat.order || 0}
                            </td>
                            <td className="p-4 text-center">
                              <span 
                                className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                                style={{
                                  backgroundColor: cat.isActive ? '#022c22' : '#171717',
                                  color: cat.isActive ? '#6ee7b7' : '#a3a3a3',
                                  borderColor: cat.isActive ? '#10b981' : '#525252'
                                }}
                              >
                                {cat.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedCatForOptions(cat)}
                                className="px-3.5 py-1.5 bg-[#d4af37] text-black hover:bg-[#e5c158] rounded text-[11px] font-black uppercase tracking-wider transition cursor-pointer shadow-sm border border-[#d4af37]"
                                style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                              >
                                Manage Options
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCat({
                                    id: cat.id || cat._id,
                                    name: cat.name,
                                    order: cat.order || 0,
                                    isActive: cat.isActive
                                  });
                                }}
                                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 hover:border-white rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  const res = await dispatch(updateFilterCategory(cat.id || cat._id, { isActive: !cat.isActive }));
                                  if (res.success) {
                                    setFilterActionMsg({
                                      type: 'success',
                                      text: `Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Disabled'}.`
                                    });
                                    setTimeout(() => setFilterActionMsg(null), 3000);
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border"
                                style={{
                                  backgroundColor: cat.isActive ? '#451a03' : '#022c22',
                                  color: cat.isActive ? '#fcd34d' : '#6ee7b7',
                                  borderColor: cat.isActive ? '#f59e0b' : '#10b981',
                                }}
                              >
                                {cat.isActive ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete the "${cat.name}" filter category?\n(Existing products will not be deleted)`)) {
                                    const res = await dispatch(deleteFilterCategory(cat.id || cat._id));
                                    if (res.success) {
                                      setFilterActionMsg({ type: 'success', text: `Category "${cat.name}" deleted.` });
                                      setTimeout(() => setFilterActionMsg(null), 3000);
                                    } else {
                                      setFilterActionMsg({ type: 'error', text: res.message || 'Failed to delete category.' });
                                    }
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-red-950/90 border border-red-500 text-red-300 hover:bg-red-900 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                style={{ backgroundColor: '#450a0a', color: '#fca5a5', borderColor: '#ef4444' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── MODAL: ADD FILTER CATEGORY ───────────────────────────── */}
          {showAddCatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Add New Filter Category</h3>
                  <button onClick={() => setShowAddCatModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCatForm.name.trim()) return;
                    const res = await dispatch(createFilterCategory(newCatForm));
                    if (res.success) {
                      setShowAddCatModal(false);
                      setFilterActionMsg({ type: 'success', text: `Category "${newCatForm.name}" created successfully.` });
                      setTimeout(() => setFilterActionMsg(null), 4000);
                    } else {
                      setFilterActionMsg({ type: 'error', text: res.message || 'Failed to create filter category.' });
                      setTimeout(() => setFilterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Material, Bezel, Collection"
                      value={newCatForm.name}
                      onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={newCatForm.order}
                      onChange={(e) => setNewCatForm({ ...newCatForm, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="newCatActive"
                      checked={newCatForm.isActive}
                      onChange={(e) => setNewCatForm({ ...newCatForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="newCatActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible on Customer Catalog)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(false)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Create Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: EDIT FILTER CATEGORY ───────────────────────────── */}
          {editingCat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Edit Category</h3>
                  <button onClick={() => setEditingCat(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingCat.name.trim()) return;
                    const res = await dispatch(updateFilterCategory(editingCat.id, editingCat));
                    if (res.success) {
                      setEditingCat(null);
                      setFilterActionMsg({ type: 'success', text: 'Category updated successfully.' });
                      setTimeout(() => setFilterActionMsg(null), 3000);
                    } else {
                      setFilterActionMsg({ type: 'error', text: res.message || 'Failed to update category.' });
                      setTimeout(() => setFilterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={editingCat.name}
                      onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={editingCat.order}
                      onChange={(e) => setEditingCat({ ...editingCat, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="editCatActive"
                      checked={editingCat.isActive}
                      onChange={(e) => setEditingCat({ ...editingCat, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="editCatActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible on Customer Catalog)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: ADD OPTION ───────────────────────────── */}
          {showAddOptModal && selectedCatForOptions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">
                    Add Option to {selectedCatForOptions.name}
                  </h3>
                  <button onClick={() => setShowAddOptModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newOptForm.name.trim()) return;
                    const catId = selectedCatForOptions.id || selectedCatForOptions._id;
                    const res = await dispatch(createFilterOption(catId, newOptForm));
                    if (res.success) {
                      setShowAddOptModal(false);
                      const updatedCats = await dispatch(fetchAdminFilters());
                      if (updatedCats.categories) {
                        const refreshed = updatedCats.categories.find(c => (c.id || c._id) === catId);
                        if (refreshed) setSelectedCatForOptions(refreshed);
                      }
                      setFilterActionMsg({ type: 'success', text: `Option "${newOptForm.name}" added successfully.` });
                      setTimeout(() => setFilterActionMsg(null), 3000);
                    } else {
                      setFilterActionMsg({ type: 'error', text: res.message || 'Failed to add option.' });
                      setTimeout(() => setFilterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Option Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Automatic, Leather Strap, Deevaaz, Heritage"
                      value={newOptForm.name}
                      onChange={(e) => setNewOptForm({ ...newOptForm, name: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={newOptForm.order}
                      onChange={(e) => setNewOptForm({ ...newOptForm, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="newOptActive"
                      checked={newOptForm.isActive}
                      onChange={(e) => setNewOptForm({ ...newOptForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="newOptActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible in Filter Sidebar)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddOptModal(false)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Add Option
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: EDIT OPTION ───────────────────────────── */}
          {editingOpt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Edit Filter Option</h3>
                  <button onClick={() => setEditingOpt(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingOpt.name.trim()) return;
                    const res = await dispatch(updateFilterOption(editingOpt.catId, editingOpt.optId, editingOpt));
                    if (res.success) {
                      setEditingOpt(null);
                      const updatedCats = await dispatch(fetchAdminFilters());
                      if (updatedCats.categories) {
                        const refreshed = updatedCats.categories.find(c => (c.id || c._id) === editingOpt.catId);
                        if (refreshed) setSelectedCatForOptions(refreshed);
                      }
                      setFilterActionMsg({ type: 'success', text: 'Option updated successfully.' });
                      setTimeout(() => setFilterActionMsg(null), 3000);
                    } else {
                      setFilterActionMsg({ type: 'error', text: res.message || 'Failed to update option.' });
                      setTimeout(() => setFilterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Option Name *</label>
                    <input
                      type="text"
                      required
                      value={editingOpt.name}
                      onChange={(e) => setEditingOpt({ ...editingOpt, name: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={editingOpt.order}
                      onChange={(e) => setEditingOpt({ ...editingOpt, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="editOptActive"
                      checked={editingOpt.isActive}
                      onChange={(e) => setEditingOpt({ ...editingOpt, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="editOptActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible in Filter Sidebar)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingOpt(null)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      
      {/* ─── TAB CONTENT: FOOTER MANAGEMENT ───────────────────────────── */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-luxury-gray border border-white/10 p-6 rounded-md">
            <div>
              <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <LayoutTemplate size={18} className="text-luxury-gold" />
                <span>{selectedSecForLinks ? `${selectedSecForLinks.title} Links` : 'Footer Management'}</span>
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {selectedSecForLinks 
                  ? `Managing footer links for ${selectedSecForLinks.title}. Changes synchronize live with the customer website.` 
                  : 'Manage customer-facing footer navigation sections and custom links. Dynamic Collections section automatically stays synchronized with Catalog Filters.'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedSecForLinks ? (
                <>
                  <button
                    onClick={() => setSelectedSecForLinks(null)}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-600 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition rounded shadow-sm hover:bg-neutral-800 flex items-center space-x-1.5 cursor-pointer"
                    style={{ backgroundColor: '#171717', color: '#ffffff', borderColor: '#525252' }}
                  >
                    <ArrowLeft size={14} style={{ color: '#ffffff' }} />
                    <span>Back to All Sections</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewLinkForm({ 
                        label: '', 
                        linkType: 'static',
                        page: 'static', 
                        url: '',
                        argsView: 'contact',
                        action: '',
                        order: (selectedSecForLinks.links?.length || 0) + 1, 
                        isActive: true 
                      });
                      setShowAddLinkModal(true);
                    }}
                    className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-black uppercase tracking-wider transition rounded shadow flex items-center space-x-1.5 cursor-pointer border border-[#d4af37]"
                    style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                  >
                    <Plus size={14} style={{ strokeWidth: 3, color: '#000000' }} />
                    <span>Add Link</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      const res = await dispatch(seedDefaultFooter());
                      if (res.success) {
                        setFooterActionMsg({ type: 'success', text: 'Default footer sections verified and active.' });
                      } else {
                        setFooterActionMsg({ type: 'error', text: res.message || 'Seeding failed.' });
                      }
                      setTimeout(() => setFooterActionMsg(null), 4000);
                    }}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-600 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition rounded shadow-sm hover:bg-neutral-800 cursor-pointer"
                    style={{ backgroundColor: '#171717', color: '#ffffff', borderColor: '#525252' }}
                  >
                    Verify / Seed Defaults
                  </button>
                  <button
                    onClick={() => {
                      setNewSecForm({ title: '', order: adminFooterSections.length + 1, isActive: true });
                      setShowAddSecModal(true);
                    }}
                    className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-black uppercase tracking-wider transition rounded shadow flex items-center space-x-1.5 cursor-pointer border border-[#d4af37]"
                    style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                  >
                    <Plus size={14} style={{ strokeWidth: 3, color: '#000000' }} />
                    <span>Add Custom Section</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Feedback Message Notification */}
          {footerActionMsg && (
            <div className={`p-4 rounded border text-xs font-bold flex items-center justify-between transition-all ${
              footerActionMsg.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' 
                : 'bg-red-950/90 border-red-500 text-red-300'
            }`}
            style={{
              backgroundColor: footerActionMsg.type === 'success' ? '#022c22' : '#450a0a',
              borderColor: footerActionMsg.type === 'success' ? '#10b981' : '#ef4444',
              color: footerActionMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
            }}>
              <span>{footerActionMsg.text}</span>
              <button onClick={() => setFooterActionMsg(null)} className="cursor-pointer text-white/60 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ─── VIEW 1: MANAGE LINKS VIEW ───────────────────────────── */}
          {selectedSecForLinks ? (
            <div className="space-y-4">
              <div className="bg-luxury-gray border border-white/10 rounded-md overflow-hidden shadow-lg">
                <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">{selectedSecForLinks.title} Links</span>
                    <span className="text-[10px] text-gray-400">({(selectedSecForLinks.links || []).length} total)</span>
                  </div>
                  <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-wider">
                    Click 'Edit' to change destination/label, or 'Disable' to hide from customers
                  </span>
                </div>

                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/20 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="p-4">Link Label</th>
                      <th className="p-4">Destination / Type</th>
                      <th className="p-4 text-center">Display Order</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(!selectedSecForLinks.links || selectedSecForLinks.links.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-500 italic space-y-2">
                          <p>No links found for this section.</p>
                          <button
                            onClick={() => {
                              setNewLinkForm({ 
                                label: '', 
                                linkType: 'static',
                                page: 'static', 
                                url: '',
                                argsView: 'contact',
                                action: '',
                                order: 1, 
                                isActive: true 
                              });
                              setShowAddLinkModal(true);
                            }}
                            className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] rounded text-xs font-extrabold cursor-pointer transition shadow border border-[#d4af37]"
                            style={{ backgroundColor: '#d4af37', color: '#000000' }}
                          >
                            + Add the first link
                          </button>
                        </td>
                      </tr>
                    ) : (
                      selectedSecForLinks.links.map((link) => {
                        const linkId = link.id || link._id;
                        let destLabel = 'Static: ' + (link.args?.view || 'view');
                        if (link.action === 'warranty' || link.label === 'Register My Watch') {
                          destLabel = 'Action: Warranty Registration';
                        } else if (link.page === 'shop') {
                          destLabel = 'Shop: ' + (link.args?.category || 'catalog');
                        } else if (link.url) {
                          destLabel = link.url;
                        }

                        return (
                          <tr key={linkId} className="hover:bg-white/[0.02] transition">
                            <td className="p-4 font-bold text-white text-sm">
                              {link.label}
                            </td>
                            <td className="p-4 text-gray-400 text-xs font-mono">
                              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[11px] text-gray-300">
                                {destLabel}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-white">
                              {link.order || 0}
                            </td>
                            <td className="p-4 text-center">
                              <span 
                                className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                                style={{
                                  backgroundColor: link.isActive ? '#022c22' : '#171717',
                                  color: link.isActive ? '#6ee7b7' : '#a3a3a3',
                                  borderColor: link.isActive ? '#10b981' : '#525252'
                                }}
                              >
                                {link.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  const secId = selectedSecForLinks.id || selectedSecForLinks._id;
                                  const availableDests = adminFooterSections.filter(
                                    s => s.type !== 'dynamic_collection' && s.slug !== 'collections' && (s.id || s._id) !== secId
                                  );
                                  const defaultDest = availableDests.length > 0 ? (availableDests[0].id || availableDests[0]._id) : '';
                                  setMovingLink({
                                    secId,
                                    linkId,
                                    label: link.label,
                                    destSecId: defaultDest
                                  });
                                }}
                                className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                style={{ backgroundColor: '#1e293b', color: '#67e8f9', borderColor: '#06b6d4' }}
                              >
                                Move
                              </button>
                              <button
                                onClick={() => {
                                  const secId = selectedSecForLinks.id || selectedSecForLinks._id;
                                  let lType = 'static';
                                  if (link.action === 'warranty') lType = 'warranty';
                                  else if (link.page === 'shop') lType = 'shop';
                                  else if (link.url) lType = 'custom';

                                  setEditingLink({
                                    secId,
                                    linkId,
                                    label: link.label,
                                    linkType: lType,
                                    page: link.page || 'static',
                                    url: link.url || '',
                                    argsView: link.args?.view || 'contact',
                                    action: link.action || '',
                                    order: link.order || 0,
                                    isActive: link.isActive
                                  });
                                }}
                                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 hover:border-white rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  const secId = selectedSecForLinks.id || selectedSecForLinks._id;
                                  const res = await dispatch(updateFooterLink(secId, linkId, { isActive: !link.isActive }));
                                  if (res.success) {
                                    const updatedSecs = await dispatch(fetchAdminFooterSections());
                                    if (updatedSecs.sections) {
                                      const refreshed = updatedSecs.sections.find(s => (s.id || s._id) === secId);
                                      if (refreshed) setSelectedSecForLinks(refreshed);
                                    }
                                    setFooterActionMsg({
                                      type: 'success',
                                      text: `Link "${link.label}" is now ${!link.isActive ? 'Active' : 'Disabled'}.`
                                    });
                                    setTimeout(() => setFooterActionMsg(null), 3000);
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border"
                                style={{
                                  backgroundColor: link.isActive ? '#451a03' : '#022c22',
                                  color: link.isActive ? '#fcd34d' : '#6ee7b7',
                                  borderColor: link.isActive ? '#f59e0b' : '#10b981',
                                }}
                              >
                                {link.isActive ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete the "${link.label}" link?`)) {
                                    const secId = selectedSecForLinks.id || selectedSecForLinks._id;
                                    const res = await dispatch(deleteFooterLink(secId, linkId));
                                    if (res.success) {
                                      const updatedSecs = await dispatch(fetchAdminFooterSections());
                                      if (updatedSecs.sections) {
                                        const refreshed = updatedSecs.sections.find(s => (s.id || s._id) === secId);
                                        if (refreshed) setSelectedSecForLinks(refreshed);
                                      }
                                      setFooterActionMsg({ type: 'success', text: `Link "${link.label}" deleted.` });
                                      setTimeout(() => setFooterActionMsg(null), 3000);
                                    } else {
                                      setFooterActionMsg({ type: 'error', text: res.message || 'Failed to delete link.' });
                                    }
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-red-950/90 border border-red-500 text-red-300 hover:bg-red-900 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                style={{ backgroundColor: '#450a0a', color: '#fca5a5', borderColor: '#ef4444' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ─── VIEW 2: ALL SECTIONS DASHBOARD ───────────────────────────── */
            <div className="space-y-4">
              <div className="bg-luxury-gray border border-white/10 rounded-md overflow-hidden shadow-lg">
                <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest">Active Footer Navigation Sections</span>
                  <span className="text-[10px] text-gray-400">Total Sections: {adminFooterSections.length}</span>
                </div>

                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/20 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="p-4">Section Title</th>
                      <th className="p-4">Section Type</th>
                      <th className="p-4 text-center">Display Order</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminFooterSections.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-400 space-y-4">
                          <p className="text-sm">No footer sections loaded from database.</p>
                          <button
                            onClick={async () => {
                              const res = await dispatch(seedDefaultFooter());
                              if (res.success) {
                                setFooterActionMsg({ type: 'success', text: 'Default footer sections initialized.' });
                              }
                            }}
                            className="px-5 py-2.5 bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-black uppercase tracking-wider rounded cursor-pointer transition shadow border border-[#d4af37]"
                            style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                          >
                            Initialize Default Footer Sections
                          </button>
                        </td>
                      </tr>
                    ) : (
                      adminFooterSections.map((sec) => {
                        const isDynamic = sec.type === 'dynamic_collection' || sec.slug === 'collections';
                        const totalLinks = (sec.links || []).length;
                        const secId = sec.id || sec._id;

                        return (
                          <tr key={secId} className="hover:bg-white/[0.02] transition">
                            <td className="p-4">
                              <div className="font-bold text-white text-sm">{sec.title}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {isDynamic 
                                  ? 'Automatically synchronizes with active Catalog Filter Collections' 
                                  : `${totalLinks} link${totalLinks !== 1 ? 's' : ''} configured`}
                              </div>
                            </td>
                            <td className="p-4">
                              {isDynamic ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-amber-950/80 border border-amber-500 text-amber-300">
                                  Dynamic Catalog Collection
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-800 border border-neutral-600 text-neutral-300">
                                  Custom Section
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-white">
                              {sec.order || 0}
                            </td>
                            <td className="p-4 text-center">
                              <span 
                                className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                                style={{
                                  backgroundColor: sec.isActive ? '#022c22' : '#171717',
                                  color: sec.isActive ? '#6ee7b7' : '#a3a3a3',
                                  borderColor: sec.isActive ? '#10b981' : '#525252'
                                }}
                              >
                                {sec.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {isDynamic ? (
                                <>
                                  <button
                                    onClick={() => setActiveTab('filters')}
                                    className="px-3.5 py-1.5 bg-[#d4af37] text-black hover:bg-[#e5c158] rounded text-[11px] font-black uppercase tracking-wider transition cursor-pointer shadow-sm border border-[#d4af37]"
                                    style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                                  >
                                    Manage Collections
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSec({
                                        id: secId,
                                        title: sec.title,
                                        order: sec.order || 0,
                                        isActive: sec.isActive
                                      });
                                    }}
                                    className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 hover:border-white rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                    style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const res = await dispatch(updateFooterSection(secId, { isActive: !sec.isActive }));
                                      if (res.success) {
                                        setFooterActionMsg({
                                          type: 'success',
                                          text: `Section "${sec.title}" is now ${!sec.isActive ? 'Active' : 'Disabled'}.`
                                        });
                                        setTimeout(() => setFooterActionMsg(null), 3000);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border"
                                    style={{
                                      backgroundColor: sec.isActive ? '#451a03' : '#022c22',
                                      color: sec.isActive ? '#fcd34d' : '#6ee7b7',
                                      borderColor: sec.isActive ? '#f59e0b' : '#10b981',
                                    }}
                                  >
                                    {sec.isActive ? 'Disable' : 'Enable'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setSelectedSecForLinks(sec)}
                                    className="px-3.5 py-1.5 bg-[#d4af37] text-black hover:bg-[#e5c158] rounded text-[11px] font-black uppercase tracking-wider transition cursor-pointer shadow-sm border border-[#d4af37]"
                                    style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                                  >
                                    Manage Links
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSec({
                                        id: secId,
                                        title: sec.title,
                                        order: sec.order || 0,
                                        isActive: sec.isActive
                                      });
                                    }}
                                    className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 hover:border-white rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                    style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const res = await dispatch(updateFooterSection(secId, { isActive: !sec.isActive }));
                                      if (res.success) {
                                        setFooterActionMsg({
                                          type: 'success',
                                          text: `Section "${sec.title}" is now ${!sec.isActive ? 'Active' : 'Disabled'}.`
                                        });
                                        setTimeout(() => setFooterActionMsg(null), 3000);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border"
                                    style={{
                                      backgroundColor: sec.isActive ? '#451a03' : '#022c22',
                                      color: sec.isActive ? '#fcd34d' : '#6ee7b7',
                                      borderColor: sec.isActive ? '#f59e0b' : '#10b981',
                                    }}
                                  >
                                    {sec.isActive ? 'Disable' : 'Enable'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const linksCount = (sec.links || []).length;
                                      if (linksCount > 0) {
                                        const eligibleDests = adminFooterSections.filter(
                                          s => s.type !== 'dynamic_collection' && s.slug !== 'collections' && (s.id || s._id) !== secId
                                        );
                                        setDeleteSecPrompt({
                                          secId,
                                          title: sec.title,
                                          linksCount,
                                          eligibleDests,
                                          destSecId: eligibleDests.length > 0 ? (eligibleDests[0].id || eligibleDests[0]._id) : ''
                                        });
                                      } else {
                                        if (window.confirm(`Are you sure you want to delete the "${sec.title}" footer section?`)) {
                                          dispatch(deleteFooterSection(secId)).then(res => {
                                            if (res.success) {
                                              setFooterActionMsg({ type: 'success', text: `Section "${sec.title}" deleted.` });
                                            } else {
                                              setFooterActionMsg({ type: 'error', text: res.message || 'Failed to delete section.' });
                                            }
                                            setTimeout(() => setFooterActionMsg(null), 3000);
                                          });
                                        }
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-red-950/90 border border-red-500 text-red-300 hover:bg-red-900 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                    style={{ backgroundColor: '#450a0a', color: '#fca5a5', borderColor: '#ef4444' }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── MODAL: ADD FOOTER SECTION ───────────────────────────── */}
          {showAddSecModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Add Custom Footer Section</h3>
                  <button onClick={() => setShowAddSecModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newSecForm.title.trim()) return;
                    const res = await dispatch(createFooterSection(newSecForm));
                    if (res.success) {
                      setShowAddSecModal(false);
                      setFooterActionMsg({ type: 'success', text: `Section "${newSecForm.title}" created successfully.` });
                      setTimeout(() => setFooterActionMsg(null), 4000);
                    } else {
                      setFooterActionMsg({ type: 'error', text: res.message || 'Failed to create footer section.' });
                      setTimeout(() => setFooterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Section Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Customer Care, About KHRONIQ"
                      value={newSecForm.title}
                      onChange={(e) => setNewSecForm({ ...newSecForm, title: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={newSecForm.order}
                      onChange={(e) => setNewSecForm({ ...newSecForm, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="newSecActive"
                      checked={newSecForm.isActive}
                      onChange={(e) => setNewSecForm({ ...newSecForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="newSecActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible on Customer Footer)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddSecModal(false)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Create Section
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: EDIT FOOTER SECTION ───────────────────────────── */}
          {editingSec && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Edit Footer Section</h3>
                  <button onClick={() => setEditingSec(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingSec.title.trim()) return;
                    const res = await dispatch(updateFooterSection(editingSec.id, editingSec));
                    if (res.success) {
                      setEditingSec(null);
                      setFooterActionMsg({ type: 'success', text: 'Footer section updated successfully.' });
                      setTimeout(() => setFooterActionMsg(null), 3000);
                    } else {
                      setFooterActionMsg({ type: 'error', text: res.message || 'Failed to update section.' });
                      setTimeout(() => setFooterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Section Title *</label>
                    <input
                      type="text"
                      required
                      value={editingSec.title}
                      onChange={(e) => setEditingSec({ ...editingSec, title: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={editingSec.order}
                      onChange={(e) => setEditingSec({ ...editingSec, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="editSecActive"
                      checked={editingSec.isActive}
                      onChange={(e) => setEditingSec({ ...editingSec, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="editSecActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible on Customer Footer)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingSec(null)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: ADD FOOTER LINK ───────────────────────────── */}
          {showAddLinkModal && selectedSecForLinks && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">
                    Add Link to {selectedSecForLinks.title}
                  </h3>
                  <button onClick={() => setShowAddLinkModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newLinkForm.label.trim()) return;

                    const secId = selectedSecForLinks.id || selectedSecForLinks._id;
                    const payload = {
                      label: newLinkForm.label.trim(),
                      order: Number(newLinkForm.order) || 0,
                      isActive: Boolean(newLinkForm.isActive)
                    };

                    if (newLinkForm.linkType === 'warranty') {
                      payload.action = 'warranty';
                      payload.page = 'static';
                    } else if (newLinkForm.linkType === 'shop') {
                      payload.page = 'shop';
                      payload.args = { category: newLinkForm.url || 'all' };
                    } else if (newLinkForm.linkType === 'custom') {
                      payload.url = newLinkForm.url.trim();
                      payload.page = 'custom';
                    } else {
                      payload.page = 'static';
                      payload.args = { view: newLinkForm.argsView || 'contact' };
                    }

                    const res = await dispatch(createFooterLink(secId, payload));
                    if (res.success) {
                      setShowAddLinkModal(false);
                      const updatedSecs = await dispatch(fetchAdminFooterSections());
                      if (updatedSecs.sections) {
                        const refreshed = updatedSecs.sections.find(s => (s.id || s._id) === secId);
                        if (refreshed) setSelectedSecForLinks(refreshed);
                      }
                      setFooterActionMsg({ type: 'success', text: `Link "${newLinkForm.label}" added successfully.` });
                      setTimeout(() => setFooterActionMsg(null), 3000);
                    } else {
                      setFooterActionMsg({ type: 'error', text: res.message || 'Failed to add link.' });
                      setTimeout(() => setFooterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Link Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Shipping Policy, Contact Us"
                      value={newLinkForm.label}
                      onChange={(e) => setNewLinkForm({ ...newLinkForm, label: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Link Type / Destination</label>
                    <select
                      value={newLinkForm.linkType}
                      onChange={(e) => setNewLinkForm({ ...newLinkForm, linkType: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="static">Static Policy / Info Page</option>
                      <option value="warranty">Watch Warranty Registration Action</option>
                      <option value="shop">Shop Category Page</option>
                      <option value="custom">Custom URL / External Link</option>
                    </select>
                  </div>

                  {newLinkForm.linkType === 'static' && (
                    <div className="space-y-1">
                      <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Target Page View</label>
                      <select
                        value={newLinkForm.argsView}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, argsView: e.target.value })}
                        className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                      >
                        <option value="contact">Contact & Appointment</option>
                        <option value="about">About & Heritage</option>
                        <option value="privacy">Privacy Policy</option>
                        <option value="shipping">Shipping Policy</option>
                        <option value="warranty">Warranty Policy</option>
                        <option value="refund">Refund Policy</option>
                        <option value="exchange">Replacement Policy</option>
                        <option value="cancellation">Cancellation Policy</option>
                        <option value="repair">Repair & Service</option>
                        <option value="blogs">Blogs & Editorial</option>
                        <option value="faq">FAQ</option>
                        <option value="gifting">Gifting Policy</option>
                        <option value="cod">COD Policy</option>
                        <option value="cookie">Cookie Policy</option>
                        <option value="community">Community Guidelines</option>
                      </select>
                    </div>
                  )}

                  {(newLinkForm.linkType === 'custom' || newLinkForm.linkType === 'shop') && (
                    <div className="space-y-1">
                      <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">
                        {newLinkForm.linkType === 'shop' ? 'Shop Category Filter' : 'Custom URL'}
                      </label>
                      <input
                        type="text"
                        placeholder={newLinkForm.linkType === 'shop' ? 'e.g., deevaaz, classic, all' : 'e.g., https://instagram.com/...'}
                        value={newLinkForm.url}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, url: e.target.value })}
                        className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={newLinkForm.order}
                      onChange={(e) => setNewLinkForm({ ...newLinkForm, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="newLinkActive"
                      checked={newLinkForm.isActive}
                      onChange={(e) => setNewLinkForm({ ...newLinkForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="newLinkActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible in Footer)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddLinkModal(false)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Add Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: EDIT FOOTER LINK ───────────────────────────── */}
          {editingLink && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Edit Footer Link</h3>
                  <button onClick={() => setEditingLink(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingLink.label.trim()) return;

                    const payload = {
                      label: editingLink.label.trim(),
                      order: Number(editingLink.order) || 0,
                      isActive: Boolean(editingLink.isActive)
                    };

                    if (editingLink.linkType === 'warranty') {
                      payload.action = 'warranty';
                      payload.page = 'static';
                      payload.url = '';
                      payload.args = null;
                    } else if (editingLink.linkType === 'shop') {
                      payload.page = 'shop';
                      payload.args = { category: editingLink.url || 'all' };
                      payload.action = '';
                    } else if (editingLink.linkType === 'custom') {
                      payload.url = editingLink.url.trim();
                      payload.page = 'custom';
                      payload.action = '';
                    } else {
                      payload.page = 'static';
                      payload.args = { view: editingLink.argsView || 'contact' };
                      payload.action = '';
                    }

                    const res = await dispatch(updateFooterLink(editingLink.secId, editingLink.linkId, payload));
                    if (res.success) {
                      setEditingLink(null);
                      const updatedSecs = await dispatch(fetchAdminFooterSections());
                      if (updatedSecs.sections) {
                        const refreshed = updatedSecs.sections.find(s => (s.id || s._id) === editingLink.secId);
                        if (refreshed) setSelectedSecForLinks(refreshed);
                      }
                      setFooterActionMsg({ type: 'success', text: 'Link updated successfully.' });
                      setTimeout(() => setFooterActionMsg(null), 3000);
                    } else {
                      setFooterActionMsg({ type: 'error', text: res.message || 'Failed to update link.' });
                      setTimeout(() => setFooterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Link Label *</label>
                    <input
                      type="text"
                      required
                      value={editingLink.label}
                      onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Link Type / Destination</label>
                    <select
                      value={editingLink.linkType}
                      onChange={(e) => setEditingLink({ ...editingLink, linkType: e.target.value })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="static">Static Policy / Info Page</option>
                      <option value="warranty">Watch Warranty Registration Action</option>
                      <option value="shop">Shop Category Page</option>
                      <option value="custom">Custom URL / External Link</option>
                    </select>
                  </div>

                  {editingLink.linkType === 'static' && (
                    <div className="space-y-1">
                      <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Target Page View</label>
                      <select
                        value={editingLink.argsView}
                        onChange={(e) => setEditingLink({ ...editingLink, argsView: e.target.value })}
                        className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                      >
                        <option value="contact">Contact & Appointment</option>
                        <option value="about">About & Heritage</option>
                        <option value="privacy">Privacy Policy</option>
                        <option value="shipping">Shipping Policy</option>
                        <option value="warranty">Warranty Policy</option>
                        <option value="refund">Refund Policy</option>
                        <option value="exchange">Replacement Policy</option>
                        <option value="cancellation">Cancellation Policy</option>
                        <option value="repair">Repair & Service</option>
                        <option value="blogs">Blogs & Editorial</option>
                        <option value="faq">FAQ</option>
                        <option value="gifting">Gifting Policy</option>
                        <option value="cod">COD Policy</option>
                        <option value="cookie">Cookie Policy</option>
                        <option value="community">Community Guidelines</option>
                      </select>
                    </div>
                  )}

                  {(editingLink.linkType === 'custom' || editingLink.linkType === 'shop') && (
                    <div className="space-y-1">
                      <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">
                        {editingLink.linkType === 'shop' ? 'Shop Category Filter' : 'Custom URL'}
                      </label>
                      <input
                        type="text"
                        placeholder={editingLink.linkType === 'shop' ? 'e.g., deevaaz, classic, all' : 'e.g., https://instagram.com/...'}
                        value={editingLink.url}
                        onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                        className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Display Order</label>
                    <input
                      type="number"
                      value={editingLink.order}
                      onChange={(e) => setEditingLink({ ...editingLink, order: Number(e.target.value) })}
                      className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="editLinkActive"
                      checked={editingLink.isActive}
                      onChange={(e) => setEditingLink({ ...editingLink, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-luxury-gray text-luxury-gold cursor-pointer"
                    />
                    <label htmlFor="editLinkActive" className="text-gray-300 text-xs cursor-pointer select-none">
                      Active (Visible in Footer)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingLink(null)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}


      
          {/* ─── MODAL: MOVE FOOTER LINK ───────────────────────────── */}
          {movingLink && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-white/10 p-6 rounded-md w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Move Footer Link</h3>
                  <button onClick={() => setMovingLink(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!movingLink.destSecId) {
                      setFooterActionMsg({ type: 'error', text: 'Please select a destination section.' });
                      return;
                    }
                    const res = await dispatch(moveFooterLink(movingLink.secId, movingLink.linkId, movingLink.destSecId));
                    if (res.success) {
                      const updatedSecs = await dispatch(fetchAdminFooterSections());
                      if (updatedSecs.sections && selectedSecForLinks) {
                        const currentSecId = selectedSecForLinks.id || selectedSecForLinks._id;
                        const refreshed = updatedSecs.sections.find(s => (s.id || s._id) === currentSecId);
                        if (refreshed) setSelectedSecForLinks(refreshed);
                      }
                      setMovingLink(null);
                      setFooterActionMsg({
                        type: 'success',
                        text: res.message || `Link "${movingLink.label}" moved successfully.`
                      });
                      setTimeout(() => setFooterActionMsg(null), 4000);
                    } else {
                      setFooterActionMsg({ type: 'error', text: res.message || 'Failed to move footer link.' });
                      setTimeout(() => setFooterActionMsg(null), 5000);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Link to Move</label>
                    <div className="px-3 py-2 bg-neutral-900 border border-white/20 rounded text-white font-bold">
                      {movingLink.label}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold">Destination Section *</label>
                    {adminFooterSections.filter(
                      s => s.type !== 'dynamic_collection' && s.slug !== 'collections' && (s.id || s._id) !== movingLink.secId
                    ).length === 0 ? (
                      <div className="p-3 bg-red-950/60 border border-red-500 text-red-300 text-xs rounded">
                        No other eligible custom sections available. Create another section first to move this link.
                      </div>
                    ) : (
                      <select
                        value={movingLink.destSecId}
                        onChange={(e) => setMovingLink({ ...movingLink, destSecId: e.target.value })}
                        required
                        className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold cursor-pointer"
                      >
                        {adminFooterSections
                          .filter(s => s.type !== 'dynamic_collection' && s.slug !== 'collections' && (s.id || s._id) !== movingLink.secId)
                          .map(destSec => {
                            const dId = destSec.id || destSec._id;
                            return (
                              <option key={dId} value={dId}>
                                {destSec.title} ({destSec.links?.length || 0} existing links)
                              </option>
                            );
                          })}
                      </select>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400">
                    The link will be safely removed from the current section and appended to the selected destination section.
                  </p>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setMovingLink(null)}
                      className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!movingLink.destSecId}
                      className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#e5c158] border border-[#d4af37] disabled:opacity-50 rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
                      style={{ backgroundColor: '#d4af37', color: '#000000', borderColor: '#d4af37', fontWeight: 900 }}
                    >
                      Move Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── MODAL: SECTION DELETION SAFETY ───────────────────────────── */}
          {deleteSecPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-luxury-dark border border-amber-500/40 p-6 rounded-md w-full max-w-lg space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center space-x-2 text-amber-400">
                    <AlertTriangle size={16} />
                    <span>Section Deletion Safety Confirmation</span>
                  </h3>
                  <button onClick={() => setDeleteSecPrompt(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-gray-300">
                  <p className="font-semibold text-white">
                    The section <span className="text-luxury-gold font-bold">"{deleteSecPrompt.title}"</span> contains <span className="text-white font-bold">{deleteSecPrompt.linksCount} custom link{deleteSecPrompt.linksCount !== 1 ? 's' : ''}</span>.
                  </p>
                  <p className="text-gray-400">
                    To prevent accidental loss of footer links, choose whether to move all links to another section or delete them with the section:
                  </p>

                  {deleteSecPrompt.eligibleDests && deleteSecPrompt.eligibleDests.length > 0 && (
                    <div className="p-4 bg-black/40 border border-white/10 rounded space-y-3">
                      <label className="text-gray-300 uppercase tracking-wider text-[10px] font-bold block">
                        Option 1: Move links to another section
                      </label>
                      <select
                        value={deleteSecPrompt.destSecId}
                        onChange={(e) => setDeleteSecPrompt({ ...deleteSecPrompt, destSecId: e.target.value })}
                        className="w-full bg-luxury-gray border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-luxury-gold cursor-pointer"
                      >
                        {deleteSecPrompt.eligibleDests.map(d => {
                          const dId = d.id || d._id;
                          return (
                            <option key={dId} value={dId}>
                              {d.title} ({d.links?.length || 0} existing links)
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!deleteSecPrompt.destSecId) return;
                          const moveRes = await dispatch(moveAllFooterLinks(deleteSecPrompt.secId, deleteSecPrompt.destSecId));
                          if (moveRes.success) {
                            const delRes = await dispatch(deleteFooterSection(deleteSecPrompt.secId));
                            if (delRes.success) {
                              setDeleteSecPrompt(null);
                              setFooterActionMsg({
                                type: 'success',
                                text: `Links moved safely and section "${deleteSecPrompt.title}" deleted.`
                              });
                              setTimeout(() => setFooterActionMsg(null), 4000);
                            }
                          } else {
                            setFooterActionMsg({ type: 'error', text: moveRes.message || 'Failed to move links.' });
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow transition border border-blue-400"
                      >
                        Move Links & Delete Section
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-red-950/40 border border-red-500/40 rounded space-y-2">
                    <label className="text-red-300 uppercase tracking-wider text-[10px] font-bold block">
                      Option 2: Delete section and all its links
                    </label>
                    <p className="text-[11px] text-red-200/80">
                      All {deleteSecPrompt.linksCount} links inside this section will be permanently deleted from the database.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const delRes = await dispatch(deleteFooterSection(deleteSecPrompt.secId));
                        if (delRes.success) {
                          setDeleteSecPrompt(null);
                          setFooterActionMsg({
                            type: 'success',
                            text: `Section "${deleteSecPrompt.title}" and its links were deleted.`
                          });
                          setTimeout(() => setFooterActionMsg(null), 3000);
                        } else {
                          setFooterActionMsg({ type: 'error', text: delRes.message || 'Failed to delete section.' });
                        }
                      }}
                      className="w-full px-4 py-2 bg-red-900/80 hover:bg-red-800 border border-red-500 text-red-200 rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow transition"
                    >
                      Delete Section & All Links
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeleteSecPrompt(null)}
                    className="px-4 py-2 bg-neutral-800 border border-neutral-600 hover:border-white text-white hover:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#262626', color: '#ffffff', borderColor: '#525252' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}


      
            {/* ─── TAB CONTENT: LOGIN ACTIVITY & SESSIONS ───────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div 
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-neutral-200 p-6 rounded-lg shadow-sm"
            style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
          >
            <div>
              <h3 
                className="font-serif text-lg font-bold text-neutral-900 uppercase tracking-wider flex items-center space-x-2"
                style={{ color: '#111827' }}
              >
                <ShieldCheck size={20} className="text-[#b45309]" style={{ color: '#b45309' }} />
                <span>Admin Login Activity & Sessions</span>
              </h3>
              <p className="text-neutral-600 text-xs mt-1" style={{ color: '#4b5563' }}>
                Monitor active administrator devices, review recent sign-in security events, and remotely revoke untrusted sessions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await dispatch(fetchActiveSessions());
                  await dispatch(fetchLoginActivity());
                  setSessionActionMsg({ type: 'success', text: 'Activity and active sessions refreshed.' });
                  setTimeout(() => setSessionActionMsg(null), 3000);
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition rounded shadow-sm cursor-pointer border border-neutral-800"
                style={{ backgroundColor: '#111827', color: '#ffffff', borderColor: '#1f2937' }}
              >
                Refresh Activity
              </button>
              <button
                type="button"
                onClick={() => setShowRevokeAllModal(true)}
                disabled={activeSessions.filter(s => !s.isCurrent && s.sessionId !== currentSessionId).length === 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wider transition rounded shadow-sm flex items-center space-x-1.5 cursor-pointer border border-red-700"
                style={{
                  backgroundColor: activeSessions.filter(s => !s.isCurrent && s.sessionId !== currentSessionId).length === 0 ? '#e5e7eb' : '#dc2626',
                  color: activeSessions.filter(s => !s.isCurrent && s.sessionId !== currentSessionId).length === 0 ? '#9ca3af' : '#ffffff',
                  borderColor: activeSessions.filter(s => !s.isCurrent && s.sessionId !== currentSessionId).length === 0 ? '#d1d5db' : '#b91c1c'
                }}
              >
                <LogOut size={14} />
                <span>Log Out All Other Sessions</span>
              </button>
            </div>
          </div>

          {/* Feedback Message Notification */}
          {sessionActionMsg && (
            <div
              className={`p-4 rounded-lg border text-xs font-bold flex items-center justify-between transition-all shadow-sm ${
                sessionActionMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
              style={{
                backgroundColor: sessionActionMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                borderColor: sessionActionMsg.type === 'success' ? '#86efac' : '#fca5a5',
                color: sessionActionMsg.type === 'success' ? '#166534' : '#991b1b'
              }}
            >
              <span>{sessionActionMsg.text}</span>
              <button 
                type="button" 
                onClick={() => setSessionActionMsg(null)} 
                className="cursor-pointer text-neutral-500 hover:text-neutral-800"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ─── SECTION 1: ACTIVE SESSIONS ───────────────────────────── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-200 pb-3">
              <div>
                <h4 
                  className="text-neutral-900 text-sm font-bold uppercase tracking-wider flex items-center space-x-2"
                  style={{ color: '#111827' }}
                >
                  <span>Active Sessions</span>
                  <span className="text-xs font-mono font-bold text-[#b45309]" style={{ color: '#b45309' }}>
                    ({activeSessions.length})
                  </span>
                </h4>
                <p className="text-neutral-600 text-xs mt-0.5" style={{ color: '#4b5563' }}>
                  Devices currently authorized to access the Admin Control Center.
                </p>
              </div>
            </div>

            {activeSessions.length === 0 ? (
              <div 
                className="p-8 text-center bg-white border border-neutral-200 rounded-lg text-neutral-500 text-xs italic shadow-sm"
                style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#6b7280' }}
              >
                No other active sessions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSessions.map((session) => {
                  const isCurrent = Boolean(session.isCurrent || (currentSessionId && currentSessionId === session.sessionId));
                  const formatTime = (ts) => {
                    if (!ts) return 'Recently';
                    const d = new Date(ts);
                    if (isNaN(d.getTime())) return String(ts);
                    const now = new Date();
                    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                    const isToday = d.toDateString() === now.toDateString();
                    const tStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (isToday) return `Today, ${tStr}`;
                    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${tStr}`;
                  };

                  return (
                    <div
                      key={session.sessionId}
                      className="p-5 rounded-lg border flex flex-col justify-between space-y-4 transition shadow-sm"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: isCurrent ? '#059669' : '#e5e7eb',
                        borderWidth: isCurrent ? '2px' : '1px',
                        boxShadow: isCurrent ? '0 1px 3px 0 rgba(5, 150, 105, 0.15)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-2.5 rounded border flex items-center justify-center shadow-xs"
                              style={{
                                backgroundColor: isCurrent ? '#ecfdf5' : '#f3f4f6',
                                borderColor: isCurrent ? '#a7f3d0' : '#e5e7eb',
                                color: isCurrent ? '#047857' : '#1f2937'
                              }}
                            >
                              {session.deviceType === 'Mobile' ? (
                                <Smartphone size={22} style={{ color: isCurrent ? '#047857' : '#1f2937' }} />
                              ) : session.deviceType === 'Tablet' ? (
                                <Tablet size={22} style={{ color: isCurrent ? '#047857' : '#1f2937' }} />
                              ) : (
                                <Monitor size={22} style={{ color: isCurrent ? '#047857' : '#1f2937' }} />
                              )}
                            </div>
                            <div>
                              <div 
                                className="font-bold text-base tracking-tight"
                                style={{ color: '#111827' }}
                              >
                                {session.browser} · {session.os}
                              </div>
                              <div 
                                className="text-xs flex items-center space-x-1 mt-0.5 font-medium"
                                style={{ color: '#4b5563' }}
                              >
                                <Globe size={12} style={{ color: '#6b7280' }} />
                                <span>{session.location || 'India / approximate location'}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isCurrent ? (
                              <span 
                                className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border shadow-xs"
                                style={{ 
                                  backgroundColor: '#dcfce7', 
                                  color: '#15803d', 
                                  borderColor: '#86efac' 
                                }}
                              >
                                CURRENT DEVICE
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shadow-xs"
                                style={{ 
                                  backgroundColor: '#f3f4f6', 
                                  color: '#374151', 
                                  borderColor: '#d1d5db' 
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metadata Box: IP, Method, Last Active */}
                        <div 
                          className="grid grid-cols-2 gap-2 text-xs p-3.5 rounded border font-mono"
                          style={{
                            backgroundColor: '#f9fafb',
                            borderColor: '#e5e7eb'
                          }}
                        >
                          <div>
                            <span 
                              className="text-[10px] uppercase block font-sans font-bold"
                              style={{ color: '#6b7280' }}
                            >
                              IP Address
                            </span>
                            <span 
                              className="font-bold text-xs"
                              style={{ color: '#111827' }}
                            >
                              {session.ip || '127.0.0.1'}
                            </span>
                          </div>
                          <div>
                            <span 
                              className="text-[10px] uppercase block font-sans font-bold"
                              style={{ color: '#6b7280' }}
                            >
                              Login Method
                            </span>
                            <span 
                              className="font-medium text-xs"
                              style={{ color: '#111827' }}
                            >
                              {session.loginMethod || 'Password + OTP'}
                            </span>
                          </div>
                          <div 
                            className="col-span-2 pt-2 mt-1 border-t flex justify-between items-center"
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <span 
                              className="text-[11px] font-sans font-semibold"
                              style={{ color: '#4b5563' }}
                            >
                              Last Active:
                            </span>
                            <span 
                              className="font-bold text-xs"
                              style={{ color: '#b45309' }}
                            >
                              {formatTime(session.lastActiveAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        {isCurrent ? (
                          <div 
                            className="px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider border select-none flex items-center space-x-1"
                            style={{ 
                              backgroundColor: '#f0fdf4', 
                              color: '#15803d', 
                              borderColor: '#bbf7d0' 
                            }}
                          >
                            <span>[ THIS DEVICE ]</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevokingSession(session)}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer shadow-sm border border-red-700"
                            style={{ 
                              backgroundColor: '#dc2626', 
                              color: '#ffffff', 
                              borderColor: '#b91c1c' 
                            }}
                          >
                            [ LOG OUT ]
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── SECTION 2: RECENT LOGIN ACTIVITY / AUDIT LOG ───────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 
                  className="text-neutral-900 text-sm font-bold uppercase tracking-wider flex items-center space-x-2"
                  style={{ color: '#111827' }}
                >
                  <span>Recent Login Activity & Security Events</span>
                  <span className="text-xs font-mono font-bold text-neutral-500" style={{ color: '#6b7280' }}>
                    ({loginActivities.length})
                  </span>
                </h4>
                <p className="text-neutral-600 text-xs mt-0.5" style={{ color: '#4b5563' }}>
                  Complete historical record of successful administrative sign-ins and failed authentication attempts.
                </p>
              </div>
            </div>

            <div 
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm"
              style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead 
                    className="text-[10px] font-bold uppercase tracking-widest border-b"
                    style={{ backgroundColor: '#f3f4f6', color: '#4b5563', borderColor: '#e5e7eb' }}
                  >
                    <tr>
                      <th className="p-4">Status</th>
                      <th className="p-4">Device & Browser</th>
                      <th className="p-4">Location / IP</th>
                      <th className="p-4">Login Method</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200" style={{ borderColor: '#e5e7eb' }}>
                    {loginActivities.length === 0 ? (
                      <tr>
                        <td 
                          colSpan={5} 
                          className="p-12 text-center text-neutral-500 italic"
                          style={{ color: '#6b7280' }}
                        >
                          No login activity yet.
                        </td>
                      </tr>
                    ) : (
                      loginActivities.map((activity) => {
                        const isSuccess = activity.status === 'successful';
                        const formatTs = (ts) => {
                          if (!ts) return '-';
                          const d = new Date(ts);
                          if (isNaN(d.getTime())) return String(ts);
                          const now = new Date();
                          const isToday = d.toDateString() === now.toDateString();
                          const tStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          if (isToday) return `Today, ${tStr}`;
                          return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${tStr}`;
                        };

                        return (
                          <tr 
                            key={activity.id || activity._id} 
                            className="hover:bg-neutral-50 transition"
                          >
                            <td className="p-4">
                              {isSuccess ? (
                                <span 
                                  className="inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border shadow-xs"
                                  style={{ 
                                    backgroundColor: '#dcfce7', 
                                    color: '#15803d', 
                                    borderColor: '#86efac' 
                                  }}
                                >
                                  SUCCESSFUL
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span 
                                    className="inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border shadow-xs"
                                    style={{ 
                                      backgroundColor: '#fee2e2', 
                                      color: '#b91c1c', 
                                      borderColor: '#fca5a5' 
                                    }}
                                  >
                                    FAILED
                                  </span>
                                  {activity.failureReason && (
                                    <div 
                                      className="text-[10px] font-semibold"
                                      style={{ color: '#dc2626' }}
                                    >
                                      {activity.failureReason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div 
                                className="font-bold text-sm"
                                style={{ color: '#111827' }}
                              >
                                {activity.browser} · {activity.os}
                              </div>
                              <div 
                                className="text-[11px] mt-0.5 font-medium"
                                style={{ color: '#6b7280' }}
                              >
                                Device: {activity.deviceType || 'Desktop'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div 
                                className="font-medium"
                                style={{ color: '#374151' }}
                              >
                                {activity.location || 'India / approximate location'}
                              </div>
                              <div 
                                className="text-[11px] font-mono mt-0.5"
                                style={{ color: '#6b7280' }}
                              >
                                IP: {activity.ip || '127.0.0.1'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div 
                                className="font-medium"
                                style={{ color: '#374151' }}
                              >
                                {activity.loginMethod || 'Password + OTP'}
                              </div>
                              {activity.logoutAt && (
                                <div 
                                  className="text-[10px] mt-0.5 font-mono font-bold"
                                  style={{ color: '#b45309' }}
                                >
                                  Logged out: {formatTs(activity.logoutAt)}
                                </div>
                              )}
                            </td>
                            <td 
                              className="p-4 text-right font-mono font-medium"
                              style={{ color: '#374151' }}
                            >
                              {formatTs(activity.timestamp)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ─── MODAL: LOG OUT SPECIFIC SESSION ───────────────────────────── */}
          {revokingSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div 
                className="bg-white border border-neutral-200 p-6 rounded-lg w-full max-w-md space-y-4 shadow-2xl"
                style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
              >
                <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                  <h3 
                    className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2"
                    style={{ color: '#dc2626' }}
                  >
                    <LogOut size={16} />
                    <span>Log Out Device</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setRevokingSession(null)} 
                    className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="font-semibold text-sm" style={{ color: '#111827' }}>
                    Log out this device session?
                  </p>
                  <div 
                    className="border p-3.5 rounded space-y-1.5 font-mono text-xs"
                    style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                  >
                    <div><span className="font-sans font-bold" style={{ color: '#6b7280' }}>Device:</span> <span className="font-bold" style={{ color: '#111827' }}>{revokingSession.browser} · {revokingSession.os}</span></div>
                    <div><span className="font-sans font-bold" style={{ color: '#6b7280' }}>Location:</span> <span style={{ color: '#374151' }}>{revokingSession.location}</span></div>
                    <div><span className="font-sans font-bold" style={{ color: '#6b7280' }}>IP Address:</span> <span style={{ color: '#374151' }}>{revokingSession.ip}</span></div>
                  </div>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    This session will be revoked immediately on the server and the affected device will lose access to administrative features.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setRevokingSession(null)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs border border-neutral-300"
                    style={{ backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await dispatch(revokeAdminSession(revokingSession.sessionId));
                      if (res.success) {
                        setRevokingSession(null);
                        setSessionActionMsg({ type: 'success', text: 'Session logged out successfully.' });
                        setTimeout(() => setSessionActionMsg(null), 3000);
                      } else {
                        setSessionActionMsg({ type: 'error', text: res.message || 'Unable to revoke this session.' });
                        setTimeout(() => setSessionActionMsg(null), 4000);
                      }
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs border border-red-700"
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#b91c1c' }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── MODAL: LOG OUT ALL OTHER SESSIONS ───────────────────────────── */}
          {showRevokeAllModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div 
                className="bg-white border border-amber-300 p-6 rounded-lg w-full max-w-md space-y-4 shadow-2xl"
                style={{ backgroundColor: '#ffffff', borderColor: '#fcd34d' }}
              >
                <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                  <h3 
                    className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2"
                    style={{ color: '#b45309' }}
                  >
                    <AlertTriangle size={16} />
                    <span>Log Out All Other Sessions</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setShowRevokeAllModal(false)} 
                    className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="font-semibold text-sm" style={{ color: '#111827' }}>
                    Log out all other active sessions?
                  </p>
                  <p style={{ color: '#4b5563' }}>
                    Your current device will remain logged in, while all other devices and browser sessions will be immediately invalidated and signed out.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setShowRevokeAllModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs border border-neutral-300"
                    style={{ backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await dispatch(revokeAllOtherSessions());
                      if (res.success) {
                        setShowRevokeAllModal(false);
                        setSessionActionMsg({ type: 'success', text: 'All other sessions have been logged out.' });
                        setTimeout(() => setSessionActionMsg(null), 3000);
                      } else {
                        setSessionActionMsg({ type: 'error', text: res.message || 'Unable to revoke other sessions.' });
                        setTimeout(() => setSessionActionMsg(null), 4000);
                      }
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs border border-red-700"
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#b91c1c' }}
                  >
                    Log Out Other Sessions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* --- TAB CONTENT: ANALYTICS --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gross Sales Revenue</span>
<p className="text-2xl font-extrabold text-white">{formatPrice(analytics?.totalRevenue ?? totalSales, currentCurrency)}</p>
              <span className="text-[9px] text-gray-500 font-light">Excludes cancelled orders</span>
            </div>
            
            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Orders</span>
              <p className="text-2xl font-extrabold text-white">{analytics?.totalOrders ?? totalOrdersCount}</p>
              <span className="text-[9px] text-gray-500 font-light">All status types included</span>
            </div>

            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Out of Stock Watches</span>
              <p className="text-2xl font-extrabold text-white flex items-center space-x-2">
                <span>{analytics?.outOfStockCount ?? outOfStockCount}</span>
                {(analytics?.outOfStockCount ?? outOfStockCount) > 0 && <AlertTriangle size={18} className="text-luxury-red animate-pulse" />}
              </p>
              <span className="text-[9px] text-gray-500">Requires production triggers</span>
            </div>

            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Low Stock Alerts</span>
              <p className="text-2xl font-extrabold text-white">{analytics?.lowStockProducts?.length ?? 0}</p>
              <span className="text-[9px] text-gray-500">Products under 5 units</span>
            </div>
          </div>

          {/* Sales by Category Chart (real data) */}
          <div className="bg-luxury-gray border border-white/5 p-6 sm:p-8 rounded-md space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Sales by Category</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Real revenue breakdown by watch collection</p>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 px-2.5 py-1 tracking-widest uppercase rounded">
                Live Data
              </span>
            </div>

{/* Custom Interactive SVG Graph */}
            <div className="relative pt-4 flex flex-col items-center w-full min-h-[380px]">
              <svg width="100%" height="350" viewBox="0 0 600 350" className="overflow-visible font-sans">
                {/* Horizontal Guide Lines */}
                <line x1="55" y1="50" x2="550" y2="50" stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
                <line x1="55" y1="133" x2="550" y2="133" stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
                <line x1="55" y1="216" x2="550" y2="216" stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
                <line x1="55" y1="300" x2="550" y2="300" stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />

                {/* Axes */}
                <line x1="55" y1="300" x2="550" y2="300" stroke="#000000" strokeWidth="1.5" />
                <line x1="55" y1="50" x2="55" y2="300" stroke="#000000" strokeWidth="1.5" />

                {/* Bars - Mocking Category Sales: Khronomaster, Defy, Heritage, Elite */}
                {categories.map((cat, idx) => {
                  const val = displaySales[cat] || 0;
                  const barHeight = (val / maxVal) * 250;
                  const yPos = 300 - barHeight;
                  const xPos = 90 + idx * 120;

                  // Color palette: Gold, Red, Emerald Green, Charcoal
                  const colors = ['#c5a880', '#ef4444', '#065f46', '#4b5563'];
                  const barColor = colors[idx % colors.length];

                  return (
                    <g key={cat} className="group cursor-pointer">
                      {/* Hover value tooltip tag */}
                      <rect
                        x={xPos - 11}
                        y={yPos - 22}
                        width="70"
                        height="16"
                        rx="2"
                        fill="#000000"
                        stroke="rgba(255,255,255,0.1)"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                      <text
                        x={xPos + 24}
                        y={yPos - 11}
                        fill="#c5a880"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        {formatPrice(val, currentCurrency)}
                      </text>

                      {/* The Bar */}
                      <rect
                        x={xPos}
                        y={yPos}
                        width="48"
                        height={barHeight}
                        fill={barColor}
                        opacity="0.8"
                        rx="2"
                        className="group-hover:opacity-100 transition duration-200"
                      />

                      {/* Display value on top of bar */}
                      <text
                        x={xPos + 24}
                        y={yPos - 6}
                        fill="#000000"
                        fontSize="8"
                        textAnchor="middle"
                        className="font-mono font-bold"
                      >
                        {formatPrice(val, currentCurrency)}
                      </text>
                    </g>
                  );
                })}

                {/* Y-axis Labels */}
                <text x="47" y="54" fill="#000000" fontSize="8" textAnchor="end" className="font-bold">{formatPrice(maxVal, currentCurrency)}</text>
                <text x="47" y="137" fill="#000000" fontSize="8" textAnchor="end" className="font-bold">{formatPrice(maxVal * 0.66, currentCurrency)}</text>
                <text x="47" y="220" fill="#000000" fontSize="8" textAnchor="end" className="font-bold">{formatPrice(maxVal * 0.33, currentCurrency)}</text>
                <text x="47" y="304" fill="#000000" fontSize="8" textAnchor="end" className="font-bold">{formatPrice(0, currentCurrency)}</text>

                {/* X-axis Labels */}
                {categories.map((cat, idx) => (
                  <text
                    key={cat}
                    x={114 + idx * 120}
                    y="322"
                    fill="#000000"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {cat.toUpperCase()}
                  </text>
                ))}
              </svg>
            </div>
            </div>
            {/* Best Sellers & Low Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">Best Selling Timepieces</h3>
              {!analytics || analytics.bestSellers.length === 0 ? (
                <p className="text-gray-500 text-xs italic">No sales yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.bestSellers.map((item, idx) => (
                    <div key={item._id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300"><span className="text-luxury-gold font-bold mr-2">#{idx + 1}</span>{item.name}</span>
                      <span className="text-white font-semibold">{item.totalQuantity} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">Low Stock Warning</h3>
              {!analytics || analytics.lowStockProducts.length === 0 ? (
                <p className="text-gray-500 text-xs italic">All products sufficiently stocked.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.lowStockProducts.map((item) => (
                    <div key={item._id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">{item.name}</span>
                      <span className={`font-bold ${item.stock === 0 ? 'text-luxury-red' : 'text-yellow-400'}`}>
                        {item.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
          
      )}

      {/* --- TAB CONTENT: INVENTORY MANAGER (CRUD) --- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          
          {/* Header & Add Button */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Watch Database</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadInventoryCSV}
                className="px-4 py-2 bg-luxury-gold/10 hover:bg-luxury-gold/20 border-black text-black text-[10px] font-black tracking-widest uppercase rounded flex items-center gap-2 cursor-pointer transition"
              >
                <Download size={13} />
                Export Serial & Claim Codes (CSV)
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-white hover:bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Timepiece</span>
              </button>
            </div>
          </div>

          {/* Add Form Drawer */}
          {showAddForm && (
            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">New Timepiece Profile</h4>
              
              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Watch Name</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="Khroniq Classic Sport"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Model No.</label>
                  <input
                    type="text"
                    value={newProduct.modelNo || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, modelNo: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="KHQ-CLS-01"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Serial No. (Optional)</label>
                  <input
                    type="text"
                    value={newProduct.serialNo || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, serialNo: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="Auto-generated if left blank"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Unique Code (Optional)</label>
                  <input
                    type="text"
                    value={newProduct.uniqueCode || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, uniqueCode: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="Auto-generated if left blank"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="4500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Stock Count</label>
                    <input
                      type="number"
                      required
                      value={newProduct.stock}
                      onChange={(e) => {
  const count = Math.max(0, Number(e.target.value) || 0);
  const current = newProduct.unitCodes || [];
  const resized = count <= current.length
    ? current.slice(0, count)
    : [...current, ...Array(count - current.length).fill(null).map(() => ({ serialNumber: '', claimCode: '' }))];
  setNewProduct({ ...newProduct, stock: e.target.value, unitCodes: resized });
}}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="8"
                    />
                  </div>
                  {newProduct.unitCodes.length > 0 && (
                    <div className="col-span-full space-y-2">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">
                        Serial Numbers & Claim Codes ({newProduct.unitCodes.length})
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {newProduct.unitCodes.map((code, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-luxury-dark border border-white/10 rounded p-2">
                            <span className="text-[10px] text-gray-500 w-6">#{idx + 1}</span>
                            <input
                              type="text"
                              placeholder="Serial Number (blank = auto)"
                              value={code.serialNumber}
                              onChange={(e) => {
                                const updated = [...newProduct.unitCodes];
                                updated[idx] = { ...updated[idx], serialNumber: e.target.value };
                                setNewProduct({ ...newProduct, unitCodes: updated });
                              }}
                              className="flex-1 bg-black border border-white/10 rounded text-white text-[10px] font-mono p-2 focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Claim Code (blank = auto)"
                              value={code.claimCode}
                              onChange={(e) => {
                                const updated = [...newProduct.unitCodes];
                                updated[idx] = { ...updated[idx], claimCode: e.target.value };
                                setNewProduct({ ...newProduct, unitCodes: updated });
                              }}
                              className="flex-1 bg-black border border-white/10 rounded text-white text-[10px] font-mono p-2 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...newProduct.unitCodes];
                                updated[idx] = generateUnitCodePair();
                                setNewProduct({ ...newProduct, unitCodes: updated });
                              }}
                              className="px-2 py-2 bg-luxury-gold/10 hover:bg-luxury-gold/20 border border-luxury-gold/30 text-luxury-gold text-[9px] font-black uppercase rounded cursor-pointer whitespace-nowrap"
                            >
                              Auto-Generate
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProduct.discountPercent}
                      onChange={(e) => setNewProduct({ ...newProduct, discountPercent: Number(e.target.value) })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Warranty Period (Months)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.warrantyMonths}
                      onChange={(e) => setNewProduct({ ...newProduct, warrantyMonths: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Badge</label>
                    <select
                      value={newProduct.badgeMode || 'none'}
                      onChange={(e) => {
                        const mode = e.target.value;
                        setNewProduct({
                          ...newProduct,
                          badgeMode: mode,
                          badge: mode === 'none' ? '' : mode === 'custom' ? '' : mode
                        });
                      }}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    >
                      <option value="none">None</option>
                      <option value="New">New</option>
                      <option value="Limited Edition">Limited Edition</option>
                      <option value="Bestseller">Bestseller</option>
                      <option value="custom">Custom text…</option>
                    </select>
                    {newProduct.badgeMode === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom badge text"
                        value={newProduct.badge}
                        onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 mt-1.5 focus:outline-none focus:border-luxury-gold"
                      />
                    )}
                  </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Collection / Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                  >
                    {dynamicCollectionOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    {newProduct.category && !dynamicCollectionOptions.some(o => o.value.toLowerCase() === String(newProduct.category).toLowerCase()) && (
                      <option value={newProduct.category}>{newProduct.category}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Target Gender</label>
                  <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                  >
                    <option value="men">Men's watches</option>
                    <option value="women">Women's watches</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Watch Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-black text-xs p-2.5 focus:outline-none file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:bg-luxury-gold file:text-luxury-dark file:font-bold file:uppercase file:cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Or enter image path/URL manually (e.g. /assets/watch_red.jpg)"
                    value={newProduct.image || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 mt-1.5 focus:outline-none focus:border-luxury-gold"
                  />
                  {uploadingImage && <p className="text-[10px] text-luxury-gold">Uploading image...</p>}
                  {newProduct.image && !uploadingImage && (
                    <img src={newProduct.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded border border-white/10" />
                  )}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Product Description</label>
                  <textarea
                    rows="3"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="Enter full descriptive paragraphs..."
                  />
                </div>

                {/* Technical Specifications */}
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block border-t border-white/5 pt-3">Technical Specifications</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'movement',       label: 'Movement',        ph: 'Automatic Chronometer' },
                      { key: 'case',           label: 'Case Dimensions', ph: 'Stainless Steel (40mm)' },
                      { key: 'dialColor',      label: 'Dial Color',      ph: 'Black' },
                      { key: 'caseMaterial',   label: 'Case Material',   ph: 'Stainless Steel' },
                      { key: 'strap',          label: 'Strap Material',  ph: 'Leather' },
                      { key: 'waterResistance',label: 'Water Resistance', ph: '50m' },
                      { key: 'glass',          label: 'Dial Glass',      ph: 'Sapphire Crystal' },
                      { key: 'watchFunction',  label: 'Function',        ph: 'Hours, Minutes, Seconds' },
                      { key: 'collection',     label: 'Collection',      ph: 'Classic' },
                      { key: 'warrantyDetails',label: 'Warranty Details', ph: 'Manufacturer Warranty' },
                    ].map(({ key, label, ph }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[8px] text-black font-bold uppercase tracking-widest block">{label}</label>
                        <input
                          type="text"
                          placeholder={ph}
                          value={newProduct.specs?.[key] || ''}
                          onChange={(e) => setNewProduct({ ...newProduct, specs: { ...newProduct.specs, [key]: e.target.value } })}
                          className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <label className="text-[8px] text-black font-bold uppercase tracking-widest block">Warranty Period</label>
                      <div className="w-full bg-white/5 border border-white/10 rounded text-gray-400 text-xs p-2">
                        {formatWarrantyPeriod(newProduct.warrantyMonths)}
                      </div>
                      <p className="text-[8px] text-gray-500">Auto-generated from Warranty (Months) above</p>
                    </div>
                  </div>
                </div>

                {/* Customizable Toggle for New Product */}
                <div className="md:col-span-2 flex flex-col bg-luxury-dark border border-white/10 rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white">Customizable</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Show in Bespoke Atelier / Customization tab</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !newProduct.customizable;
                        setNewProduct({ 
                          ...newProduct, 
                          customizable: val,
                          allowStrapCustomization: val ? (newProduct.allowStrapCustomization ?? true) : false,
                          allowCaseCustomization: val ? (newProduct.allowCaseCustomization ?? true) : false,
                          allowDialCustomization: val ? (newProduct.allowDialCustomization ?? true) : false
                        });
                      }}
                      className={`w-12 h-6 rounded-full transition-all duration-300 cursor-pointer relative ${
                        newProduct.customizable ? 'bg-[#047857]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                        newProduct.customizable ? 'left-6' : 'left-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Checkboxes shown ONLY when Customizable is checked */}
                  {newProduct.customizable && (
                    <div className="pt-2 border-t border-white/5 space-y-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold mb-1">Tailoring Capabilities</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            id="newAllowStrapCustomization"
                            checked={newProduct.allowStrapCustomization ?? true}
                            onChange={(e) => setNewProduct({ ...newProduct, allowStrapCustomization: e.target.checked })}
                            className="w-4 h-4 accent-luxury-gold cursor-pointer"
                          />
                          <label htmlFor="newAllowStrapCustomization" className="text-xs text-black cursor-pointer select-none">
                            Allow Strap Customization
                          </label>
                        </div>
                        {newProduct.allowStrapCustomization && (
                          <div className="pl-6 space-y-3 border-l border-white/10 my-2">
                            {/* Preset Straps Selectors (Multiple Checkboxes) */}
                            <div className="space-y-1.5">
                              <label className="text-[8px] text-black font-bold uppercase tracking-wider block">Enable Preset Straps</label>
                              <div className="grid grid-cols-2 gap-2">
                                {PRESET_STRAPS.map(s => {
                                  const isChecked = (newProduct.customizationOptions?.strapMaterials || []).includes(s.name);
                                  return (
                                    <label key={s.name} className="flex items-center space-x-2 p-1.5 rounded border border-white/5 bg-luxury-dark/85 cursor-pointer hover:border-white/10 select-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleStrapCheckboxChange(s.name, false)}
                                        className="w-3.5 h-3.5 accent-luxury-gold cursor-pointer"
                                      />
                                      <img src={s.image} alt={s.name} className="w-6 h-6 object-contain rounded" />
                                      <span className="text-[10px] text-gray-300 font-medium">{s.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Multiple Custom Straps Addition */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                              <label className="text-[9px] text-luxury-gold font-bold uppercase tracking-wider block">Add Custom Straps</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Strap Name..."
                                  value={tempStrapName}
                                  onChange={(e) => setTempStrapName(e.target.value)}
                                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleTempStrapImageChange}
                                  className="text-[10px] text-black file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white/10 file:text-black hover:file:bg-white/20 cursor-pointer"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddCustomStrap(false)}
                                className="w-full py-1.5 bg-luxury-gold hover:bg-neutral-100 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer"
                              >
                                Add Strap Option
                              </button>

                              {/* Added Custom Straps List */}
                              {((newProduct.customizationOptions?.customStraps || []).length > 0) && (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin mt-2">
                                  {(newProduct.customizationOptions.customStraps).map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-black/35 p-1.5 rounded border border-white/5">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={true}
                                          onChange={() => handleRemoveCustomStrap(idx, false)}
                                          className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                                          title="Uncheck to remove"
                                        />
                                        <img src={s.image} alt={s.name} className="w-6 h-6 object-contain rounded bg-white/5" />
                                        <span className="text-[9px] text-gray-300 font-medium">{s.name}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCustomStrap(idx, false)}
                                        className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            id="newAllowCaseCustomization"
                            checked={newProduct.allowCaseCustomization ?? true}
                            onChange={(e) => setNewProduct({ ...newProduct, allowCaseCustomization: e.target.checked })}
                            className="w-4 h-4 accent-luxury-gold cursor-pointer"
                          />
                          <label htmlFor="newAllowCaseCustomization" className="text-xs text-black cursor-pointer select-none">
                            Allow Case Finish Customization
                          </label>
                        </div>
                        {newProduct.allowCaseCustomization && (
                          <div className="pl-6 space-y-2 border-l border-white/10 my-2">
                            {/* Multiple Custom Cases Addition */}
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-luxury-gold font-bold uppercase tracking-wider block">Add Custom Case Finish (Optional)</label>
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  placeholder="Finish Name (e.g. Matte Gold)..."
                                  value={tempCaseName}
                                  onChange={(e) => setTempCaseName(e.target.value)}
                                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                />
                                <input
                                  type="number"
                                  placeholder="Price modifier ($)..."
                                  value={tempCasePrice}
                                  onChange={(e) => setTempCasePrice(e.target.value)}
                                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                />
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={tempCaseColor}
                                    onChange={(e) => setTempCaseColor(e.target.value)}
                                    className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                                  />
                                  <span className="text-[10px] text-gray-300 font-mono">{tempCaseColor}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddCustomCase(false)}
                                className="w-full py-1.5 bg-luxury-gold hover:bg-neutral-100 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer"
                              >
                                Add Case Option
                              </button>

                              {/* Added Custom Cases List */}
                              {((newProduct.customizationOptions?.customCases || []).length > 0) && (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin mt-2">
                                  {(newProduct.customizationOptions.customCases).map((c, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-black/35 p-1.5 rounded border border-white/5">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={true}
                                          onChange={() => handleRemoveCustomCase(idx, false)}
                                          className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                                          title="Uncheck to remove"
                                        />
                                        <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c.color }} />
                                        <span className="text-[9px] text-gray-300 font-medium">{c.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] text-gray-400 font-mono">+${c.price || 0}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomCase(idx, false)}
                                          className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            id="newAllowDialCustomization"
                            checked={newProduct.allowDialCustomization ?? true}
                            onChange={(e) => setNewProduct({ ...newProduct, allowDialCustomization: e.target.checked })}
                            className="w-4 h-4 accent-luxury-gold cursor-pointer"
                          />
                          <label htmlFor="newAllowDialCustomization" className="text-xs text-black cursor-pointer select-none">
                            Allow Dial Color Customization
                          </label>
                        </div>
                        {newProduct.allowDialCustomization && (
                          <div className="pl-6 space-y-1.5 border-l border-white/10 my-2">
                            <label className="text-[8px] text-black font-bold uppercase tracking-wider block font-sans">Available Dial Colors</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {DIAL_COLOR_PRESETS.map(color => {
                                const isChecked = (newProduct.customizationOptions?.dialColors || []).includes(color.hex);
                                return (
                                  <label key={color.hex} className="flex items-center space-x-2 p-1.5 rounded border border-white/5 bg-luxury-dark/80 cursor-pointer hover:border-white/10 select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleDialColorCheckboxChange(color.hex, false)}
                                      className="w-3.5 h-3.5 accent-luxury-gold cursor-pointer"
                                    />
                                    <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: color.hex }} />
                                    <span className="text-[10px] text-gray-300 font-medium">{color.name}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {/* Add Custom Dial Color */}
                            <div className="space-y-1.5 pt-2 border-t border-white/5">
                              <label className="text-[9px] text-luxury-gold font-bold uppercase tracking-wider block">Add Custom Dial Color (Optional)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={tempDialColor}
                                    onChange={(e) => setTempDialColor(e.target.value)}
                                    className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                                  />
                                  <span className="text-[10px] text-gray-300 font-mono">{tempDialColor}</span>
                                </div>
                                <input
                                  type="number"
                                  placeholder="Price modifier ($)..."
                                  value={tempDialPrice}
                                  onChange={(e) => setTempDialPrice(e.target.value)}
                                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddCustomDialColor(false)}
                                className="w-full py-1.5 bg-luxury-gold hover:bg-neutral-100 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer"
                              >
                                Add Dial Color
                              </button>
                              {((newProduct.customizationOptions?.dialColors || []).filter(hex => !DIAL_COLOR_PRESETS.some(p => p.hex === hex)).length > 0) && (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin mt-2">
                                  {(newProduct.customizationOptions.dialColors || []).filter(hex => !DIAL_COLOR_PRESETS.some(p => p.hex === hex)).map((hex, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-black/35 p-1.5 rounded border border-white/5">
                                      <div className="flex items-center space-x-2">
                                        <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: hex }} />
                                        <span className="text-[9px] text-gray-300 font-mono">{hex}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] text-gray-400 font-mono">+${newProduct.customizationOptions?.dialPrices?.[hex] || 0}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomDialColor(hex, false)}
                                          className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-3 bg-black border border-white/10 font-bold text-xs tracking-widest uppercase hover:bg-neutral-900 transition"
                  style={{ color: '#ffffff' }}
                >
                  Save Timepiece to Stock
                </button>
              </form>
            </div>
          )}

          {/* Edit Form Modal (Visible only when editingId !== null) */}
          {editingId && editForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-luxury-gray border border-white/5 p-6 sm:p-8 rounded-md w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Modify Watch Details</h4>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Watch Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Model No.</label>
                      <input
                        type="text"
                        value={editForm.modelNo || ''}
                        onChange={(e) => setEditForm({ ...editForm, modelNo: e.target.value })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                        placeholder="KHQ-CLS-01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Serial No.</label>
                      <input
                        type="text"
                        value={editForm.serialNo || ''}
                        onChange={(e) => setEditForm({ ...editForm, serialNo: e.target.value })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                        placeholder="KHQ-2026-XXXXXX"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Unique Code</label>
                      <input
                        type="text"
                        value={editForm.uniqueCode || ''}
                        onChange={(e) => setEditForm({ ...editForm, uniqueCode: e.target.value })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                        placeholder="CLM-XXXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Stock</label>
                      <input
                        type="number"
                        required
                        value={editForm.stock}
                        onChange={(e) => {
  const newCount = Math.max(0, Number(e.target.value) || 0);
  const unusedExisting = (editForm.existingUnitCodes || []).filter(c => !c.used).length;
  let newUnitCodes = editForm.newUnitCodes || [];
  if (newCount > unusedExisting) {
    const needed = newCount - unusedExisting;
    newUnitCodes = needed > newUnitCodes.length
      ? [...newUnitCodes, ...Array(needed - newUnitCodes.length).fill(null).map(() => ({ serialNumber: '', claimCode: '' }))]
      : newUnitCodes.slice(0, needed);
  } else {
    newUnitCodes = [];
  }
  setEditForm({ ...editForm, stock: e.target.value, newUnitCodes });
}}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                      />
                    </div>

{editForm.existingUnitCodes?.length > 0 && (
                      <div className="col-span-full space-y-1.5">
                        <label className="text-[9px] text-black font-bold uppercase tracking-widest block">
                          Existing Codes ({editForm.existingUnitCodes.length})
                        </label>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {editForm.existingUnitCodes.map((code, idx) => (
                            <div key={idx} className="flex gap-2 items-center text-[10px] font-mono bg-black/30 border border-white/5 rounded p-1.5 text-gray-400">
                              <span className="w-6">#{idx + 1}</span>
                              <span className="flex-1 truncate">{code.serialNumber}</span>
                              <span className="flex-1 truncate">{code.claimCode}</span>
                              <span className={`text-[9px] font-bold uppercase ${code.used ? 'text-luxury-red' : 'text-emerald-500'}`}>
                                {code.used ? 'Sold' : 'Available'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {editForm.newUnitCodes?.length > 0 && (
                      <div className="col-span-full space-y-2">
                        <label className="text-[9px] text-black font-bold uppercase tracking-widest block">
                          New Units to Add ({editForm.newUnitCodes.length})
                        </label>
                        <div className="space-y-2">
                          {editForm.newUnitCodes.map((code, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-luxury-dark border border-white/10 rounded p-2">
                              <input
                                type="text"
                                placeholder="Serial Number (blank = auto)"
                                value={code.serialNumber}
                                onChange={(e) => {
                                  const updated = [...editForm.newUnitCodes];
                                  updated[idx] = { ...updated[idx], serialNumber: e.target.value };
                                  setEditForm({ ...editForm, newUnitCodes: updated });
                                }}
                                className="flex-1 bg-black border border-white/10 rounded text-white text-[10px] font-mono p-2 focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Claim Code (blank = auto)"
                                value={code.claimCode}
                                onChange={(e) => {
                                  const updated = [...editForm.newUnitCodes];
                                  updated[idx] = { ...updated[idx], claimCode: e.target.value };
                                  setEditForm({ ...editForm, newUnitCodes: updated });
                                }}
                                className="flex-1 bg-black border border-white/10 rounded text-white text-[10px] font-mono p-2 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editForm.newUnitCodes];
                                  updated[idx] = generateUnitCodePair();
                                  setEditForm({ ...editForm, newUnitCodes: updated });
                                }}
                                className="px-2 py-2 bg-luxury-gold/10 hover:bg-luxury-gold/20 border border-luxury-gold/30 text-luxury-gold text-[9px] font-black uppercase rounded cursor-pointer whitespace-nowrap"
                              >
                                Auto-Generate
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.discountPercent}
                        onChange={(e) => setEditForm({ ...editForm, discountPercent: Number(e.target.value) })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Warranty Period (Months)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editForm.warrantyMonths}
                        onChange={(e) => setEditForm({ ...editForm, warrantyMonths: Number(e.target.value) })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                      />
                    </div>
                  </div>


<div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Badge</label>
                    <select
                      value={editForm.badgeMode || 'none'}
                      onChange={(e) => {
                        const mode = e.target.value;
                        setEditForm({
                          ...editForm,
                          badgeMode: mode,
                          badge: mode === 'none' ? '' : mode === 'custom' ? '' : mode
                        });
                      }}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    >
                      <option value="none">None</option>
                      <option value="New">New</option>
                      <option value="Limited Edition">Limited Edition</option>
                      <option value="Bestseller">Bestseller</option>
                      <option value="custom">Custom text…</option>
                    </select>
                    {editForm.badgeMode === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom badge text"
                        value={editForm.badge}
                        onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                        className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 mt-1.5 focus:outline-none focus:border-luxury-gold"
                      />
                    )}
                  </div>
                  

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Collection</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                    >
                      {dynamicCollectionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      {editForm.category && !dynamicCollectionOptions.some(o => o.value.toLowerCase() === String(editForm.category).toLowerCase()) && (
                        <option value={editForm.category}>{editForm.category}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Target Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                    >
                      <option value="men">Men's watches</option>
                      <option value="women">Women's watches</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Watch Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-black text-xs p-2.5 focus:outline-none file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:bg-luxury-gold file:text-luxury-dark file:font-bold file:uppercase file:cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Or enter image path/URL manually (e.g. /assets/watch_red.jpg)"
                      value={editForm.image || ''}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 mt-1.5 focus:outline-none focus:border-luxury-gold"
                    />
                    {uploadingImage && <p className="text-[10px] text-luxury-gold">Uploading image...</p>}
                    {editForm.image && !uploadingImage && (
                      <img src={editForm.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded border border-white/10" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Description</label>
                    <textarea
                      rows="3"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                    />
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-3">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block border-t border-white/5 pt-3">Technical Specifications</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'movement',        label: 'Movement',         ph: 'Automatic Chronometer' },
                        { key: 'case',            label: 'Case Dimensions',  ph: 'Stainless Steel (40mm)' },
                        { key: 'dialColor',       label: 'Dial Color',       ph: 'Black' },
                        { key: 'caseMaterial',    label: 'Case Material',    ph: 'Stainless Steel' },
                        { key: 'strap',           label: 'Strap Material',   ph: 'Leather' },
                        { key: 'waterResistance', label: 'Water Resistance', ph: '50m' },
                        { key: 'glass',           label: 'Dial Glass',       ph: 'Sapphire Crystal' },
                        { key: 'watchFunction',   label: 'Function',         ph: 'Hours, Minutes, Seconds' },
                        { key: 'collection',      label: 'Collection',       ph: 'Classic' },
                        { key: 'warrantyDetails', label: 'Warranty Details', ph: 'Manufacturer Warranty' },
                      ].map(({ key, label, ph }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[8px] text-black font-bold uppercase tracking-widest block">{label}</label>
                          <input
                            type="text"
                            placeholder={ph}
                            value={editForm.specs?.[key] || ''}
                            onChange={(e) => setEditForm({ ...editForm, specs: { ...editForm.specs, [key]: e.target.value } })}
                            className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2 focus:outline-none focus:border-luxury-gold"
                          />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="text-[8px] text-black font-bold uppercase tracking-widest block">Warranty Period</label>
                        <div className="w-full bg-white/5 border border-white/10 rounded text-gray-400 text-xs p-2">
                          {formatWarrantyPeriod(editForm.warrantyMonths)}
                        </div>
                        <p className="text-[8px] text-gray-500">Auto-generated from Warranty (Months) above</p>
                      </div>
                    </div>
                  </div>

                  {/* Customizable Toggle */}
                  <div className="flex flex-col bg-luxury-dark border border-white/10 rounded p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white">Customizable</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Show in Bespoke Atelier / Customization tab</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = !editForm.customizable;
                          setEditForm({ 
                            ...editForm, 
                            customizable: val,
                            allowStrapCustomization: val ? (editForm.allowStrapCustomization ?? true) : false,
                            allowCaseCustomization: val ? (editForm.allowCaseCustomization ?? true) : false,
                            allowDialCustomization: val ? (editForm.allowDialCustomization ?? true) : false
                          });
                        }}
                        className={`w-12 h-6 rounded-full transition-all duration-300 cursor-pointer relative ${
                          editForm.customizable ? 'bg-[#047857]' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                          editForm.customizable ? 'left-6' : 'left-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Checkboxes shown ONLY when Customizable is checked */}
                    {editForm.customizable && (
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold mb-1">Tailoring Capabilities</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              id="allowStrapCustomization"
                              checked={editForm.allowStrapCustomization ?? true}
                              onChange={(e) => setEditForm({ ...editForm, allowStrapCustomization: e.target.checked })}
                              className="w-4 h-4 accent-luxury-gold cursor-pointer"
                            />
                            <label htmlFor="allowStrapCustomization" className="text-xs text-black cursor-pointer select-none">
                              Allow Strap Customization
                            </label>
                          </div>
                          {editForm.allowStrapCustomization && (
                            <div className="pl-6 space-y-3 border-l border-white/10 my-2">
                              {/* Preset Straps Selectors (Multiple Checkboxes) */}
                              <div className="space-y-1.5">
                                <label className="text-[8px] text-black font-bold uppercase tracking-wider block">Enable Preset Straps</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {PRESET_STRAPS.map(s => {
                                    const isChecked = (editForm.customizationOptions?.strapMaterials || []).includes(s.name);
                                    return (
                                      <label key={s.name} className="flex items-center space-x-2 p-1.5 rounded border border-white/5 bg-luxury-dark/85 cursor-pointer hover:border-white/10 select-none">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleStrapCheckboxChange(s.name, true)}
                                          className="w-3.5 h-3.5 accent-luxury-gold cursor-pointer"
                                        />
                                        <img src={s.image} alt={s.name} className="w-6 h-6 object-contain rounded" />
                                        <span className="text-[10px] text-gray-300 font-medium">{s.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Multiple Custom Straps Addition */}
                              <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[9px] text-luxury-gold font-bold uppercase tracking-wider block">Add Custom Straps</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Strap Name..."
                                    value={tempStrapName}
                                    onChange={(e) => setTempStrapName(e.target.value)}
                                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                  />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleTempStrapImageChange}
                                    className="text-[10px] text-black file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white/10 file:text-black hover:file:bg-white/20 cursor-pointer"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomStrap(true)}
                                  className="w-full py-1.5 bg-luxury-gold hover:bg-neutral-100 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer"
                                >
                                  Add Strap Option
                                </button>

                                {/* Added Custom Straps List */}
                                {((editForm.customizationOptions?.customStraps || []).length > 0) && (
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin mt-2">
                                    {(editForm.customizationOptions.customStraps).map((s, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-black/35 p-1.5 rounded border border-white/5">
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => handleRemoveCustomStrap(idx, true)}
                                            className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                                            title="Uncheck to remove"
                                          />
                                          <img src={s.image} alt={s.name} className="w-6 h-6 object-contain rounded bg-white/5" />
                                          <span className="text-[9px] text-gray-300 font-medium">{s.name}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomStrap(idx, true)}
                                          className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              id="allowCaseCustomization"
                              checked={editForm.allowCaseCustomization ?? true}
                              onChange={(e) => setEditForm({ ...editForm, allowCaseCustomization: e.target.checked })}
                              className="w-4 h-4 accent-luxury-gold cursor-pointer"
                            />
                            <label htmlFor="allowCaseCustomization" className="text-xs text-black cursor-pointer select-none">
                              Allow Case Finish Customization
                            </label>
                          </div>
                           {editForm.allowCaseCustomization && (
                            <div className="pl-6 space-y-2 border-l border-white/10 my-2">
                              {/* Multiple Custom Cases Addition */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-luxury-gold font-bold uppercase tracking-wider block">Add Custom Case Finish (Optional)</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Finish Name (e.g. Matte Gold)..."
                                    value={tempCaseName}
                                    onChange={(e) => setTempCaseName(e.target.value)}
                                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price modifier ($)..."
                                    value={tempCasePrice}
                                    onChange={(e) => setTempCasePrice(e.target.value)}
                                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="color"
                                      value={tempCaseColor}
                                      onChange={(e) => setTempCaseColor(e.target.value)}
                                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-300 font-mono">{tempCaseColor}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomCase(true)}
                                  className="w-full py-1.5 bg-luxury-gold hover:bg-neutral-100 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer"
                                >
                                  Add Case Option
                                </button>

                                {/* Added Custom Cases List */}
                                {((editForm.customizationOptions?.customCases || []).length > 0) && (
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin mt-2">
                                    {(editForm.customizationOptions.customCases).map((c, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-black/35 p-1.5 rounded border border-white/5">
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => handleRemoveCustomCase(idx, true)}
                                            className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                                            title="Uncheck to remove"
                                          />
                                          <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c.color }} />
                                          <span className="text-[9px] text-gray-300 font-medium">{c.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-[9px] text-gray-400 font-mono">+${c.price || 0}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomCase(idx, true)}
                                            className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              id="allowDialCustomization"
                              checked={editForm.allowDialCustomization ?? true}
                              onChange={(e) => setEditForm({ ...editForm, allowDialCustomization: e.target.checked })}
                              className="w-4 h-4 accent-luxury-gold cursor-pointer"
                            />
                            <label htmlFor="allowDialCustomization" className="text-xs text-black cursor-pointer select-none">
                              Allow Dial Color Customization
                            </label>
                          </div>
                          {editForm.allowDialCustomization && (
                            <div className="pl-6 space-y-1.5 border-l border-white/10 my-2">
                              <label className="text-[8px] text-black font-bold uppercase tracking-wider block font-sans">Available Dial Colors</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {DIAL_COLOR_PRESETS.map(color => {
                                  const isChecked = (editForm.customizationOptions?.dialColors || []).includes(color.hex);
                                  return (
                                    <label key={color.hex} className="flex items-center space-x-2 p-1.5 rounded border border-white/5 bg-luxury-dark/80 cursor-pointer hover:border-white/10 select-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleDialColorCheckboxChange(color.hex, true)}
                                        className="w-3.5 h-3.5 accent-luxury-gold cursor-pointer"
                                      />
                                      <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: color.hex }} />
                                      <span className="text-[10px] text-gray-300 font-medium">{color.name}</span>
                                    </label>
                                  );
                                })}
                                
                              </div>

                              {/* Add Custom Dial Color */}
                              <div className="space-y-1.5 pt-2 border-t border-white/5">
                                <label className="text-[9px] text-luxury-gold font-bold uppercase tracking-wider block">Add Custom Dial Color (Optional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="color"
                                      value={tempDialColor}
                                      onChange={(e) => setTempDialColor(e.target.value)}
                                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-300 font-mono">{tempDialColor}</span>
                                  </div>
                                  <input
                                    type="number"
                                    placeholder="Price modifier ($)..."
                                    value={tempDialPrice}
                                    onChange={(e) => setTempDialPrice(e.target.value)}
                                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-1.5 focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomDialColor(true)}
                                  className="w-full py-1.5 bg-luxury-gold hover:bg-neutral-100 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer"
                                >
                                  Add Dial Color
                                </button>
                                {((editForm.customizationOptions?.dialColors || []).filter(hex => !DIAL_COLOR_PRESETS.some(p => p.hex === hex)).length > 0) && (
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin mt-2">
                                    {(editForm.customizationOptions.dialColors || []).filter(hex => !DIAL_COLOR_PRESETS.some(p => p.hex === hex)).map((hex, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-black/35 p-1.5 rounded border border-white/5">
                                        <div className="flex items-center space-x-2">
                                          <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: hex }} />
                                          <span className="text-[9px] text-gray-300 font-mono">{hex}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-[9px] text-gray-400 font-mono">+${editForm.customizationOptions?.dialPrices?.[hex] || 0}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCustomDialColor(hex, true)}
                                            className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="py-2.5 border border-white/10 text-white font-semibold uppercase hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 bg-black border border-white/10 font-bold uppercase hover:bg-neutral-900 transition"
                      style={{ color: '#ffffff' }}
                    >
                      Save Modifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-luxury-gray border border-white/5 rounded-md overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-luxury-dark border-b border-white/5 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                <tr>
                  <th className="p-4">Watch Profile</th>
                  <th className="p-4">Collection</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="h-10 w-10 bg-luxury-dark border border-white/5 p-1 rounded flex items-center justify-center">
                        <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <span className="font-semibold text-white truncate max-w-xs block">{p.name}</span>
                        {p.customizable && (
                          <span className="text-[8px] text-luxury-gold font-black uppercase tracking-widest border border-luxury-gold/30 px-1.5 py-0.5 rounded-sm">
                            ✦ Customizable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 uppercase tracking-wider text-[10px] text-gray-400">{p.category}</td>
                    <td className="p-4 font-bold text-white">
                      {p.discountPercent > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[10px] line-through text-red-400">{formatPrice(p.price, currentCurrency)}</span>
                          <span>{formatPrice(getDiscountedPrice(p), currentCurrency)}</span>
                        </div>
                      ) : (
                        formatPrice(p.price, currentCurrency)
                      )}
                    </td>
                    <td className="p-4 text-[11px] text-red-500 font-semibold uppercase tracking-widest">
                      {p.discountPercent > 0 ? `${p.discountPercent}%` : '—'}
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-black font-black px-2.5 py-1 rounded border border-white/10 text-[10px] tracking-wider uppercase" style={{ color: '#ffffff' }}>
                        {p.stock === 0 ? 'SOLD OUT' : `${p.stock} units`}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditProductInit(p)}
                        className="p-1.5 bg-white/5 border border-white/10 hover:border-luxury-gold hover:text-luxury-gold text-gray-400 rounded transition cursor-pointer"
                        title="Edit watch"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteProductClick(p.id)}
                        className="p-1.5 bg-white/5 border border-white/10 hover:border-luxury-red hover:text-luxury-red text-gray-400 rounded transition cursor-pointer"
                        title="Delete watch"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} 

      {/* --- TAB CONTENT: ORDER DISPATCHER (MANAGE STATUSES) --- */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">Client Invoice Dispatcher</h3>
          
          {orders.length === 0 ? (
            <p className="text-gray-400 text-xs italic p-4 text-center border border-dashed border-white/10 rounded">No order records found in simulated database.</p>
          ) : (
            <div className="bg-luxury-gray border border-white/5 rounded-md overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-luxury-dark border-b border-white/5 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Charged</th>
                    <th className="p-4">Status Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
{orders.map((o) => (
                    <React.Fragment key={o.id}>
                    <tr className="hover:bg-white/5 transition">
                      <td className="p-4 font-mono font-bold text-black tracking-wider uppercase">
                        <div className="flex items-center gap-1.5">
                          <span>{o.id}</span>
                          {(o.giftingOptions?.isGifting || o.giftingOptions?.occasion || o.giftingOptions?.note) && (
                            <Gift size={13} className="text-black animate-pulse" title={`Gifting Order: ${o.giftingOptions.occasion || 'Yes'}`} />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-semibold">{o.userName}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{o.userEmail}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="truncate text-gray-300 font-light" title={o.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}>
                          {o.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                        </p>
                        {(o.giftingOptions?.isGifting || o.giftingOptions?.occasion || o.giftingOptions?.note) && (
                          <div className="mt-1 text-[10px] text-black space-y-0.5 bg-luxury-gold/5 border border-luxury-gold/20 p-2 rounded">
                            <p className="font-bold uppercase tracking-wider">🎁 Curated Gift Order</p>
                            {o.giftingOptions.occasion && <p><span className="font-semibold text-black">Occasion:</span> {o.giftingOptions.occasion}</p>}
                            {o.giftingOptions.packaging && <p><span className="font-semibold text-black">Packaging:</span> {o.giftingOptions.packaging === 'couple' ? 'Couple Packaging' : 'Single Packaging'}</p>}
                            {o.giftingOptions.note && (
                              <div className="mt-1.5 pt-1.5 border-t border-white/5">
                                <button
                                  type="button"
                                  onClick={() => setExpandedNotes(prev => ({ ...prev, [o.id]: !prev[o.id] }))}
                                  className="action-btn text-[9px] font-black tracking-widest uppercase bg-luxury-gold/20 hover:bg-luxury-gold/30 text-black px-2 py-0.5 rounded cursor-pointer transition"
                                >
                                  {expandedNotes[o.id] ? '▲ Hide Note' : '▼ View Note'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-[180px] text-[11px] text-gray-300 leading-relaxed">
                        <p className="font-semibold text-white">{o.shippingDetails?.fullName}</p>
                        <p>{o.shippingDetails?.streetAddress}</p>
                        <p>{o.shippingDetails?.city}, {o.shippingDetails?.zipCode}</p>
                        <p className="text-gray-500">{o.shippingDetails?.country}</p>
                      </td>
                      <td className="p-4 font-bold text-black">{formatPrice(o.total, currentCurrency)}</td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          onChange={(e) => dispatch(updateOrderStatus(o.id, e.target.value))}
                          className={`bg-luxury-dark text-xs border rounded px-2.5 py-1 font-semibold focus:outline-none ${
                            o.status === 'Delivered' 
                              ? 'border-emerald-500 text-emerald-400'
                              : o.status === 'Cancelled'
                              ? 'border-red-500 text-red-400'
                              : o.status === 'Shipped'
                              ? 'border-sky-500 text-sky-400'
                              : o.status === 'Exchange/Refund Requested'
                              ? 'border-purple-500 text-purple-450'
                              : 'border-yellow-500 text-yellow-450'
                          }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Exchange/Refund Requested">Exchange/Refund Requested</option>
                        </select>
                      </td>
                    </tr>
                    {expandedNotes[o.id] && o.giftingOptions?.note && (
                      <tr className="bg-luxury-gold/5">
                        <td colSpan={6} className="px-4 pb-4 pt-0">
                          <div className="bg-black/40 border border-luxury-gold/20 rounded-md p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-luxury-gold mb-2">Gift Note</p>
                            <p className="italic text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                              "{o.giftingOptions.note}"
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: COUPON BUILDER --- */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Create Form */}
          <div className="lg:col-span-5 bg-luxury-gray border border-white/5 p-6 rounded-md space-y-4 h-fit">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">Assemble Promo Codes</h4>
            
            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Coupon Name/Code</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="GOLDENHOUR"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5 uppercase font-mono tracking-wider"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Discount Amount (%)</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="90"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(e.target.value)}
                  placeholder="30"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Description Tag</label>
                <input
                  type="text"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="30% discount on summer collections"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-white text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-luxury-gold hover:text-luxury-dark transition cursor-pointer"
              >
                Activate Coupon
              </button>
            </form>
          </div>

          {/* Right: List active coupons */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Active Promo Database</h4>
            
            <div className="bg-luxury-gray border border-white/5 rounded-md divide-y divide-white/5">
              {coupons.map((c) => (
                <div key={c.code} className="flex justify-between items-center p-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-white text-sm font-bold tracking-wider">{c.code}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                        {c.discountPercent}% OFF
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">{c.description || 'No description tag provided'}</p>
                  </div>
                  
                  <button
                    onClick={() => dispatch(deleteCoupon(c.code))}
                    className="p-1.5 text-gray-500 hover:text-luxury-red transition hover:bg-white/5 rounded"
                    title="Revoke code"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: REVIEW MANAGER --- */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">Client Review Manager</h3>
          
          {activeReviews.length === 0 ? (
            <p className="text-gray-400 text-xs italic p-4 text-center border border-dashed border-white/10 rounded">No published reviews found.</p>
          ) : (
            <div className="space-y-4">
              {activeReviews.map((item) => (
                <div key={item.review.id} className="bg-luxury-gray border border-white/5 p-5 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-xs font-semibold">{item.review.userName}</span>
                      <span className="text-[10px] text-gray-500">on {item.productName}</span>
                    </div>
                    
                    <div className="flex text-luxury-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={10} 
                          fill={i < item.review.rating ? "var(--color-luxury-gold)" : "none"} 
                          className="stroke-1"
                        />
                      ))}
                    </div>

                    <p className="text-gray-300 text-xs font-light leading-relaxed max-w-xl">"{item.review.comment}"</p>
                  </div>

                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleReviewStatus(item.productId, item.review.id, 'hidden')}
                      className="px-3 py-1.5 bg-transparent border border-white/10 hover:border-luxury-red hover:text-luxury-red text-[10px] font-bold uppercase tracking-wider rounded flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Remove Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: BRAND UPDATES MANAGER --- */}
      {activeTab === 'updates' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">Brand Updates Manager</h3>
            <button
              onClick={() => {
                setShowAddUpdateForm(!showAddUpdateForm);
                setEditingUpdateId(null);
              }}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer rounded-sm"
              style={{ color: '#ffffff' }}
            >
              <Plus size={14} style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff' }}>{showAddUpdateForm ? 'Cancel Add' : 'Add New Update'}</span>
            </button>
          </div>

          {/* Form to Add New Update */}
          {showAddUpdateForm && (
            <div className="bg-gray-50 border border-black/5 p-6 rounded-md max-w-xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">Create Brand Update</h4>
              <form onSubmit={handleCreateUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest block">Update Title</label>
                  <input
                    type="text"
                    required
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                    placeholder="e.g. Geneva Flagship Opening"
                    className="w-full bg-white border border-black/10 rounded text-neutral-900 p-2.5 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest block">Update Detail Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newUpdate.detail}
                    onChange={(e) => setNewUpdate({ ...newUpdate, detail: e.target.value })}
                    placeholder="Provide full description of the news milestone..."
                    className="w-full bg-white border border-black/10 rounded text-neutral-900 p-2.5 resize-none focus:outline-none focus:border-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest block">Display Expiry Duration</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={[24, 48, 72, 96, 168].includes(newUpdate.durationHours) ? newUpdate.durationHours : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setNewUpdate({ ...newUpdate, durationHours: Number(val) });
                        } else {
                          setNewUpdate({ ...newUpdate, durationHours: 24 });
                        }
                      }}
                      className="bg-white border border-black/10 rounded text-neutral-900 p-2 text-xs focus:outline-none"
                    >
                      <option value="24">24 Hours (1 Day)</option>
                      <option value="48">48 Hours (2 Days)</option>
                      <option value="72">72 Hours (3 Days)</option>
                      <option value="96">96 Hours (4 Days)</option>
                      <option value="168">168 Hours (1 Week)</option>
                      <option value="custom">Custom Hours...</option>
                    </select>
                    {![24, 48, 72, 96, 168].includes(newUpdate.durationHours) && (
                      <input
                        type="number"
                        min="1"
                        value={newUpdate.durationHours || ''}
                        onChange={(e) => setNewUpdate({ ...newUpdate, durationHours: Math.max(1, Number(e.target.value)) })}
                        placeholder="Hours (e.g. 120)"
                        className="bg-white border border-black/10 rounded text-neutral-900 p-2 text-xs focus:outline-none"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="newApproved"
                    checked={newUpdate.approved}
                    onChange={(e) => setNewUpdate({ ...newUpdate, approved: e.target.checked })}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <label htmlFor="newApproved" className="text-xs text-neutral-800 cursor-pointer select-none">
                    Publish immediately (Approved)
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs tracking-widest uppercase transition cursor-pointer"
                >
                  Publish Update
                </button>
              </form>
            </div>
          )}

          {/* Form to Edit Existing Update */}
          {editingUpdateId && editUpdateForm && (
            <div className="bg-gray-50 border border-black/5 p-6 rounded-md max-w-xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">Edit Brand Update</h4>
              <form onSubmit={handleUpdateUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest block">Update Title</label>
                  <input
                    type="text"
                    required
                    value={editUpdateForm.title}
                    onChange={(e) => setEditUpdateForm({ ...editUpdateForm, title: e.target.value })}
                    className="w-full bg-white border border-black/10 rounded text-neutral-900 p-2.5 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest block">Update Detail Description</label>
                  <textarea
                    required
                    rows={3}
                    value={editUpdateForm.detail}
                    onChange={(e) => setEditUpdateForm({ ...editUpdateForm, detail: e.target.value })}
                    className="w-full bg-white border border-black/10 rounded text-neutral-900 p-2.5 resize-none focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest block">Display Expiry Duration</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={[24, 48, 72, 96, 168].includes(editUpdateForm.durationHours) ? editUpdateForm.durationHours : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setEditUpdateForm({ ...editUpdateForm, durationHours: Number(val) });
                        } else {
                          setEditUpdateForm({ ...editUpdateForm, durationHours: 24 });
                        }
                      }}
                      className="bg-white border border-black/10 rounded text-neutral-900 p-2 text-xs focus:outline-none"
                    >
                      <option value="24">24 Hours (1 Day)</option>
                      <option value="48">48 Hours (2 Days)</option>
                      <option value="72">72 Hours (3 Days)</option>
                      <option value="96">96 Hours (4 Days)</option>
                      <option value="168">168 Hours (1 Week)</option>
                      <option value="custom">Custom Hours...</option>
                    </select>
                    {![24, 48, 72, 96, 168].includes(editUpdateForm.durationHours) && (
                      <input
                        type="number"
                        min="1"
                        value={editUpdateForm.durationHours || ''}
                        onChange={(e) => setEditUpdateForm({ ...editUpdateForm, durationHours: Math.max(1, Number(e.target.value)) })}
                        placeholder="Hours (e.g. 120)"
                        className="bg-white border border-black/10 rounded text-neutral-900 p-2 text-xs focus:outline-none"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="editApproved"
                    checked={editUpdateForm.approved}
                    onChange={(e) => setEditUpdateForm({ ...editUpdateForm, approved: e.target.checked })}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <label htmlFor="editApproved" className="text-xs text-neutral-800 cursor-pointer select-none">
                    Approved (Visible to clients)
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUpdateId(null);
                      setEditUpdateForm(null);
                    }}
                    className="flex-1 py-3 bg-transparent border border-black/15 text-neutral-900 font-bold text-xs tracking-widest uppercase hover:bg-black/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs tracking-widest uppercase transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of existing updates */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">Brand Updates Database</h4>
            
            {adminUpdates.length === 0 ? (
              <p className="text-neutral-600 text-xs italic p-6 text-center border border-dashed border-black/10 rounded">No brand updates found in database.</p>
            ) : (
              <div className="bg-gray-50 border border-black/5 rounded-md divide-y divide-black/10">
                {adminUpdates.map((up) => (
                  <div key={up._id || up.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-neutral-900 text-sm font-bold tracking-wider">{up.title}</span>
                        <button
                          onClick={() => handleToggleUpdateApproval(up._id || up.id, up.approved)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                            up.approved 
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                              : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                          }`}
                        >
                          {up.approved ? 'APPROVED & LIVE' : 'UNAPPROVED / HIDDEN'}
                        </button>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed font-light">{up.detail}</p>
                      <p className="text-[9px] text-neutral-500 font-mono">
                        Duration: {up.durationHours || 24} hours (Expires: {new Date(new Date(up.createdAt).getTime() + (up.durationHours || 24) * 3600000).toLocaleString('en-IN')})
                      </p>
                    </div>

                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditUpdateInit(up)}
                        className="p-2 text-neutral-500 hover:text-black transition hover:bg-black/5 rounded"
                        title="Edit Update"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(up._id || up.id)}
                        className="p-2 text-neutral-500 hover:text-red-600 transition hover:bg-black/5 rounded"
                        title="Delete Update"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Homepage Media</h3>
            <p className="text-gray-400 text-xs mt-1">Upload or replace the image used in each homepage section.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HOMEPAGE_SECTIONS.map((section) => (
              <div key={section.key} className="bg-luxury-gray border border-white/10 rounded p-3 space-y-2">
                <div className="w-full h-32 bg-luxury-dark rounded overflow-hidden flex items-center justify-center">
                  {mediaList[section.key] ? (
                    <img src={mediaList[section.key]} alt={section.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">No custom image set</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-300 font-semibold">{section.label}</p>
                <label className="block w-full text-center py-2 bg-luxury-dark border border-white/10 hover:border-luxury-gold text-[9px] font-bold uppercase tracking-widest text-black rounded cursor-pointer transition">
                  {uploadingMedia ? 'Uploading...' : 'Upload / Replace'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingMedia}
                    onChange={(e) => handleSectionImageUpload(e, section.key)}
                  />
                </label>
              </div>
            ))}
            </div>
            </div>
      )}


      {/* --- TAB CONTENT: BLOGS EDITORIAL --- */}
      {activeTab === 'blogs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Blogs Editorial Manager</h3>
            <button
              onClick={() => setShowAddBlogForm(!showAddBlogForm)}
              className="px-4 py-2 bg-white hover:bg-luxury-gold text-luxury-dark text-xs font-bold uppercase tracking-widest transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>{showAddBlogForm ? 'Close Form' : 'Write Blog'}</span>
            </button>
          </div>

          {/* Add Blog Form */}
          {showAddBlogForm && (
            <div className="bg-luxury-gray border border-white/5 p-6 rounded-md space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">Publish New Article</h4>
              
              <form onSubmit={handleCreateBlog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Article Title</label>
                  <input
                    type="text"
                    required
                    value={newBlog.title}
                    onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="The Evolution of Mechanical Movements"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Category</label>
                    <input
                      type="text"
                      required
                      value={newBlog.category}
                      onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="Horology"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Author</label>
                    <input
                      type="text"
                      value={newBlog.author}
                      onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="KHRONIQ Editorial"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Featured Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBlogImageUpload}
                    disabled={uploadingBlogImage}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-black text-xs p-2.5 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newBlog.image}
                    onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 mt-1.5 focus:outline-none"
                    placeholder="Or enter image path/URL manually (e.g. /assets/lifestyle_black_cafe.jpg)"
                  />
                  {uploadingBlogImage && <p className="text-[10px] text-luxury-gold">Uploading...</p>}
                  {newBlog.image && !uploadingBlogImage && (
                    <img src={newBlog.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded border border-white/10" />
                  )}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Content</label>
                  <textarea
                    rows="6"
                    required
                    value={newBlog.content}
                    onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none font-sans"
                    placeholder="Write article details here..."
                  />
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-3 bg-luxury-gold text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition"
                >
                  Publish Article
                </button>
              </form>
            </div>
          )}

          {/* Edit Blog Form */}
          {editingBlogId && editBlogForm && (
            <div className="bg-[#1a1a1a] border border-luxury-gold/20 p-6 rounded-md space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold border-b border-white/5 pb-2">Edit Article</h4>
              
              <form onSubmit={handleUpdateBlogSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Article Title</label>
                  <input
                    type="text"
                    required
                    value={editBlogForm.title}
                    onChange={(e) => setEditBlogForm({ ...editBlogForm, title: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                    placeholder="Article Title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Category</label>
                    <input
                      type="text"
                      required
                      value={editBlogForm.category}
                      onChange={(e) => setEditBlogForm({ ...editBlogForm, category: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="Category"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Author</label>
                    <input
                      type="text"
                      value={editBlogForm.author}
                      onChange={(e) => setEditBlogForm({ ...editBlogForm, author: e.target.value })}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none"
                      placeholder="Author"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Featured Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditBlogImageUpload}
                    disabled={uploadingBlogImage}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-black text-xs p-2.5 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editBlogForm.image}
                    onChange={(e) => setEditBlogForm({ ...editBlogForm, image: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 mt-1.5 focus:outline-none"
                    placeholder="Or enter image URL manually"
                  />
                  {uploadingBlogImage && <p className="text-[10px] text-luxury-gold">Uploading...</p>}
                  {editBlogForm.image && !uploadingBlogImage && (
                    <img src={editBlogForm.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded border border-white/10" />
                  )}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-black font-bold uppercase tracking-widest block">Content</label>
                  <textarea
                    rows="6"
                    required
                    value={editBlogForm.content}
                    onChange={(e) => setEditBlogForm({ ...editBlogForm, content: e.target.value })}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-2.5 focus:outline-none font-sans"
                    placeholder="Write article details here..."
                  />
                </div>

                <div className="md:col-span-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlogId(null);
                      setEditBlogForm(null);
                    }}
                    className="flex-1 py-3 bg-transparent border border-white/10 text-white font-bold text-xs tracking-widest uppercase hover:bg-white/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-luxury-gold text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Blogs list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Articles Database</h4>
            
            {blogs.length === 0 ? (
              <p className="text-gray-400 text-xs italic p-6 text-center border border-dashed border-white/10 rounded">No blog posts found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogs.map((blog) => (
                  <div key={blog.id || blog._id} className="bg-luxury-gray border border-white/5 p-4 rounded-md flex gap-4 items-start">
                    <img 
                      src={blog.image || '/assets/lifestyle_black_cafe.jpg'} 
                      alt={blog.title} 
                      className="w-20 h-20 object-cover rounded border border-white/10 bg-black flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-bold text-luxury-gold uppercase tracking-wider">{blog.category} · By {blog.author}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditBlogInit(blog)}
                            className="text-gray-400 hover:text-white transition rounded p-0.5"
                            title="Edit Article"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog.id || blog._id)}
                            className="text-gray-400 hover:text-luxury-red transition rounded p-0.5"
                            title="Delete Article"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-white text-sm font-bold truncate leading-tight">{blog.title}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-normal">{blog.content}</p>
                      <span className="text-[9px] text-gray-500 block pt-1">{blog.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
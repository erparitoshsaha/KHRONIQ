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
  getDiscountedPrice
} from '../store/slices/watchSlice';
import { 
  BarChart3, Plus, Edit, Trash2, Check, X, Tag, Star, 
  Package, AlertTriangle, ShieldAlert, ArrowLeft, ArrowUpRight,
  CheckCircle2, LogOut, Newspaper, ImagePlus, BookOpen, Gift, Download
} from 'lucide-react';

const PRESET_STRAPS = [
  { name: 'Tan Leather', image: '/assets/strap_leather_tan.jpg' },
  { name: 'Diamond Silver Link', image: '/assets/strap_silver_diamond.jpg' },
  { name: 'Classic Gold Chain', image: '/assets/strap_gold_chain.jpg' },
  { name: 'Forest Green Rubber', image: '/assets/strap_rubber_green.jpg' },
  { name: 'Brushed Steel Link', image: '/assets/strap_steel_link.jpg' }
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

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.7));
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
    };
    reader.onerror = () => {
      resolve('');
    };
  });
};

export default function Admin({ onPageChange }) {
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);
  const orders = useSelector(state => state.watch.orders);
  const coupons = useSelector(state => state.watch.coupons);
  const currentUser = useSelector(state => state.watch.currentUser);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const blogs = useSelector(state => state.watch.blogs || []);

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | products | orders | coupons | reviews | updates | blogs

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    discountPercent: 0,
    badge: '',
    unitCodes: [],
    badgeMode: 'none',
    warrantyMonths: 6,
    category: 'Khronomaster',
    gender: 'unisex',
    description: '',
    image: '', // default copy
    specs: {
      movement: 'Automatic Chronometer',
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
      const compressedBase64 = await compressImage(file);
      setTempStrapImage(compressedBase64);
    } catch (err) {
      console.error('Strap image compression error:', err);
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
    { key: 'collection_khronomaster', label: 'Collection Tile — Khronomaster' },
    { key: 'collection_defy', label: 'Collection Tile — Defy' },
    { key: 'collection_heritage', label: 'Collection Tile — Elite & Heritage' },
    { key: 'khronomaster_professional', label: 'Khronomaster Professional — Hero Image' },
    { key: 'dive_deeper_tile1', label: 'Khronomaster Professional — Tile 1 (Emerald Green)' },
    { key: 'dive_deeper_tile2', label: 'Khronomaster Professional — Tile 2 (Crimson Red)' },
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
      const compressedBase64 = await compressImage(file);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          url: compressedBase64,
          section: sectionKey,
          type: 'image'
        })
      });
      const data = await res.json();
      if (data.success && data.media?.[0]) {
        setMediaList(prev => ({ ...prev, [sectionKey]: data.media[0].url }));
      } else {
        alert(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Section image upload error:', err);
      alert('Failed to upload image.');
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
      const compressedBase64 = await compressImage(file);
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: compressedBase64 })
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
      alert('Failed to upload strap image');
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
    const compressedBase64 = await compressImage(file);
    const token = localStorage.getItem('khroniq_token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ image: compressedBase64 })
    });
    const data = await res.json();

    if (data.success) {
      setNewProduct({ ...newProduct, image: data.imageUrl });
    } else {
      alert(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    alert('Failed to upload image');
  } finally {
    setUploadingImage(false);
  }
};

const handleEditImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingImage(true);
  try {
    const compressedBase64 = await compressImage(file);
    const token = localStorage.getItem('khroniq_token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ image: compressedBase64 })
    });
    const data = await res.json();

    if (data.success) {
      setEditForm({ ...editForm, image: data.imageUrl });
    } else {
      alert(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    alert('Failed to upload image');
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
        name: '', price: '', stock: '', discountPercent: 0, badge: '', badgeMode: 'none',unitCodes: [],  warrantyMonths: 12, category: 'Khronomaster', description: '',
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
                    placeholder="Khroniq Khronomaster Sport"
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
                    <option value="Khronomaster">Khronomaster</option>
                    <option value="Defy">Defy</option>
                    <option value="Heritage">Heritage</option>
                    <option value="Elite">Elite</option>
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
                    placeholder="Or enter image path/URL manually (e.g. /assets/watch_uploaded_1.jpg)"
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
                      { key: 'collection',     label: 'Collection',      ph: 'Khronomaster' },
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
                      <option value="Khronomaster">Khronomaster</option>
                      <option value="Defy">Defy</option>
                      <option value="Heritage">Heritage</option>
                      <option value="Elite">Elite</option>
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
                      placeholder="Or enter image path/URL manually (e.g. /assets/watch_uploaded_1.jpg)"
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
                        { key: 'collection',      label: 'Collection',       ph: 'Khronomaster' },
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
                    placeholder="Or enter image path/URL manually (e.g. /assets/gentleman_lifestyle.png)"
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
                      src={blog.image || '/assets/media__1782899491225.jpg'} 
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
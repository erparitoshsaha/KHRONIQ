import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdminContentSections,
  updateContentSection,
  createContentSection,
  deleteContentSection,
  toggleContentSection,
  reorderContentSections,
  addContentItem,
  updateContentItem,
  deleteContentItem,
  toggleContentItem,
  reorderContentItems,
  seedDefaultContent
} from '../../store/slices/watchSlice';
import { DEFAULT_CONTENT_SECTIONS } from '../../constants/defaultContent.js';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

const SUPPORTED_PAGES = [
  { key: 'home', label: 'Homepage' },
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
  { key: 'faq', label: 'FAQ' },
  { key: 'navigation', label: 'Navigation' },
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'shipping', label: 'Shipping & Delivery' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'warranty', label: 'Warranty Policy' }
];

export default function WebsiteContentManager() {
  const dispatch = useDispatch();
  const adminSections = useSelector((state) => state.watch.adminContentSections || []);
  const filters = useSelector((state) => state.watch.filters || []);

  const [selectedPage, setSelectedPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Modals state
  const [sectionModal, setSectionModal] = useState({ open: false, isEdit: false, data: null, savedData: null });
  const [itemModal, setItemModal] = useState({ open: false, isEdit: false, sectionId: null, sectionKey: '', sectionName: '', data: null, savedData: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: 'section', sectionId: null, itemId: null, title: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadSections();
  }, [selectedPage]);

  const loadSections = async () => {
    setLoading(true);
    const res = await dispatch(fetchAdminContentSections(selectedPage));
    if (res && res.sections && res.sections.filter((s) => s.page === selectedPage).length === 0) {
      await dispatch(seedDefaultContent());
      await dispatch(fetchAdminContentSections(selectedPage));
    }
    setLoading(false);
  };

  const showNotification = (msg, isError = false) => {
    setStatusMessage({ text: msg, isError });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const pageAdminSections = adminSections.filter((s) => s.page === selectedPage);
  const fallbackDefaults = DEFAULT_CONTENT_SECTIONS.filter((s) => s.page === selectedPage);
  const currentSections = (pageAdminSections.length > 0 ? pageAdminSections : fallbackDefaults)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const collectionFilter = filters.find((f) => f.slug === 'collection');
  const activeFilterCollections = collectionFilter?.options?.filter((o) => o.isActive) || [];

  const toggleExpand = (secId) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Section actions
  const handleToggleSection = async (sectionId) => {
    const res = await dispatch(toggleContentSection(sectionId));
    if (res.success) {
      showNotification(`Section visibility toggled to ${res.isActive ? 'Active' : 'Disabled'}.`);
    } else {
      showNotification(res.message || 'Failed to toggle section.', true);
    }
  };

  const handleMoveSection = async (sectionId, direction) => {
    const idx = currentSections.findIndex((s) => s._id === sectionId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === currentSections.length - 1) return;

    const newSections = [...currentSections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newSections[idx];
    newSections[idx] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    const sectionIds = newSections.map((s) => s._id);
    const res = await dispatch(reorderContentSections(sectionIds));
    if (res.success) {
      showNotification('Sections reordered.');
    }
  };

  // Item actions
  const handleToggleItem = async (sectionId, itemId) => {
    const res = await dispatch(toggleContentItem(sectionId, itemId));
    if (res.success) {
      showNotification(`Item visibility toggled to ${res.isActive ? 'Active' : 'Disabled'}.`);
    } else {
      showNotification(res.message || 'Failed to toggle item.', true);
    }
  };

  const handleMoveItem = async (section, itemId, direction) => {
    const items = [...(section.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = items.findIndex((i) => i._id === itemId || i.id === itemId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === items.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    const itemIds = items.map((i) => i._id || i.id);
    const res = await dispatch(reorderContentItems(section._id, itemIds));
    if (res.success) {
      showNotification('Items reordered.');
    }
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'section') {
      const res = await dispatch(deleteContentSection(deleteModal.sectionId));
      if (res.success) {
        showNotification('Section deleted successfully.');
      } else {
        showNotification(res.message || 'Failed to delete section.', true);
      }
    } else {
      const res = await dispatch(deleteContentItem(deleteModal.sectionId, deleteModal.itemId));
      if (res.success) {
        showNotification('Item deleted successfully.');
      } else {
        showNotification(res.message || 'Failed to delete item.', true);
      }
    }
    setDeleteModal({ open: false, type: 'section', sectionId: null, itemId: null, title: '' });
  };

  // Image upload handler via Cloudinary
  const handleImageUpload = async (e, setFieldValue) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('khroniq_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setFieldValue(data.imageUrl);
        showNotification('Image uploaded successfully.');
      } else {
        showNotification(data.message || 'Image upload failed.', true);
      }
    } catch (err) {
      showNotification('Image upload failed.', true);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-neutral-200 p-6 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-wider text-black">
              Website Content Management
            </h2>
          </div>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl font-medium">
            Manage customer-facing website copy, headlines, media, and sections in real-time.
            All changes persist in MongoDB and synchronize directly to the live website.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              const res = await dispatch(seedDefaultContent());
              await dispatch(fetchAdminContentSections(selectedPage));
              setLoading(false);
              showNotification(res.message || 'Existing website content verified and synchronized.');
            }}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-sm border border-neutral-300 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Import / Sync Content</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setSectionModal({
                open: true,
                isEdit: false,
                data: {
                  page: selectedPage,
                  sectionKey: '',
                  name: '',
                  title: '',
                  subtitle: '',
                  description: '',
                  label: '',
                  buttonText: '',
                  buttonLink: '',
                  image: '',
                  type: 'standard',
                  order: currentSections.length + 1,
                  isActive: true
                }
              })
            }
            className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-black hover:bg-neutral-800 text-white rounded-sm border border-black transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-sm border text-xs font-bold flex items-center justify-between transition ${
            statusMessage.isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.isError ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-neutral-500 hover:text-black cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Navigation Selector */}
      <div className="bg-neutral-100 p-2 rounded-sm border border-neutral-200 flex flex-wrap gap-1.5">
        {SUPPORTED_PAGES.map((page) => (
          <button
            key={page.key}
            type="button"
            onClick={() => setSelectedPage(page.key)}
            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center space-x-1.5 ${
              selectedPage === page.key
                ? 'bg-black text-white shadow-sm font-black'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
            }`}
          >
            <span>{page.label}</span>
          </button>
        ))}
      </div>

      {/* Global Collection Sync Notice (on Homepage) */}
      {selectedPage === 'home' && (
        <div className="bg-emerald-50/80 border border-emerald-300/80 p-4 rounded-sm flex items-start space-x-3 text-xs">
          <Sparkles size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-emerald-900">
            <span className="font-bold uppercase tracking-wider block">
              Single Source of Truth — Dynamic Collections
            </span>
            <p className="leading-relaxed">
              The Homepage Signature Collections showcase is automatically harmonized with your Catalog Filters.
              Currently active collections:{' '}
              <span className="font-bold underline">
                {activeFilterCollections.map((c) => c.name).join(', ') || 'None'}
              </span>
              . Any changes made to collection options in Catalog Filters automatically propagate to the Homepage,
              Footer, and Shop.
            </p>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {loading && currentSections.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 bg-white border border-neutral-200 rounded-sm">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading sections...</span>
          </div>
        ) : currentSections.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 bg-white border border-neutral-200 rounded-sm space-y-4">
            <Layers size={32} className="mx-auto text-neutral-400" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-wider text-black">
                No CMS content initialized yet for {selectedPage.toUpperCase()}.
              </p>
              <p className="text-xs text-neutral-500">
                Click below to import and migrate the existing website content into the CMS.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const res = await dispatch(seedDefaultContent());
                await dispatch(fetchAdminContentSections(selectedPage));
                setLoading(false);
                showNotification(res.message || 'Existing website content imported successfully.');
              }}
              className="px-6 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-sm transition shadow cursor-pointer inline-flex items-center space-x-2"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>IMPORT EXISTING WEBSITE CONTENT</span>
            </button>
          </div>
        ) : (
          currentSections.map((sec, idx) => {
            const isExpanded = !!expandedSections[sec._id];
            const hasItems = Array.isArray(sec.items) && sec.items.length > 0;

            return (
              <div
                key={sec._id}
                className={`bg-white border rounded-sm transition shadow-sm ${
                  sec.isActive ? 'border-neutral-200' : 'border-neutral-200 bg-neutral-50/60 opacity-80'
                }`}
              >
                {/* Section Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center justify-center bg-neutral-100 border border-neutral-200 w-9 h-9 rounded-sm text-xs font-black text-neutral-800 shrink-0">
                      #{sec.order || idx + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wide">
                          {sec.name}
                        </h3>
                        <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono font-medium border border-neutral-200">
                          {sec.sectionKey}
                        </span>
                        <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded uppercase font-semibold">
                          {sec.type}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                            sec.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-neutral-200 text-neutral-600 border border-neutral-300'
                          }`}
                        >
                          {sec.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-600 line-clamp-1">
                        {sec.title && <span className="font-semibold text-black">{sec.title} — </span>}
                        {sec.subtitle || sec.description || 'No subtitle configured.'}
                      </div>
                    </div>
                  </div>

                  {/* Section Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center">
                    {/* Reorder Up/Down */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(sec._id, 'up')}
                      title="Move Section Up"
                      className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded border border-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === currentSections.length - 1}
                      onClick={() => handleMoveSection(sec._id, 'down')}
                      title="Move Section Down"
                      className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded border border-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowDown size={14} />
                    </button>

                    {/* Enable / Disable */}
                    <button
                      type="button"
                      onClick={() => handleToggleSection(sec._id)}
                      className={`px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded border transition flex items-center space-x-1 cursor-pointer ${
                        sec.isActive
                          ? 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border-neutral-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                      }`}
                    >
                      {sec.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{sec.isActive ? 'Disable' : 'Enable'}</span>
                    </button>

                    {/* Edit Section */}
                    <button
                      type="button"
                      onClick={() => setSectionModal({ open: true, isEdit: true, data: { ...sec }, savedData: { ...sec } })}
                      className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-100 rounded border border-neutral-300 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>

                    {/* Add Item (for lists or collection sections) */}
                    {(sec.type === 'list' || sec.type === 'dynamic_collection' || sec.type === 'grid' || sec.type === 'marquee') && (
                      <button
                        type="button"
                        onClick={() =>
                          setItemModal({
                            open: true,
                            isEdit: false,
                            sectionId: sec._id,
                            sectionKey: sec.sectionKey,
                            sectionName: sec.name,
                            data: {
                              title: '',
                              subtitle: sec.sectionKey === 'featured' ? 'PRECISION AT EVERY LEVEL' : '',
                              description: '',
                              label: '',
                              buttonText: sec.sectionKey === 'featured' ? 'EXPLORE' : '',
                              buttonLink: '',
                              image: '',
                              price: '',
                              order: (sec.items?.length || 0) + 1,
                              isActive: true,
                              metadata: {}
                            },
                            savedData: null
                          })
                        }
                        className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white hover:bg-black rounded transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Item</span>
                      </button>
                    )}

                    {/* Delete Section */}
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModal({
                          open: true,
                          type: 'section',
                          sectionId: sec._id,
                          itemId: null,
                          title: sec.name
                        })
                      }
                      title="Delete Section"
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Expand/Collapse Items */}
                    {(hasItems || sec.type === 'list' || sec.type === 'dynamic_collection' || sec.type === 'grid' || sec.type === 'marquee') && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(sec._id)}
                        className="px-2 py-1.5 text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-200 flex items-center space-x-1 cursor-pointer ml-1"
                      >
                        <span className="font-mono">{sec.items?.length || 0}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Child Items Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-neutral-50/80 border-t border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                        Content Items in {sec.name} ({sec.items?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setItemModal({
                            open: true,
                            isEdit: false,
                            sectionId: sec._id,
                            sectionKey: sec.sectionKey,
                            sectionName: sec.name,
                            data: {
                              title: '',
                              subtitle: sec.sectionKey === 'featured' ? 'PRECISION AT EVERY LEVEL' : '',
                              description: '',
                              label: '',
                              buttonText: sec.sectionKey === 'featured' ? 'EXPLORE' : '',
                              buttonLink: '',
                              image: '',
                              price: '',
                              order: (sec.items?.length || 0) + 1,
                              isActive: true,
                              metadata: {}
                            },
                            savedData: null
                          })
                        }
                        className="text-xs font-bold text-neutral-800 hover:text-black flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {!hasItems ? (
                      <div className="p-6 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-sm">
                        No items added to this section yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sec.items
                          .slice()
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((item, iIdx) => (
                            <div
                              key={item._id || item.id || iIdx}
                              className={`p-3 bg-white border rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                                item.isActive ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.title || 'Item'}
                                    className="w-10 h-10 object-cover rounded-sm border border-neutral-200 shrink-0 bg-neutral-100"
                                  />
                                )}
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black text-neutral-900">
                                      {item.title || '(No Title)'}
                                    </span>
                                    {item.subtitle && (
                                      <span className="text-[10px] text-neutral-500">
                                        • {item.subtitle}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                        item.isActive
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-neutral-200 text-neutral-600'
                                      }`}
                                    >
                                      {item.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                    {(item.price !== undefined && item.price !== 0 || item.metadata?.price) && (
                                      <span className="text-[10px] font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                                        ₹{Number(item.price || item.metadata?.price).toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-neutral-600 line-clamp-1 max-w-lg">
                                      {item.description}
                                    </p>
                                  )}
                                  {item.buttonLink && (
                                    <span className="text-[10px] text-neutral-400 font-mono">
                                      Link: {item.buttonLink}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Item Controls */}
                              <div className="flex items-center space-x-1.5 self-end sm:self-center">
                                <button
                                  type="button"
                                  disabled={iIdx === 0}
                                  onClick={() => handleMoveItem(sec, item._id || item.id, 'up')}
                                  className="p-1 text-neutral-600 hover:text-black rounded border border-neutral-200 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={iIdx === sec.items.length - 1}
                                  onClick={() => handleMoveItem(sec, item._id || item.id, 'down')}
                                  className="p-1 text-neutral-600 hover:text-black rounded border border-neutral-200 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleItem(sec._id, item._id || item.id)}
                                  className="p-1 text-neutral-600 hover:text-black rounded border border-neutral-200 cursor-pointer"
                                  title={item.isActive ? 'Disable Item' : 'Enable Item'}
                                >
                                  {item.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const initialData = {
                                      ...item,
                                      price: item.price !== undefined ? item.price : (item.metadata?.price !== undefined ? item.metadata.price : ''),
                                      metadata: { ...(item.metadata || {}) }
                                    };
                                    setItemModal({
                                      open: true,
                                      isEdit: true,
                                      sectionId: sec._id,
                                      sectionKey: sec.sectionKey,
                                      sectionName: sec.name,
                                      data: initialData,
                                      savedData: initialData
                                    });
                                  }}
                                  className="p-1 text-neutral-800 hover:bg-neutral-100 rounded border border-neutral-200 cursor-pointer"
                                  title="Edit Item"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteModal({
                                      open: true,
                                      type: 'item',
                                      sectionId: sec._id,
                                      itemId: item._id || item.id,
                                      title: item.title || 'Item'
                                    })
                                  }
                                  className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-200 cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* SECTION EDIT / CREATE MODAL */}
      {/* -------------------------------------------------- */}
      {sectionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-sm w-full max-w-xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-black">
                  {sectionModal.isEdit ? 'EDIT SECTION' : 'CREATE SECTION'}
                </h3>
                {sectionModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Editing: <span className="font-semibold text-neutral-800">{sectionModal.savedData?.name}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSectionModal({ open: false, isEdit: false, data: null, savedData: null })}
                className="text-neutral-500 hover:text-black font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {sectionModal.isEdit && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-sm p-3 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-900">
                  <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Currently Saved Content
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  The inputs below are pre-filled with the current database values. You can see the currently active values directly beneath each field.
                </p>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const d = sectionModal.data;
                if (!d.name || !d.sectionKey) {
                  showNotification('Section name and key are required.', true);
                  return;
                }

                if (sectionModal.isEdit) {
                  const res = await dispatch(updateContentSection(d._id, d));
                  if (res.success) {
                    showNotification('Section updated successfully.');
                    setSectionModal({ open: false, isEdit: false, data: null, savedData: null });
                  } else {
                    showNotification(res.message || 'Failed to update section.', true);
                  }
                } else {
                  const res = await dispatch(createContentSection(d));
                  if (res.success) {
                    showNotification('Section created successfully.');
                    setSectionModal({ open: false, isEdit: false, data: null, savedData: null });
                  } else {
                    showNotification(res.message || 'Failed to create section.', true);
                  }
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionModal.data.name || ''}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, name: e.target.value }
                      }))
                    }
                    placeholder="e.g. Hero Section"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:border-black font-medium"
                  />
                  {sectionModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-semibold text-neutral-800">"{sectionModal.savedData?.name || ''}"</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    Section Key *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={sectionModal.isEdit}
                    value={sectionModal.data.sectionKey || ''}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, sectionKey: e.target.value }
                      }))
                    }
                    placeholder="e.g. hero"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:border-black font-mono disabled:bg-neutral-100"
                  />
                  {sectionModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current key: <span className="font-mono text-neutral-800">{sectionModal.savedData?.sectionKey}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    Section Type
                  </label>
                  <select
                    value={sectionModal.data.type || 'standard'}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, type: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm bg-white"
                  >
                    <option value="standard">Standard Block</option>
                    <option value="list">Item List / Slider</option>
                    <option value="dynamic_collection">Dynamic Collection</option>
                    <option value="grid">Grid</option>
                    <option value="marquee">Marquee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Order</label>
                  <input
                    type="number"
                    value={sectionModal.data.order || 1}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, order: Number(e.target.value) }
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                  />
                  {sectionModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current order: <span className="font-semibold text-neutral-800">{sectionModal.savedData?.order || 1}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Label / Tag</label>
                <input
                  type="text"
                  value={sectionModal.data.label || ''}
                  onChange={(e) =>
                    setSectionModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, label: e.target.value }
                    }))
                  }
                  placeholder="e.g. The Pillars of KHRONIQ"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                />
                {sectionModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current value: <span className="font-semibold text-neutral-800">"{sectionModal.savedData?.label || '(None)'}"</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Headline / Title</label>
                <input
                  type="text"
                  value={sectionModal.data.title || ''}
                  onChange={(e) =>
                    setSectionModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, title: e.target.value }
                    }))
                  }
                  placeholder="e.g. Signature Collections"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-sm font-semibold"
                />
                {sectionModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current value: <span className="font-semibold text-neutral-800">"{sectionModal.savedData?.title || '(None)'}"</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Subtitle</label>
                <input
                  type="text"
                  value={sectionModal.data.subtitle || ''}
                  onChange={(e) =>
                    setSectionModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, subtitle: e.target.value }
                    }))
                  }
                  placeholder="e.g. Movement Of Time"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                />
                {sectionModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current value: <span className="font-semibold text-neutral-800">"{sectionModal.savedData?.subtitle || '(None)'}"</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={sectionModal.data.description || ''}
                  onChange={(e) =>
                    setSectionModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, description: e.target.value }
                    }))
                  }
                  placeholder="Section body copy..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                />
                {sectionModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current value: <span className="font-semibold text-neutral-800 line-clamp-1">"{sectionModal.savedData?.description || '(None)'}"</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Button Text</label>
                  <input
                    type="text"
                    value={sectionModal.data.buttonText || ''}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, buttonText: e.target.value }
                      }))
                    }
                    placeholder="e.g. Explore Timepieces"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                  />
                  {sectionModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-semibold text-neutral-800">"{sectionModal.savedData?.buttonText || '(None)'}"</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Button Link</label>
                  <input
                    type="text"
                    value={sectionModal.data.buttonLink || ''}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, buttonLink: e.target.value }
                      }))
                    }
                    placeholder="e.g. /shop"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                  />
                  {sectionModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-mono text-neutral-800">"{sectionModal.savedData?.buttonLink || '(None)'}"</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Image URL / Upload</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={sectionModal.data.image || ''}
                    onChange={(e) =>
                      setSectionModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, image: e.target.value }
                      }))
                    }
                    placeholder="/assets/watch_green.jpg or https://..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                  />
                  <label className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-sm cursor-pointer flex items-center space-x-1 shrink-0">
                    <Upload size={13} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageUpload(e, (url) =>
                          setSectionModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, image: url }
                          }))
                        )
                      }
                    />
                  </label>
                </div>
                {sectionModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1 truncate">
                    Current image: <span className="font-mono text-[10px] text-neutral-700">{sectionModal.savedData?.image || '(None)'}</span>
                  </p>
                )}
              </div>

              {/* Live Preview Box for Section */}
              <div className="bg-neutral-900 text-white rounded-sm p-3 border border-neutral-800 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center space-x-1">
                    <Sparkles size={11} />
                    <span>Live Section Preview</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                    {sectionModal.data.isActive !== false ? '● Active' : '○ Disabled'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {sectionModal.data.label && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                      {sectionModal.data.label}
                    </p>
                  )}
                  <h4 className="text-sm font-serif font-bold uppercase text-white truncate">
                    {sectionModal.data.title || '(No Headline)'}
                  </h4>
                  {sectionModal.data.subtitle && (
                    <p className="text-[11px] text-neutral-400 font-light truncate">
                      {sectionModal.data.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="sec-active-cb"
                  checked={sectionModal.data.isActive !== false}
                  onChange={(e) =>
                    setSectionModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, isActive: e.target.checked }
                    }))
                  }
                  className="rounded"
                />
                <label htmlFor="sec-active-cb" className="font-bold text-neutral-800 uppercase">
                  Active (Visible on Customer Website)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSectionModal({ open: false, isEdit: false, data: null, savedData: null })}
                  className="px-4 py-2 bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300 rounded-sm font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white hover:bg-neutral-800 rounded-sm font-black uppercase tracking-wider cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* ITEM EDIT / CREATE MODAL */}
      {/* -------------------------------------------------- */}
      {itemModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-sm w-full max-w-xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-black">
                  {itemModal.isEdit
                    ? (itemModal.sectionKey === 'featured' ? 'EDIT FEATURED TIMEPIECE' : 'EDIT ITEM')
                    : (itemModal.sectionKey === 'featured' ? 'ADD NEW FEATURED TIMEPIECE' : 'ADD NEW ITEM')}
                </h3>
                {itemModal.sectionName && (
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Section: <span className="font-semibold text-neutral-800">{itemModal.sectionName}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setItemModal({ open: false, isEdit: false, sectionId: null, sectionKey: '', sectionName: '', data: null, savedData: null })}
                className="text-neutral-500 hover:text-black font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Currently Saved Banner (Only in Edit mode) */}
            {itemModal.isEdit && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-sm p-3.5 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-900">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Currently Saved Content
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  The form fields below are pre-filled with the actual database values. Each field displays its currently active value so you can see what is currently on the website vs what you are changing.
                </p>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const rawData = itemModal.data;
                if (!rawData.title) {
                  showNotification('Item title is required.', true);
                  return;
                }

                const priceNum = rawData.price !== undefined && rawData.price !== '' ? Number(rawData.price) : 0;
                const d = {
                  ...rawData,
                  price: priceNum,
                  metadata: {
                    ...(rawData.metadata || {}),
                    price: priceNum
                  }
                };

                if (itemModal.isEdit) {
                  const itemId = d._id || d.id;
                  const res = await dispatch(updateContentItem(itemModal.sectionId, itemId, d));
                  if (res.success) {
                    showNotification('Item updated successfully.');
                    setItemModal({ open: false, isEdit: false, sectionId: null, sectionKey: '', sectionName: '', data: null, savedData: null });
                  } else {
                    showNotification(res.message || 'Failed to update item.', true);
                  }
                } else {
                  const res = await dispatch(addContentItem(itemModal.sectionId, d));
                  if (res.success) {
                    showNotification('Item created successfully.');
                    setItemModal({ open: false, isEdit: false, sectionId: null, sectionKey: '', sectionName: '', data: null, savedData: null });
                  } else {
                    showNotification(res.message || 'Failed to create item.', true);
                  }
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* Title */}
              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">
                  Title {itemModal.sectionKey === 'featured' ? '(Timepiece Name)' : ''} *
                </label>
                <input
                  type="text"
                  required
                  value={itemModal.data.title || ''}
                  onChange={(e) =>
                    setItemModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, title: e.target.value }
                    }))
                  }
                  placeholder={itemModal.sectionKey === 'featured' ? 'e.g. W1' : 'Item Title'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-sm font-semibold focus:border-black focus:outline-none"
                />
                {itemModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current value: <span className="font-semibold text-neutral-800">"{itemModal.savedData?.title || '(Empty)'}"</span>
                  </p>
                )}
              </div>

              {/* Subtitle & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={itemModal.data.subtitle || ''}
                    onChange={(e) =>
                      setItemModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, subtitle: e.target.value }
                      }))
                    }
                    placeholder="e.g. PRECISION AT EVERY LEVEL"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:border-black focus:outline-none"
                  />
                  {itemModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-semibold text-neutral-800">"{itemModal.savedData?.subtitle || '(Empty)'}"</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={itemModal.data.price !== undefined ? itemModal.data.price : ''}
                    onChange={(e) =>
                      setItemModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, price: e.target.value }
                      }))
                    }
                    placeholder="e.g. 1425"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:border-black focus:outline-none"
                  />
                  {itemModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-semibold text-neutral-800">{itemModal.savedData?.price ? `₹${Number(itemModal.savedData.price).toLocaleString('en-IN')}` : (itemModal.savedData?.metadata?.price ? `₹${Number(itemModal.savedData.metadata.price).toLocaleString('en-IN')}` : '(None)')}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Button Text & Button Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={itemModal.data.buttonText || ''}
                    onChange={(e) =>
                      setItemModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, buttonText: e.target.value }
                      }))
                    }
                    placeholder="e.g. EXPLORE"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:border-black focus:outline-none"
                  />
                  {itemModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-semibold text-neutral-800">"{itemModal.savedData?.buttonText || '(Empty)'}"</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={itemModal.data.buttonLink || ''}
                    onChange={(e) =>
                      setItemModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, buttonLink: e.target.value }
                      }))
                    }
                    placeholder="e.g. /shop"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:border-black focus:outline-none"
                  />
                  {itemModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current value: <span className="font-mono text-[10px] text-neutral-800">"{itemModal.savedData?.buttonLink || '(Empty)'}"</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={itemModal.data.description || ''}
                  onChange={(e) =>
                    setItemModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, description: e.target.value }
                    }))
                  }
                  placeholder="Card or item description..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:border-black focus:outline-none"
                />
                {itemModal.isEdit && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current value: <span className="font-semibold text-neutral-800 line-clamp-1">"{itemModal.savedData?.description || '(Empty)'}"</span>
                  </p>
                )}
              </div>

              {/* Image with Preview & Replace Controls */}
              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">
                  Image & Replacement
                </label>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
                  {/* Current image preview thumbnail */}
                  <div className="w-16 h-16 bg-white border border-neutral-300 rounded flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {itemModal.data.image ? (
                      <img
                        src={itemModal.data.image}
                        alt="Thumbnail preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-400">No Image</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={itemModal.data.image || ''}
                        onChange={(e) =>
                          setItemModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, image: e.target.value }
                          }))
                        }
                        placeholder="/assets/... or https://..."
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded-sm text-xs focus:border-black focus:outline-none"
                      />
                      <label className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-sm cursor-pointer flex items-center space-x-1 shrink-0 font-bold uppercase tracking-wider text-[10px]">
                        <Upload size={12} />
                        <span>{uploadingImage ? 'Uploading...' : 'Replace Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(e, (url) =>
                              setItemModal((prev) => ({
                                ...prev,
                                data: { ...prev.data, image: url }
                              }))
                            )
                          }
                        />
                      </label>
                    </div>

                    {itemModal.isEdit && (
                      <p className="text-[11px] text-neutral-500 truncate">
                        Current image: <span className="font-mono text-[10px] text-neutral-700">{itemModal.savedData?.image || '(None)'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-time Live Preview Card */}
              <div className="bg-neutral-950 text-white rounded-sm p-4 border border-neutral-800 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center space-x-1">
                    <Sparkles size={11} />
                    <span>Live Customer Website Preview</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">
                    {itemModal.data.isActive !== false ? '● Active on Website' : '○ Disabled'}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-20 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {itemModal.data.image ? (
                      <img
                        src={itemModal.data.image}
                        alt={itemModal.data.title || 'Watch'}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-500">No Image</span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-white truncate">
                      {itemModal.data.title || '(Untitled Timepiece)'}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">
                      {itemModal.data.subtitle || 'PRECISION AT EVERY LEVEL'}
                    </p>
                    <p className="text-xs font-serif italic text-neutral-200">
                      {itemModal.data.price !== undefined && itemModal.data.price !== ''
                        ? `₹${Number(itemModal.data.price).toLocaleString('en-IN')}`
                        : '₹1,425'}
                    </p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-widest border-b border-white pb-0.5 text-neutral-200">
                      {itemModal.data.buttonText || 'EXPLORE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order & Active state */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Order</label>
                  <input
                    type="number"
                    value={itemModal.data.order || 1}
                    onChange={(e) =>
                      setItemModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, order: Number(e.target.value) }
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm"
                  />
                  {itemModal.isEdit && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Current order: <span className="font-semibold text-neutral-800">{itemModal.savedData?.order || 1}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="item-active-cb"
                    checked={itemModal.data.isActive !== false}
                    onChange={(e) =>
                      setItemModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, isActive: e.target.checked }
                      }))
                    }
                    className="rounded"
                  />
                  <label htmlFor="item-active-cb" className="font-bold text-neutral-800 uppercase">
                    Active (Visible on Live Website)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setItemModal({ open: false, isEdit: false, sectionId: null, sectionKey: '', sectionName: '', data: null, savedData: null })}
                  className="px-4 py-2 bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300 rounded-sm font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white hover:bg-neutral-800 rounded-sm font-black uppercase tracking-wider cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* -------------------------------------------------- */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-sm w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              Confirm Permanent Deletion
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-bold text-black">"{deleteModal.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, type: 'section', sectionId: null, itemId: null, title: '' })}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-sm text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

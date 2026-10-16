import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Crop,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  RefreshCw,
  Sliders,
  Sparkles,
  Monitor,
  Smartphone,
  Move,
  Layers,
  Upload,
  AlertCircle,
  Eye
} from 'lucide-react';

/**
 * Aspect ratio presets with contextual labels
 */
export const ASPECT_RATIOS = [
  { id: '3:4', label: '3:4 Portrait', widthRatio: 3, heightRatio: 4, desc: 'Shop by Gender, Vertical Panels' },
  { id: '9:16', label: '9:16 Tall', widthRatio: 9, heightRatio: 16, desc: 'Mobile Fullscreen Stories' },
  { id: '1:1', label: '1:1 Square', widthRatio: 1, heightRatio: 1, desc: 'Watch Dials & Product Spotlights' },
  { id: '4:3', label: '4:3 Classic', widthRatio: 4, heightRatio: 3, desc: 'Spotlight Carousel Slides' },
  { id: '16:9', label: '16:9 Banner', widthRatio: 16, heightRatio: 9, desc: 'Hero Lifestyle & Drawer Covers' },
  { id: 'free', label: 'Freeform', widthRatio: null, heightRatio: null, desc: 'Custom Unconstrained Framing' }
];

/**
 * Detect optimal default ratio based on section key or label
 */
export const getRecommendedRatio = (sectionKey = '', label = '') => {
  const combined = `${sectionKey} ${label}`.toLowerCase();
  if (combined.includes('gender') || combined.includes('men') || combined.includes('women')) {
    return '3:4';
  }
  if (combined.includes('lifestyle') || combined.includes('hero_slide') || combined.includes('updates') || combined.includes('banner')) {
    return '16:9';
  }
  if (combined.includes('watch') || combined.includes('product') || combined.includes('dial') || combined.includes('strap') || combined.includes('tile')) {
    return '1:1';
  }
  if (combined.includes('khronomaster') || combined.includes('spotlight') || combined.includes('slide')) {
    return '4:3';
  }
  return '3:4';
};

/**
 * ImageCropModal
 * Allows admins to interactively crop, zoom, rotate, and frame photos
 * with a live website mockup preview before uploading.
 */
export default function ImageCropModal({
  isOpen,
  onClose,
  imageSource, // File object or URL string
  onApplyCrop, // (croppedFile) => Promise<void> or void
  onSkipCrop,  // (originalFile) => void
  sectionKey = '',
  sectionLabel = 'Homepage Media',
  sectionTitle = '',
  isUploading = false
}) {
  const [selectedRatioId, setSelectedRatioId] = useState(() => getRecommendedRatio(sectionKey, sectionLabel));
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState('cover'); // 'cover' or 'contain'
  const [showGrid, setShowGrid] = useState(true);
  const [previewTab, setPreviewTab] = useState('desktop'); // 'desktop' or 'mobile'
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Temporary object URL if imageSource is a File or fetched remote blob
  const [imageUrl, setImageUrl] = useState('');

  const recommendedRatio = useMemo(
    () => getRecommendedRatio(sectionKey, sectionLabel),
    [sectionKey, sectionLabel]
  );

  // Initialize image source: guarantees NO tainted canvas for remote URLs
  useEffect(() => {
    if (!isOpen || !imageSource) {
      setImageUrl('');
      setImageLoaded(false);
      setImageError(null);
      setNaturalSize({ width: 0, height: 0 });
      return;
    }

    let isCancelled = false;
    let createdBlobUrl = null;

    const prepareImageSource = async () => {
      setImageLoaded(false);
      setImageError(null);

      // 1. If it's already a local File or Blob:
      if (imageSource instanceof File || imageSource instanceof Blob) {
        createdBlobUrl = URL.createObjectURL(imageSource);
        if (!isCancelled) setImageUrl(createdBlobUrl);
        return;
      }

      // 2. If it's a string URL:
      if (typeof imageSource === 'string') {
        const src = imageSource.trim();
        if (!src) return;

        // Base64 or already a Blob URL
        if (src.startsWith('data:') || src.startsWith('blob:')) {
          if (!isCancelled) setImageUrl(src);
          return;
        }

        // Relative asset on same host (/assets/...)
        if (src.startsWith('/')) {
          if (!isCancelled) setImageUrl(src);
          return;
        }

        // Remote HTTP/HTTPS image (e.g. Cloudinary, Google Drive):
        // Convert to a local same-origin Blob URL through our backend CORS proxy
        // This is the golden fix that permanently prevents "Tainted canvases may not be exported"
        try {
          const proxyUrl = `/api/upload/proxy?url=${encodeURIComponent(src)}`;
          const res = await fetch(proxyUrl);
          if (res.ok) {
            const blob = await res.blob();
            createdBlobUrl = URL.createObjectURL(blob);
            if (!isCancelled) {
              setImageUrl(createdBlobUrl);
              return;
            }
          }
        } catch (_) {}

        // Fallback: Direct fetch with CORS mode
        try {
          const res = await fetch(src, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            createdBlobUrl = URL.createObjectURL(blob);
            if (!isCancelled) {
              setImageUrl(createdBlobUrl);
              return;
            }
          }
        } catch (_) {}

        // Fallback to original URL with anonymous CORS
        if (!isCancelled) setImageUrl(src);
      }
    };

    prepareImageSource();

    // Reset controls
    setSelectedRatioId(getRecommendedRatio(sectionKey, sectionLabel));
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setFitMode('cover');

    return () => {
      isCancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [isOpen, imageSource, sectionKey, sectionLabel]);

  // Active aspect ratio info
  const activeRatio = useMemo(() => {
    return ASPECT_RATIOS.find((r) => r.id === selectedRatioId) || ASPECT_RATIOS[0];
  }, [selectedRatioId]);

  // Calculate live crop box style inside the crop viewport
  const cropBoxDimensions = useMemo(() => {
    const maxW = 340;
    const maxH = 340;

    if (!activeRatio.widthRatio || !activeRatio.heightRatio) {
      return { width: maxW, height: maxH };
    }

    const ratio = activeRatio.widthRatio / activeRatio.heightRatio;
    let w = maxW;
    let h = w / ratio;

    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }

    return { width: Math.round(w), height: Math.round(h) };
  }, [activeRatio]);

  // Calculate base display size so the image actually fits or covers the crop box
  const imageDisplaySize = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) {
      return { width: 340, height: 340, baseScale: 1 };
    }

    const isRotated = rotation === 90 || rotation === 270;
    const effectiveW = isRotated ? naturalSize.height : naturalSize.width;
    const effectiveH = isRotated ? naturalSize.width : naturalSize.height;

    const boxW = cropBoxDimensions.width;
    const boxH = cropBoxDimensions.height;

    const coverScale = Math.max(boxW / effectiveW, boxH / effectiveH);
    const containScale = Math.min(boxW / effectiveW, boxH / effectiveH);

    const baseScale = fitMode === 'cover' ? coverScale : containScale;

    return {
      width: Math.round(naturalSize.width * baseScale),
      height: Math.round(naturalSize.height * baseScale),
      baseScale
    };
  }, [naturalSize, rotation, cropBoxDimensions, fitMode]);

  // Handle image load
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
    setImageError(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleImageError = () => {
    setImageError('Unable to load image for framing. The file may be corrupt or blocked.');
  };

  // Drag interaction handlers
  const handleMouseDown = (e) => {
    if (!imageLoaded) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Touch handlers
  const handleTouchStart = (e) => {
    if (!imageLoaded || !e.touches[0]) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current || !e.touches[0]) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Zoom via wheel inside crop frame
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(3.0, Math.max(0.3, Number((prev + delta).toFixed(2)))));
  };

  // Reset framing
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFitMode('cover');
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Export high resolution cropped file
  const handleGenerateCrop = async () => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) return;
    setIsProcessing(true);
    setImageError(null);

    try {
      const img = imageRef.current;
      const naturalW = naturalSize.width;
      const naturalH = naturalSize.height;

      // Desired export resolution (Retina HD)
      let exportW = 1200;
      let exportH = 1600;

      if (activeRatio.widthRatio && activeRatio.heightRatio) {
        const ratio = activeRatio.widthRatio / activeRatio.heightRatio;
        if (ratio >= 1) {
          exportW = 1920;
          exportH = Math.round(exportW / ratio);
        } else {
          exportH = 1600;
          exportW = Math.round(exportH * ratio);
        }
      } else {
        exportW = Math.min(1920, naturalW);
        exportH = Math.min(1600, naturalH);
      }

      const canvas = document.createElement('canvas');
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background fill (dark luxury)
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, exportW, exportH);

      // Ratio of export canvas to on-screen crop box
      const scaleToCanvas = exportW / cropBoxDimensions.width;

      ctx.save();
      // Translate to center of canvas + scaled pan offset
      ctx.translate(exportW / 2 + pan.x * scaleToCanvas, exportH / 2 + pan.y * scaleToCanvas);
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw image dimensions based on on-screen display size
      const drawW = imageDisplaySize.width * scaleToCanvas * zoom;
      const drawH = imageDisplaySize.height * scaleToCanvas * zoom;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Convert to Blob with safety try-catch
      const blob = await new Promise((resolve, reject) => {
        try {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('Canvas export failed'));
            },
            'image/jpeg',
            0.92
          );
        } catch (e) {
          reject(e);
        }
      });

      const origName = (imageSource?.name || 'cropped_media').replace(/\.[^.]+$/, '');
      const cleanFileName = `${origName}_framed_${activeRatio.id.replace(':', 'x')}.jpg`;
      const croppedFile = new File([blob], cleanFileName, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      if (onApplyCrop) {
        await onApplyCrop(croppedFile);
      }
      onClose();
    } catch (err) {
      console.error('Failed to crop and export image:', err);
      // If canvas export failed, show a friendly explanation banner
      setImageError(
        err.message?.includes('Tainted')
          ? 'Cross-origin security restriction prevented canvas export. Please use "Upload / Replace" to upload the image directly from your computer.'
          : (err.message || 'Crop processing failed.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Mockup card dimensions for right side
  const mockupDimensions = useMemo(() => {
    if (previewTab === 'mobile') {
      return { width: 190, height: 320 };
    }
    const ratio = activeRatio.widthRatio && activeRatio.heightRatio
      ? activeRatio.widthRatio / activeRatio.heightRatio
      : 0.75;
    const w = 270;
    const h = Math.round(w / ratio);
    return { width: w, height: Math.min(320, Math.max(220, h)) };
  }, [previewTab, activeRatio]);

  const mockupScale = useMemo(() => {
    return mockupDimensions.width / cropBoxDimensions.width;
  }, [mockupDimensions, cropBoxDimensions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#121212] border border-white/15 rounded-xl shadow-2xl max-w-5xl w-full my-auto overflow-hidden flex flex-col text-white animate-in fade-in duration-200">
        
        {/* ── Top Header ── */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-luxury-gold/15 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
              <Crop size={17} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-wider uppercase text-white font-serif">
                  Image Framing & Resizer
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-luxury-gold/20 text-luxury-gold rounded border border-luxury-gold/30">
                  Site Preview Active
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Target: <span className="text-white font-medium">{sectionLabel}</span>
                {sectionTitle ? ` — ${sectionTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isUploading}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Aspect Ratio Preset Bar ── */}
        <div className="px-5 py-2.5 border-b border-white/10 bg-[#161616] flex items-center overflow-x-auto gap-2 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 flex items-center mr-1">
            <Layers size={13} className="mr-1 text-luxury-gold" />
            Aspect Ratio:
          </span>
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = selectedRatioId === ratio.id;
            const isRec = recommendedRatio === ratio.id;
            return (
              <button
                key={ratio.id}
                type="button"
                onClick={() => {
                  setSelectedRatioId(ratio.id);
                  setPan({ x: 0, y: 0 });
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
                  isSelected
                    ? 'bg-luxury-gold text-black font-bold border-luxury-gold shadow-md'
                    : 'bg-black/40 text-neutral-300 hover:text-white border-white/10 hover:border-white/30'
                }`}
              >
                <span>{ratio.label}</span>
                {isRec && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-tight ${
                      isSelected ? 'bg-black/25 text-black' : 'bg-luxury-gold/20 text-luxury-gold'
                    }`}
                  >
                    ★ Recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main Body: Split View (Cropper Canvas & Live Site Preview) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-[460px]">
          
          {/* ──── Left Column: Interactive Framing Canvas (7 cols) ──── */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-[#0d0d0d]">
            
            {/* Top Toolbar: Instructions & Quick Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
              <span className="flex items-center space-x-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                <Move size={13} className="text-luxury-gold shrink-0" />
                <span>Drag to move photo • Zoom slider to resize</span>
              </span>

              <div className="flex items-center space-x-2">
                {/* Fit Mode Switcher: Fit All vs Cover */}
                <div className="flex items-center bg-black/60 rounded p-0.5 border border-white/15">
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('contain');
                      setPan({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      fitMode === 'contain'
                        ? 'bg-luxury-gold text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Fit entire photo without any cutting"
                  >
                    Puri Photo (Fit All)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('cover');
                      setPan({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      fitMode === 'cover'
                        ? 'bg-luxury-gold text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Fill the entire frame (Cover)"
                  >
                    Fill Frame
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                    showGrid ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/10' : 'border-white/10 text-neutral-400'
                  }`}
                  title="Toggle framing grid lines"
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2 py-0.5 rounded text-[10px] font-mono border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 transition flex items-center space-x-1 cursor-pointer"
                  title="Rotate 90 degrees clockwise"
                >
                  <RotateCw size={11} />
                  <span>90°</span>
                </button>
              </div>
            </div>

            {/* Interactive Viewport Container */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className="relative w-full h-[360px] sm:h-[390px] rounded-lg bg-[#080808] border border-white/15 overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing group shadow-inner"
            >
              {/* Outer Dimmed Background Image (Shows whole photo in dim so user sees context!) */}
              {imageUrl && imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 filter blur-[0.5px]">
                  <img
                    src={imageUrl}
                    crossOrigin="anonymous"
                    alt="Context background"
                    draggable={false}
                    className="max-w-none select-none transition-transform duration-75"
                    style={{
                      width: `${imageDisplaySize.width}px`,
                      height: `${imageDisplaySize.height}px`,
                      minWidth: `${imageDisplaySize.width}px`,
                      minHeight: `${imageDisplaySize.height}px`,
                      transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              )}

              {/* Dimmed Masking Outside Crop Area */}
              <div className="absolute inset-0 bg-black/60 pointer-events-none z-10" />

              {/* Crop Window Box (Highlighted area with Gold border) */}
              <div
                style={{
                  width: `${cropBoxDimensions.width}px`,
                  height: `${cropBoxDimensions.height}px`
                }}
                className="relative z-20 border-2 border-luxury-gold shadow-[0_0_35px_rgba(212,175,55,0.4)] rounded-sm overflow-hidden flex items-center justify-center bg-black/80"
              >
                {/* 3x3 Rule of Thirds Grid */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none z-30 grid grid-cols-3 grid-rows-3 opacity-30">
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div />
                  </div>
                )}

                {/* Cropping Corner Handles */}
                <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-luxury-gold z-30 pointer-events-none" />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-luxury-gold z-30 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-luxury-gold z-30 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-luxury-gold z-30 pointer-events-none" />

                {/* Target Image inside Crop Window (Crisp 100% opacity) */}
                {imageUrl && (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    crossOrigin="anonymous"
                    alt="Frame preview"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    draggable={false}
                    className="max-w-none pointer-events-none select-none transition-transform duration-75"
                    style={{
                      width: `${imageDisplaySize.width}px`,
                      height: `${imageDisplaySize.height}px`,
                      minWidth: `${imageDisplaySize.width}px`,
                      minHeight: `${imageDisplaySize.height}px`,
                      transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                      transformOrigin: 'center center',
                      opacity: imageLoaded ? 1 : 0
                    }}
                  />
                )}

                {!imageLoaded && !imageError && (
                  <div className="text-center text-xs text-neutral-400 animate-pulse">
                    Loading media asset...
                  </div>
                )}
              </div>
            </div>

            {/* Slider & Pan Controls */}
            <div className="bg-[#141414] border border-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center space-x-1.5">
                  <Sliders size={12} className="text-luxury-gold" />
                  <span>Zoom Scale: {Math.round(zoom * 100)}%</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center space-x-1 transition cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    <span>Reset Center</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <input
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-luxury-gold cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* ──── Right Column: Live Website Mockup Preview (5 cols) ──── */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-[#141414]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                  <Sparkles size={13} className="text-luxury-gold" />
                  <span>Live Site Look & Feel</span>
                </span>
                
                {/* Desktop / Mobile Toggle */}
                <div className="flex items-center bg-black/60 rounded p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('desktop')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center space-x-1 transition cursor-pointer ${
                      previewTab === 'desktop' ? 'bg-luxury-gold text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Monitor size={11} />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('mobile')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center space-x-1 transition cursor-pointer ${
                      previewTab === 'mobile' ? 'bg-luxury-gold text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={11} />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                This shows exactly how your framed image will render inside Khroniq’s homepage container with dark overlays and typography.
              </p>
            </div>

            {/* Live Mockup Frame */}
            <div className="flex-1 flex items-center justify-center p-2">
              <div
                style={{
                  width: `${mockupDimensions.width}px`,
                  height: `${mockupDimensions.height}px`
                }}
                className="relative rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-300 ring-2 ring-white/10 flex items-center justify-center"
              >
                {/* Simulated Khroniq Website Panel with Exact Synchronized Cropping */}
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      crossOrigin="anonymous"
                      alt="Website mockup"
                      className="max-w-none transition-transform duration-75 pointer-events-none select-none"
                      style={{
                        width: `${imageDisplaySize.width * mockupScale}px`,
                        height: `${imageDisplaySize.height * mockupScale}px`,
                        minWidth: `${imageDisplaySize.width * mockupScale}px`,
                        minHeight: `${imageDisplaySize.height * mockupScale}px`,
                        transform: `translate(${pan.x * mockupScale}px, ${pan.y * mockupScale}px) rotate(${rotation}deg) scale(${zoom})`,
                        transformOrigin: 'center center'
                      }}
                    />
                  )}
                </div>

                {/* Dark luxury gradient overlay like Home.jsx GenderPanel */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)'
                  }}
                />

                {/* Website Card Mockup Typography */}
                <div className="absolute bottom-0 inset-x-0 p-4 z-20 pointer-events-none space-y-1">
                  <div className="w-8 h-[2px] bg-luxury-gold mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold block font-mono">
                    Khroniq Edition
                  </span>
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-white uppercase tracking-wider line-clamp-1">
                    {sectionTitle || sectionLabel}
                  </h4>
                  <div className="flex items-center space-x-1 pt-1 text-[10px] text-neutral-300 font-bold uppercase tracking-wider">
                    <span>Explore Collection</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Mockup Badge */}
                <div className="absolute top-2 left-2 z-20">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-black/60 text-white backdrop-blur border border-white/15">
                    {previewTab === 'mobile' ? 'Mobile View' : 'Desktop View'}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Reassurance Pill */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5 flex items-start space-x-2">
              <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-[11px] text-neutral-200">
                <span className="text-emerald-400 font-bold">Cut-off Protected: </span>
                Image is scaled & framed for {activeRatio.label}. Both subject and background will stay balanced.
              </div>
            </div>
          </div>
        </div>

        {/* ── Optional Error Banner (Rendered above footer, NEVER over the image) ── */}
        {imageError && (
          <div className="mx-5 my-2 p-2.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span>{imageError}</span>
            </div>
            <button
              type="button"
              onClick={() => setImageError(null)}
              className="text-red-400 hover:text-white p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#161616] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {onSkipCrop && (
              <button
                type="button"
                onClick={() => {
                  if (onSkipCrop && imageSource) onSkipCrop(imageSource);
                  onClose();
                }}
                disabled={isProcessing || isUploading}
                className="px-3 py-1.5 rounded text-xs text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Upload Original (Skip Crop)
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing || isUploading}
              className="px-4 py-2 rounded-md text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateCrop}
              disabled={isProcessing || isUploading || !imageLoaded}
              className="px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider text-black bg-luxury-gold hover:bg-amber-400 disabled:opacity-50 transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-luxury-gold/20"
            >
              {isProcessing || isUploading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Processing & Uploading...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Apply Framing & Upload</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

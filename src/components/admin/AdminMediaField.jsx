import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Film, Upload, X, ExternalLink, AlertCircle, Eye, Check, Edit3 } from 'lucide-react';

/**
 * AdminMediaField
 * Universal media editor & preview component for Admin CMS panels.
 */
export default function AdminMediaField({
  label = 'Media Asset',
  value = '',
  onChange,
  onUpload,
  uploading = false,
  isVideo = false,
  allowVideo = true,
  placeholder = 'https://... or /assets/...',
  helperText,
  required = false,
  onBlur,
  title = '',
  onTitleChange,
  onTitleBlur,
  titlePlaceholder = '',
  allowTitleEdit = false,
  titleStatus = null
}) {
  const [hasError, setHasError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Auto-detect video from URL or prop
  const cleanVal = (value || '').trim();
  const detectedVideo = isVideo || (allowVideo && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(cleanVal));

  useEffect(() => {
    setHasError(false);
  }, [cleanVal]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUpload) {
      const uploadedUrl = await onUpload(file);
      if (uploadedUrl && onChange) {
        onChange(uploadedUrl);
      }
    }
  };

  const handleOpenLink = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!cleanVal) return;

    if (cleanVal.startsWith('data:')) {
      try {
        const parts = cleanVal.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (detectedVideo ? 'video/mp4' : 'image/jpeg');
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        const newTab = window.open('');
        if (newTab) {
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>${title || label || 'Preview'}</title></head>
              <body style="margin:0;background:#0d0d0d;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                ${detectedVideo ? `<video src="${cleanVal}" controls style="max-width:90vw;max-height:90vh;"></video>` : `<img src="${cleanVal}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;" />`}
              </body>
            </html>
          `);
          newTab.document.close();
        }
      }
    } else {
      window.open(cleanVal, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white block truncate">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          {title && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-luxury-gold/15 text-luxury-gold rounded border border-luxury-gold/30 shrink-0">
              {title}
            </span>
          )}
        </div>
        {cleanVal && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-[10px] text-gray-200 hover:text-white flex items-center space-x-1 cursor-pointer transition"
              title="Enlarge preview"
            >
              <Eye size={11} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => onChange && onChange('')}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer transition"
              title="Clear media"
            >
              <X size={11} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Media Preview & Input Container */}
      <div className="flex flex-col sm:flex-row gap-3 items-start p-3 bg-luxury-dark/90 border border-white/10 rounded-md">
        
        {/* Compact Media Preview Box (80-140px) */}
        <div className="w-28 h-24 sm:w-32 sm:h-28 rounded border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center relative shrink-0 group">
          {cleanVal ? (
            detectedVideo ? (
              hasError ? (
                <div className="p-2 text-center text-[10px] text-red-400 flex flex-col items-center justify-center space-y-1">
                  <AlertCircle size={16} />
                  <span className="text-[9px] leading-tight">Video unavailable</span>
                </div>
              ) : (
                <video
                  src={cleanVal}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                  onError={() => setHasError(true)}
                />
              )
            ) : hasError ? (
              <div className="p-2 text-center text-[10px] text-gray-400 flex flex-col items-center justify-center space-y-1">
                <AlertCircle size={16} className="text-white/70" />
                <span className="text-[9px] leading-tight">Preview unavailable</span>
              </div>
            ) : (
              <img
                src={cleanVal}
                alt={title || label}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                onError={() => setHasError(true)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 space-y-1 p-2 text-center">
              {detectedVideo ? <Film size={18} className="opacity-60 text-neutral-400" /> : <ImageIcon size={18} className="opacity-60 text-neutral-400" />}
              <span className="text-[9px] uppercase tracking-wider text-neutral-300 font-mono font-bold">No Media</span>
            </div>
          )}

          {cleanVal && !hasError && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
            >
              <Eye size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Media Inputs & Controls */}
        <div className="flex-1 space-y-2 w-full">
          {(allowTitleEdit || onTitleChange) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-neutral-700 font-mono font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Edit3 size={11} className="text-luxury-gold inline mr-0.5" />
                  <span>Media Name / Title</span>
                </span>
                {titleStatus === 'saving' && (
                  <span className="text-[9px] text-luxury-gold font-mono animate-pulse">Saving title...</span>
                )}
                {titleStatus === 'saved' && (
                  <span className="text-[9px] text-emerald-600 font-mono font-bold flex items-center space-x-0.5">
                    <Check size={10} className="inline mr-0.5 text-emerald-600" /> Saved
                  </span>
                )}
                {titleStatus === 'failed' && (
                  <span className="text-[9px] text-red-600 font-mono font-bold">Save failed</span>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                onBlur={onTitleBlur}
                placeholder={titlePlaceholder || 'e.g. CRIMSON RED / Custom Title'}
                className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-luxury-gold transition mb-1"
              />
            </div>
          )}

          <div>
            <span className="text-[10px] text-neutral-700 font-mono font-bold uppercase tracking-wider block mb-1">
              {detectedVideo ? 'Video URL' : 'Image URL'}
            </span>
            <input
              type="text"
              value={cleanVal}
              onChange={(e) => onChange && onChange(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
              className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onUpload && (
              <label
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded border border-neutral-700 hover:border-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                style={{ color: '#ffffff' }}
              >
                <Upload size={12} className="text-white shrink-0" style={{ color: '#ffffff' }} />
                <span className="text-white" style={{ color: '#ffffff' }}>
                  {uploading ? 'Uploading...' : 'Upload / Replace'}
                </span>
                <input
                  type="file"
                  accept={allowVideo ? 'image/*,video/*' : 'image/*'}
                  disabled={uploading}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            {cleanVal && (
              <button
                type="button"
                onClick={handleOpenLink}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded border border-neutral-300 text-[10px] transition flex items-center space-x-1 cursor-pointer"
                title="Open image in new tab"
              >
                <ExternalLink size={11} />
                <span>Open Link</span>
              </button>
            )}
          </div>

          {helperText && (
            <p className="text-[10px] text-neutral-600 font-medium italic">
              {helperText}
            </p>
          )}
        </div>
      </div>

      {/* Enlarged Modal Preview */}
      {showModal && cleanVal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-luxury-dark border border-white/20 rounded-md p-4 max-w-2xl w-full space-y-3 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                {detectedVideo ? <Film size={14} className="text-white" /> : <ImageIcon size={14} className="text-white" />}
                <span>{label} Preview</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleOpenLink}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition cursor-pointer flex items-center space-x-1"
                  title="Open full resolution in a new tab"
                >
                  <ExternalLink size={12} />
                  <span>Open Full</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white cursor-pointer p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-hidden rounded bg-black/60 flex items-center justify-center p-2 border border-white/5 relative">
              {detectedVideo ? (
                <video src={cleanVal} controls className="max-h-[55vh] max-w-full rounded" />
              ) : (
                <img
                  src={cleanVal}
                  alt={label}
                  className="max-h-[55vh] max-w-full object-contain rounded"
                  onError={() => setHasError(true)}
                />
              )}
            </div>

            {cleanVal.startsWith('data:') ? (
              <div className="flex items-center justify-between text-[11px] text-gray-300 font-mono bg-black/40 p-2.5 rounded border border-white/5">
                <span className="text-amber-400 font-medium">⚡ Embedded Base64 Image (~{Math.round(cleanVal.length / 1024)} KB)</span>
                <span className="text-[10px] text-gray-400">Click &ldquo;Open Full&rdquo; to view full resolution</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-gray-300 font-mono bg-black/40 p-2 rounded border border-white/5">
                <span className="truncate flex-1 mr-2">{cleanVal}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

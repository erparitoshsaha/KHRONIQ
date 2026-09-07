import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Film, Upload, X, ExternalLink, AlertCircle, Eye } from 'lucide-react';

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
  required = false
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

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-300 block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {cleanVal && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-[10px] text-gray-400 hover:text-white flex items-center space-x-1 cursor-pointer transition"
              title="Enlarge preview"
            >
              <Eye size={11} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => onChange && onChange('')}
              className="text-[10px] text-red-400/80 hover:text-red-300 flex items-center space-x-1 cursor-pointer transition"
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
                alt={label}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                onError={() => setHasError(true)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 space-y-1 p-2 text-center">
              {detectedVideo ? <Film size={18} className="opacity-40" /> : <ImageIcon size={18} className="opacity-40" />}
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">No Media</span>
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
          <div>
            <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider block mb-1">
              {detectedVideo ? 'Video URL' : 'Image URL'}
            </span>
            <input
              type="text"
              value={cleanVal}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onUpload && (
              <label className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded border border-neutral-600 hover:border-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5">
                <Upload size={12} />
                <span>{uploading ? 'Uploading...' : 'Upload / Replace'}</span>
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
              <a
                href={cleanVal}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/10 text-[10px] font-medium transition flex items-center space-x-1"
              >
                <ExternalLink size={11} />
                <span>Open Link</span>
              </a>
            )}
          </div>

          {helperText && (
            <p className="text-[10px] text-gray-400 italic">
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
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-hidden rounded bg-black/60 flex items-center justify-center p-2 border border-white/5">
              {detectedVideo ? (
                <video src={cleanVal} controls className="max-h-[55vh] max-w-full rounded" />
              ) : (
                <img src={cleanVal} alt={label} className="max-h-[55vh] max-w-full object-contain rounded" />
              )}
            </div>

            <div className="text-[11px] text-gray-300 font-mono break-all bg-black/40 p-2 rounded border border-white/5">
              {cleanVal}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

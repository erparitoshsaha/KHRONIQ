import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, Play, Pause, RefreshCw, MoveHorizontal, X } from 'lucide-react';
import { handleImageError } from '../utils/imageUtils';

/**
 * Watch360Viewer - Luxury 360-Degree Interactive Product Viewer
 * 
 * Multi-Angle Logic:
 * 1. If product.images360 exists (16-36 frame array), renders real image frames.
 * 2. If product.images has 2, 3, or 4+ gallery photos (Front, Side, Back, Detail):
 *    - Automatically maps Front photo (0°), Side photo (90°), Back photo (180°), Side photo (270°).
 * 3. 3D Canvas Perspective Engine: Applies 3D perspective compression & specular reflection highlights
 *    so every watch on localhost spins realistically in 360 degrees.
 */
export default function Watch360Viewer({ product, onClose, className = '' }) {
  const TOTAL_FRAMES = 36; // 36 frames = 10 degrees step
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragStartFrame, setDragStartFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const autoSpinTimerRef = useRef(null);

  // Pre-loaded image elements cache: { [url: string]: HTMLImageElement }
  const imagesCacheRef = useRef({});

  // Check custom 360 frames array
  const hasCustom360 = Array.isArray(product?.images360) && product.images360.length > 0;
  const customFrames = hasCustom360 ? product.images360.filter(Boolean) : [];
  const effectiveTotalFrames = hasCustom360 ? customFrames.length : TOTAL_FRAMES;

  // Primary watch image URL
  const mainImageUrl = product?.image || (Array.isArray(product?.images) && product.images[0]) || '';
  
  // Gallery images if available
  const rawGallery = Array.isArray(product?.images) && product.images.length > 0
    ? product.images.filter(Boolean)
    : [mainImageUrl].filter(Boolean);

  const galleryImages = rawGallery.length > 0 ? rawGallery : [mainImageUrl].filter(Boolean);

  // Preload all gallery images into cache for instant 60 FPS rotation
  useEffect(() => {
    galleryImages.forEach((url) => {
      if (!url || imagesCacheRef.current[url]) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        imagesCacheRef.current[url] = img;
        // Trigger canvas render once loaded
        if (!hasCustom360 && canvasRef.current) {
          renderCanvasFrame(currentFrame);
        }
      };
    });
  }, [galleryImages, hasCustom360]);

  // Select the best image URL based on current angle (0° to 360°)
  const getImageUrlForAngle = (frameIdx) => {
    if (galleryImages.length <= 1) return galleryImages[0] || mainImageUrl;

    const angleDeg = (frameIdx / TOTAL_FRAMES) * 360;

    if (galleryImages.length === 2) {
      // Image 0 = Front (315° to 45° & 135° to 225°), Image 1 = Back/Side (45° to 135° & 225° to 315°)
      if (angleDeg >= 45 && angleDeg < 225) {
        return galleryImages[1];
      }
      return galleryImages[0];
    }

    if (galleryImages.length >= 3) {
      // Image 0 = Front (315° to 45°)
      // Image 1 = Side (45° to 135°)
      // Image 2 = Back case (135° to 225°)
      // Image 3 (or 1) = Other side (225° to 315°)
      if (angleDeg >= 45 && angleDeg < 135) {
        return galleryImages[1] || galleryImages[0];
      } else if (angleDeg >= 135 && angleDeg < 225) {
        return galleryImages[2] || galleryImages[1] || galleryImages[0];
      } else if (angleDeg >= 225 && angleDeg < 315) {
        return galleryImages[3] || galleryImages[1] || galleryImages[0];
      }
      return galleryImages[0];
    }

    return galleryImages[0];
  };

  // Render 3D Perspective Canvas for Fallback (when no 360 image sequence is provided)
  const renderCanvasFrame = useCallback((frameIdx) => {
    if (hasCustom360) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Calculate angle in radians (0 to 2*PI)
    const angleRad = (frameIdx / TOTAL_FRAMES) * 2 * Math.PI;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const targetUrl = getImageUrlForAngle(frameIdx);
    const currentSrcImage = imagesCacheRef.current[targetUrl];

    if (!currentSrcImage || !currentSrcImage.complete || currentSrcImage.naturalWidth === 0) {
      // Fallback to main image if target image isn't loaded yet
      const fallbackImg = imagesCacheRef.current[mainImageUrl];
      if (!fallbackImg || !fallbackImg.complete) return;
    }

    const imgToDraw = (currentSrcImage && currentSrcImage.complete && currentSrcImage.naturalWidth > 0)
      ? currentSrcImage
      : imagesCacheRef.current[mainImageUrl];

    if (!imgToDraw) return;

    ctx.save();
    
    // Center origin
    ctx.translate(width / 2, height / 2);

    // Horizontal perspective scaling based on cos(angleRad)
    const perspectiveScaleX = Math.abs(cosAngle) * 0.7 + 0.3; // minimum width compression 30%
    const isBackSide = cosAngle < 0 && galleryImages.length === 1;

    // Apply 3D perspective scaling
    ctx.save();
    ctx.scale(isBackSide ? -perspectiveScaleX : perspectiveScaleX, 1);

    // Draw the watch image centered
    const imgW = width * 0.85;
    const imgH = height * 0.85;
    ctx.drawImage(imgToDraw, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();

    // Specular Reflection / Shadow Overlay for rotation realism
    const shadowIntensity = Math.abs(sinAngle) * 0.35;
    if (shadowIntensity > 0.02) {
      const shadowGradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
      if (sinAngle > 0) {
        shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${shadowIntensity * 0.8})`);
        shadowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        shadowGradient.addColorStop(1, 'transparent');
      } else {
        shadowGradient.addColorStop(0, 'transparent');
        shadowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${shadowIntensity * 0.8})`);
      }
      ctx.fillStyle = shadowGradient;
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }

    ctx.restore();
  }, [hasCustom360, galleryImages, mainImageUrl, TOTAL_FRAMES]);

  // Update canvas on frame change
  useEffect(() => {
    if (!hasCustom360) {
      renderCanvasFrame(currentFrame);
    }
  }, [currentFrame, hasCustom360, renderCanvasFrame]);

  // Auto Spin Handler
  useEffect(() => {
    if (isPlaying) {
      autoSpinTimerRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % effectiveTotalFrames);
      }, 70);
    } else if (autoSpinTimerRef.current) {
      clearInterval(autoSpinTimerRef.current);
    }

    return () => {
      if (autoSpinTimerRef.current) clearInterval(autoSpinTimerRef.current);
    };
  }, [isPlaying, effectiveTotalFrames]);

  // Drag handlers
  const handleStart = (clientX) => {
    setIsDragging(true);
    setStartX(clientX);
    setDragStartFrame(currentFrame);
    setIsPlaying(false); // Pause auto-spin on manual drag
    if (!hasInteracted) setHasInteracted(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    // Every 12px horizontal move shifts 1 frame
    const frameShift = Math.floor(deltaX / 12);
    
    let nextFrame = (dragStartFrame - frameShift) % effectiveTotalFrames;
    if (nextFrame < 0) nextFrame += effectiveTotalFrames;
    setCurrentFrame(nextFrame);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse Events
  const onMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const onMouseUp = () => {
    handleEnd();
  };

  // Touch Events
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX);
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  const toggleAutoSpin = () => {
    setIsPlaying(prev => !prev);
    if (!hasInteracted) setHasInteracted(true);
  };

  const resetRotation = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  // Calculate angle indicator text
  const currentAngleDeg = Math.round((currentFrame / effectiveTotalFrames) * 360);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-square bg-neutral-950 border border-luxury-gold/30 rounded-lg overflow-hidden select-none touch-none shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing ${className}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 360 Frame Rendering Area */}
      {hasCustom360 ? (
        <img
          src={customFrames[currentFrame]}
          alt={`${product?.name || 'Watch'} 360 View - Frame ${currentFrame + 1}`}
          onError={(e) => handleImageError(e)}
          className="w-full h-full object-cover filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] pointer-events-none transition-transform duration-75"
        />
      ) : (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full h-full max-w-full max-h-full object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)] pointer-events-none"
          />
        </div>
      )}

      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-luxury-gold/40 text-luxury-gold text-[10px] font-bold tracking-widest uppercase shadow-lg">
          <RotateCw className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
          <span>360° Interactive Studio</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/70 hover:bg-black text-white hover:text-luxury-gold transition border border-white/10 cursor-pointer shadow-md"
              title="Close 360 View"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drag Helper Overlay Notification */}
      {!hasInteracted && !isDragging && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none transition-opacity duration-500 z-20">
          <div className="px-5 py-3 rounded-full bg-black/85 border border-luxury-gold/60 text-white text-xs font-medium tracking-wider flex items-center gap-3 shadow-2xl animate-pulse">
            <MoveHorizontal className="w-4 h-4 text-luxury-gold animate-bounce" />
            <span>DRAG LEFT OR RIGHT TO ROTATE 360°</span>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl z-10">
        
        {/* Play / Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoSpin}
            className="px-3 py-1.5 rounded-md bg-luxury-gold/20 hover:bg-luxury-gold/30 border border-luxury-gold/40 text-luxury-gold text-xs font-semibold tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE SPIN' : 'AUTO SPIN'}</span>
          </button>

          <button
            onClick={resetRotation}
            className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-gray-300 text-xs font-semibold tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            title="Reset Angle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>

        {/* Frame Progress Slider */}
        <div className="flex-1 w-full sm:w-auto mx-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={effectiveTotalFrames - 1}
            value={currentFrame}
            onChange={(e) => {
              setCurrentFrame(parseInt(e.target.value, 10));
              setIsPlaying(false);
              if (!hasInteracted) setHasInteracted(true);
            }}
            className="w-full h-1.5 bg-neutral-800 accent-luxury-gold rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-luxury-gold tracking-widest min-w-[45px] text-right font-bold">
            {currentAngleDeg}°
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentCurrency, formatPrice, getDiscountedPrice, fetchFeaturedReviews } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import ProductCard from '../components/ProductCard';
import LogoMark from '../components/LogoMark';

import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
  animate,
  useScroll,
  AnimatePresence,
} from 'framer-motion';
import { Star, Award, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, Cpu, Layers, Droplet, Clock, Gem, Calendar } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const n = parseFloat(value.replace(/[^0-9.]/g, ''));
    const c = animate(0, n, {
      duration, ease: 'easeOut',
      onUpdate(v) { setDisplay(Number.isInteger(n) ? Math.round(v) : v.toFixed(1)); },
    });
    return c.stop;
  }, [inView, value, duration]);
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────────
   FLOATING PARTICLE
───────────────────────────────────────────────────────────────────── */
function FloatingParticle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{ y: [0, -26, 0], x: [0, 10, -7, 0], opacity: [0.1, 0.4, 0.1], scale: [1, 1.5, 1] }}
      transition={{ duration: style.dur || 6, repeat: Infinity, ease: 'easeInOut', delay: style.del || 0 }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, dir = 'up', distance = 48, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const variants = {
    up: { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -distance }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.80 }, visible: { opacity: 1, scale: 1 } },
    flip: { hidden: { opacity: 0, rotateX: 55 }, visible: { opacity: 1, rotateX: 0 } },
  };
  return (
    <motion.div ref={ref} variants={variants[dir]} initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CLIP-SLIDE TEXT REVEAL
───────────────────────────────────────────────────────────────────── */
function SlideReveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '105%' }}
        animate={inView ? { y: '0%' } : { y: '105%' }}
        transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAGNETIC BUTTON
───────────────────────────────────────────────────────────────────── */
function MagBtn({ children, className, onClick, style = {} }) {
  const ref = useRef(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 20 });
  const sy = useSpring(y, { stiffness: 280, damping: 20 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.4);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
  };
  return (
    <motion.button ref={ref} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ ...style, x: sx, y: sy }} whileTap={{ scale: 0.94 }}
      className={className} onClick={onClick}>{children}</motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MARQUEE
───────────────────────────────────────────────────────────────────── */
function Marquee({ items, speed = 20, reverse = false }) {
  return (
    <div className="overflow-hidden py-4 border-y border-luxury-text/8 bg-white/70 backdrop-blur-sm select-none">
      <motion.div className="flex gap-14 whitespace-nowrap"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}>
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="text-[11px] font-bold tracking-[0.22em] uppercase text-luxury-muted flex items-center gap-3">
            <Star size={7} fill="currentColor" className="text-black/30" />{item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GENDER PANEL — full mouse-tracking parallax inside the card
───────────────────────────────────────────────────────────────────── */
function GenderPanel({ label, img, gender, delay, accent, onPageChange }) {
  const panelRef = useRef(null);
  const defaultFallback = gender === 'women' ? '/assets/women_watches_beach.jpeg' : '/assets/men_watches.jpg';
  const [panelImg, setPanelImg] = useState(img || defaultFallback);

  useEffect(() => {
    setPanelImg(img || defaultFallback);
  }, [img, defaultFallback]);

  /* Raw mouse position -1..1 relative to panel */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const [hovered, setHovered] = useState(false);

  /* Spring config — ultra‑smooth glide */
  const cfg = { stiffness: 30, damping: 30, mass: 1.2 };
  const smx = useSpring(mx, cfg);
  const smy = useSpring(my, cfg);

  /* Image moves in the DIRECTION of mouse (follow) */
  const imgX = useTransform(smx, [-1, 1], ['-22px', '22px']);
  const imgY = useTransform(smy, [-1, 1], ['-14px', '14px']);

  /* Text lifts opposite — creates depth */
  const txtY = useTransform(smy, [-1, 1], ['8px', '-8px']);

  /* Overlay brightness reacts to horizontal position */
  const overlayOp = useTransform(smx, [-1, 1], [0.65, 0.5]);

  const handleMove = useCallback((e) => {
    const r = panelRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }, [mx, my]);

  const handleLeave = useCallback(() => {
    mx.set(0); my.set(0); setHovered(false);
  }, [mx, my]);

  return (
    <motion.div
      ref={panelRef}
      onClick={() => onPageChange('shop', { gender })}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      className="dark-panel relative h-[600px] overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 900 }}
    >
      {/* ── Hidden preloader to guarantee fallback if image fails or 404s ── */}
      <img
        src={panelImg}
        alt=""
        className="hidden"
        onError={() => {
          if (panelImg !== defaultFallback) {
            setPanelImg(defaultFallback);
          }
        }}
      />

      {/* ── Image — follows mouse direction ── */}
      <motion.div
        className="absolute inset-[-5%] bg-cover bg-center"
        style={{
          backgroundImage: `url('${panelImg}')`,
          x: imgX,
          y: imgY,
        }}
        animate={{ scale: hovered ? 1.05 : 1 }}
        transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ── Dark gradient overlay ── */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)',
          opacity: overlayOp,
        }}
      />

      {/* ── Colour tint wash — fades in on hover ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${accent}18 0%, transparent 60%)` }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.65 }}
      />

      {/* ── Shimmer sweep — fires once on enter ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.13) 50%, transparent 60%)',
        }}
        animate={hovered ? { x: ['−100%', '200%'] } : { x: '-100%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      />

      {/* ── Text block — parallax lift ── */}
      <motion.div
        className="absolute bottom-0 left-0 w-full p-8 sm:p-12 space-y-4 z-10"
        style={{ y: txtY }}
      >
        <motion.h3
          className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide uppercase drop-shadow-xl"
          animate={{ y: hovered ? -4 : 0, letterSpacing: hovered ? '0.08em' : '0.05em' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {label}
        </motion.h3>

        <motion.div
          className="flex items-center gap-2 text-white text-xs font-bold tracking-widest uppercase overflow-hidden"
          animate={{ opacity: hovered ? 1 : 0.7, x: hovered ? 0 : -6 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button
            onClick={(e) => { e.stopPropagation(); onPageChange('shop', { gender }); }}
            className="flex items-center gap-2 border-b pb-0.5 w-fit"
            style={{ borderColor: accent }}
            whileHover={{ gap: 14 }}
            transition={{ duration: 0.35 }}
          >
            Discover <ArrowRight size={12} />
          </motion.button>
        </motion.div>
      </motion.div>


    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   COLLECTION CARD — mouse-tracking tilt per card
───────────────────────────────────────────────────────────────────── */
function CollectionCard({ col, idx, onPageChange }) {
  const [hovered, setHovered] = useState(false);

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'Cpu': return <Cpu size={12} className="shrink-0" />;
      case 'Gem': return <Gem size={12} className="shrink-0" />;
      case 'Droplet': return <Droplet size={12} className="shrink-0" />;
      case 'Layers': return <Layers size={12} className="shrink-0" />;
      case 'Clock': return <Clock size={12} className="shrink-0" />;
      default: return <Cpu size={12} className="shrink-0" />;
    }
  };

  const bgClass = col.dark ? 'bg-[#0c0c0c] text-white' : 'bg-[#e7e4dc] text-neutral-900 border border-black/5';
  const numColor = '#047857'; // Swadeshi green (box color of warranty)
  const descClass = col.dark ? 'text-gray-100 font-bold' : 'text-neutral-950 font-bold';
  const specTextClass = col.dark ? 'text-white font-extrabold' : 'text-neutral-950 font-extrabold';

  const enterAnims = [
    { hidden: { opacity: 0, x: -70 }, visible: { opacity: 1, x: 0 } },
    { hidden: { opacity: 0, y: 80, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } },
    { hidden: { opacity: 0, x: 70 }, visible: { opacity: 1, x: 0 } },
  ];

  return (
    <motion.div
      onClick={() => onPageChange('shop', col.filter)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      variants={enterAnims[idx]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.85, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`relative h-[360px] sm:h-[420px] md:h-[450px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden cursor-pointer shadow-md transition-shadow duration-300 hover:shadow-2xl ${bgClass}`}
    >
      {/* Content Container */}
      <div className="relative z-20 flex flex-col justify-between h-full">

        {/* Top: Num & Header */}
        <div className="space-y-3">
          <span className="text-[10px] sm:text-xs font-black tracking-[0.25em]" style={{ color: col.dark ? '#ffffff' : numColor }}>
            {col.num} — {col.name}
          </span>
          <div className="space-y-1 sm:space-y-1.5">
            <h3 className="font-serif text-xl sm:text-2xl font-black uppercase tracking-wider leading-tight"
              style={{
                color: col.dark ? '#ffffff' : '#171717'
              }}>{col.name}</h3>
            <p className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: col.dark ? '#ffffff' : numColor }}>
              {col.tagline}
            </p>
          </div>
          <p className={`text-[10px] sm:text-xs leading-relaxed ${descClass}`}>
            {col.desc}
          </p>
        </div>

        {/* Middle: Divider + Specs */}
        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="space-y-2">
            {col.specs.map((spec, i) => (
              <div key={i} className={`flex items-center space-x-2 text-[9px] sm:text-[10px] ${specTextClass}`}>
                <span style={{ color: col.dark ? '#ffffff' : numColor }}>{renderIcon(spec.icon)}</span>
                <span style={{ color: col.dark ? '#ffffff' : 'inherit' }}>{spec.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Explore Collection */}
        <div
          className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black tracking-widest uppercase mt-4"
          style={{ color: col.dark ? '#ffffff' : numColor }}
        >
          <span>Explore Collection</span>
          <ArrowRight size={10} style={{ color: col.dark ? '#ffffff' : numColor }} />
        </div>

      </div>

      {/* Circular Arrow Button in bottom right corner */}
      <div
        className="absolute bottom-6 right-6 w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 z-20"
        style={{
          borderColor: col.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
          backgroundColor: hovered ? numColor : 'transparent',
          color: hovered ? '#ffffff' : (col.dark ? '#ffffff' : '#000000'),
          transform: hovered ? 'rotate(-45deg)' : 'none',
        }}
      >
        <ArrowRight size={14} className="stroke-[2.5]" />
      </div>

    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CIRCULAR WATCH WHEEL — Omega-style rotating selector (enhanced)
───────────────────────────────────────────────────────────────────── */
function WatchWheel({ products, selectedIndex, setSelectedIndex, size = 350 }) {
  // Scale the ring outward as more watches are added with bounded radius
  const extraRadius = Math.min(36, Math.max(0, (products.length - 4)) * 9);
  const radius = size / 2 - 36 + extraRadius;
  const angleStep = 360 / Math.max(1, products.length);
  const rotation = -selectedIndex * angleStep;
  const [hoverIdx, setHoverIdx] = useState(null);

  const springCfg = { stiffness: 90, damping: 16, mass: 0.9 };

  // Calculate maximum bounding reach of the rotating thumbnails (active thumbnail has dim 104px)
  const maxThumbnailReach = radius + 52 + 10; // radius + half active dim (52px) + shadow/glow allowance
  const sidePad = Math.max(54, Math.ceil(maxThumbnailReach - size / 2 + 12));

  return (
    <div
      className="relative flex flex-col items-center shrink-0 select-none"
      style={{
        paddingLeft: sidePad,
        paddingRight: sidePad,
        paddingTop: sidePad
      }}
    >
      {/* Central Rotating Wheel Stage */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-[#10b981]/25" />

        {/* Tick marks around the ring */}
        {products.map((_, i) => {
          const angle = i * angleStep;
          const rad = (angle * Math.PI) / 180;
          const tickR = size / 2 - 6;
          const x = tickR * Math.sin(rad);
          const y = -tickR * Math.cos(rad);
          const isActive = i === selectedIndex;
          return (
            <motion.div
              key={`tick-${i}`}
              className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
              style={{
                width: isActive ? 6 : 3,
                height: isActive ? 6 : 3,
                marginLeft: isActive ? -3 : -1.5,
                marginTop: isActive ? -3 : -1.5,
                x, y,
                background: isActive ? '#10b981' : 'rgba(255,255,255,0.2)',
              }}
              animate={{ scale: isActive ? 1.3 : 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}

        {/* Soft glow behind active thumbnail */}
        <motion.div
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
          style={{
            width: 100, height: 100, marginLeft: -50, marginTop: -50,
            x: 0, y: -radius,
            background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', ...springCfg }}
        />

        {/* Rotating wheel */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', ...springCfg }}
        >
          {/* Spoke line to active item */}
          <motion.div
            className="absolute top-1/2 left-1/2 origin-top pointer-events-none"
            style={{
              width: 1, height: radius - 30, marginLeft: -0.5,
              background: 'linear-gradient(to top, rgba(16,185,129,0.55), transparent)',
            }}
          />

          {products.map((p, i) => {
            const angle = i * angleStep;
            const rad = (angle * Math.PI) / 180;
            const x = radius * Math.sin(rad);
            const y = -radius * Math.cos(rad);
            const isActive = i === selectedIndex;
            const isHovered = hoverIdx === i;
            const dim = isActive ? 104 : isHovered ? 84 : 66;

            return (
              <motion.button
                key={p.id || p._id || i}
                onClick={() => setSelectedIndex(i)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="absolute top-1/2 left-1/2 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
                style={{
                  width: dim, height: dim,
                  marginLeft: -dim / 2, marginTop: -dim / 2,
                  x, y,
                  background: '#12110f',
                  border: isActive ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isActive
                    ? '0 0 0 6px rgba(16,185,129,0.12), 0 0 30px rgba(16,185,129,0.55), 0 8px 20px rgba(0,0,0,0.6)'
                    : isHovered
                      ? '0 0 16px rgba(16,185,129,0.3), 0 6px 14px rgba(0,0,0,0.5)'
                      : '0 4px 10px rgba(0,0,0,0.4)',
                  zIndex: isActive ? 20 : isHovered ? 15 : 10,
                }}
                animate={{
                  rotate: -rotation,
                  opacity: isActive ? 1 : isHovered ? 0.9 : 0.55,
                }}
                transition={{ type: 'spring', ...springCfg }}
              >
                <img src={p.image || p.images?.[0] || ''} alt={p.name || 'Timepiece'} onError={(e) => handleImageError(e)} className="w-full h-full object-contain p-2" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Position counter below wheel — placed with safe margin below the lowest thumbnail reach */}
      <div
        className="text-[10px] font-bold tracking-[0.25em] text-[#10b981]/80 select-none"
        style={{ marginTop: Math.max(28, (maxThumbnailReach - size / 2) + 20) }}
      >
        {String(selectedIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────────
   HERO VIDEO CYCLER — plays video 1 → 2 → 3 → 4 → 1 … muted, no loop
   + manual slide arrows (next/prev)
───────────────────────────────────────────────────────────────────── */
const HERO_VIDEOS = [
  '/assets/hero_video_1.mp4',
  '/assets/hero_video_2.mp4',
  '/assets/video1.mp4',
];

function HeroVideoCycler() {
  const [vidIdx, setVidIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const vRef = useRef(null);

  const goToVideo = useCallback((newIdx) => {
    setFade(false);
    setTimeout(() => {
      setVidIdx(newIdx);
      setFade(true);
    }, 350);
  }, []);

  const handleEnded = useCallback(() => {
    goToVideo((vidIdx + 1) % HERO_VIDEOS.length);
  }, [vidIdx, goToVideo]);

  const handleNext = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    goToVideo((vidIdx + 1) % HERO_VIDEOS.length);
  }, [vidIdx, goToVideo]);

  const handlePrev = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    goToVideo((vidIdx - 1 + HERO_VIDEOS.length) % HERO_VIDEOS.length);
  }, [vidIdx, goToVideo]);

  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => { });
  }, [vidIdx]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={vRef}
        key={vidIdx}
        muted
        playsInline
        onEnded={handleEnded}
        className="object-cover w-full h-full brightness-[0.87]"
        style={{ objectPosition: '30% 50%', opacity: fade ? 1 : 0, transition: 'opacity 0.35s ease' }}
      >
        <source src={HERO_VIDEOS[vidIdx]} type="video/mp4" />
      </video>

      {/* ── Slide Arrows (Pure normal click/tap controls - No magnetic/gravity/physics effects) ── */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous video"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-black/50 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all duration-150 cursor-pointer pointer-events-auto touch-manipulation select-none shadow-xl"
      >
        <ChevronLeft size={22} className="stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next video"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-black/50 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all duration-150 cursor-pointer pointer-events-auto touch-manipulation select-none shadow-xl"
      >
        <ChevronRight size={22} className="stroke-[2.5]" />
      </button>

      {/* ── Slide position indicator ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 pointer-events-auto">
        {HERO_VIDEOS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              if (e) e.stopPropagation();
              goToVideo(i);
            }}
            aria-label={`Go to video ${i + 1}`}
            className="h-1.5 rounded-full transition-all duration-300 cursor-pointer pointer-events-auto"
            style={{
              width: i === vidIdx ? 22 : 8,
              background: i === vidIdx ? '#10b981' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════════════ */
/* ─────────────────────────────────────────────────────────────────────
   LIFESTYLE SHOWCASE SLIDER
───────────────────────────────────────────────────────────────────── */
function LifestyleShowcaseSlider({ products, onPageChange, homeImages }) {
  const slides = [
    {
      name: 'CRIMSON RED',
      fullName: 'Khroniq Crimson Red',
      lifestyleImg: homeImages.hero_slide1_lifestyle || '/assets/lifestyle_red.jpg',
      productImg: homeImages.hero_slide1_product || '/assets/watch_red.jpg',
      lifestyleStyle: { filter: 'brightness(0.82) contrast(1.1) saturate(1.05)', backgroundPosition: 'center 40%' },
    },
    {
      name: 'EMERALD GREEN',
      fullName: 'Khroniq Emerald Green',
      lifestyleImg: homeImages.hero_slide2_lifestyle || '/assets/slide_green_lifestyle.jpg',
      productImg: homeImages.hero_slide2_product || '/assets/watch_green.jpg',
      lifestyleStyle: { filter: 'brightness(0.78) contrast(1.12) saturate(1.08)', backgroundPosition: 'center 35%' },
    },
    {
      name: 'MIDNIGHT BLACK',
      fullName: 'Khroniq Midnight Black',
      lifestyleImg: homeImages.hero_slide3_lifestyle || '/assets/lifestyle_black_cafe.jpg',
      productImg: homeImages.hero_slide3_product || '/assets/watch_black_steel.png',
      lifestyleStyle: { filter: 'brightness(0.85) contrast(1.1)', backgroundPosition: 'center 30%' },
    },
    {
      name: 'COBALT BLUE',
      fullName: 'Khroniq Cobalt Blue',
      lifestyleImg: homeImages.hero_slide4_lifestyle || '/assets/lifestyle_blue_window.jpg',
      productImg: homeImages.hero_slide4_product || '/assets/watch_blue_brown.png',
      lifestyleStyle: { filter: 'brightness(0.85) contrast(1.1)', backgroundPosition: 'center 30%' },
    },
    {
      name: 'STERLING SILVER',
      fullName: 'Khroniq Sterling Silver',
      lifestyleImg: homeImages.hero_slide5_lifestyle || '/assets/lifestyle_pink_cafe.jpg',
      productImg: homeImages.hero_slide5_product || '/assets/slide_white_product.png',
      lifestyleStyle: { filter: 'brightness(0.85) contrast(1.1)', backgroundPosition: 'center 30%' },
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3500); // 3.5 seconds
    return () => clearInterval(interval);
  }, [isPlaying, slides.length, activeIndex]);


  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSlide = slides[activeIndex];

  const handleDetailsClick = () => {
    const matched = products.find(p => p.name === currentSlide.fullName);
    if (matched) {
      onPageChange('product-detail', { id: matched.id || matched._id });
    } else {
      onPageChange('shop');
    }
  };

  return (
    <section className="w-full bg-white border-t border-luxury-text/8">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[550px] lg:h-[650px] overflow-hidden">

        {/* Left Column: Lifestyle Image Showcase */}
        <div className="relative overflow-hidden h-[450px] lg:h-full bg-neutral-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={`lifestyle-${activeIndex}`}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${currentSlide.lifestyleImg}')`, ...currentSlide.lifestyleStyle }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent z-[1]" />
        </div>

        {/* Right Column: Split Product Showcase & Controls */}
        <div className="flex flex-col h-[550px] lg:h-full">

          {/* Top Half: Black Product Display */}
          <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

            <AnimatePresence mode="wait">
              <motion.div
                key={`product-container-${activeIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <motion.img
                  src={currentSlide.productImg}
                  alt={currentSlide.name}
                  animate={isPlaying ? {
                    y: [0, -6, 0],
                    rotate: [0, 1.2, -1.2, 0]
                  } : {
                    y: 0,
                    rotate: 0
                  }}
                  transition={{
                    y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
                    rotate: { repeat: Infinity, duration: 12, ease: "easeInOut" }
                  }}
                  className="max-w-[65%] max-h-[90%] object-contain filter drop-shadow-[0_15px_30px_rgba(255,255,255,0.18)]"
                />
              </motion.div>
            </AnimatePresence>

            <button
              onClick={togglePlay}
              className="absolute bottom-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition duration-300 shadow-md cursor-pointer"
              aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>

          {/* Bottom Half: Details & Navigation */}
          <div className="p-8 lg:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border-t border-black/5 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black/95 rounded-sm p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  src={currentSlide.productImg}
                  alt={currentSlide.name}
                  onError={(e) => handleImageError(e)}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-serif text-lg font-bold text-black tracking-widest uppercase">
                  {currentSlide.name}
                </h3>
                <button
                  onClick={handleDetailsClick}
                  className="text-xs font-bold text-neutral-800 hover:text-neutral-500 transition duration-200 underline underline-offset-4 tracking-widest uppercase cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                className={`w-12 h-12 flex items-center justify-center border border-black/15 hover:border-black transition duration-300 font-bold cursor-pointer rounded-sm ${activeIndex === slides.length - 1 ? 'bg-white text-black border-black' : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <span className="text-xs font-black tracking-[0.25em] text-neutral-800 min-w-[45px] text-center">
                {activeIndex + 1} / {slides.length}
              </span>
              <button
                onClick={handleNext}
                className={`w-12 h-12 flex items-center justify-center border border-black/15 hover:border-black transition duration-300 font-bold cursor-pointer rounded-sm ${activeIndex === slides.length - 1 ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black border-black'
                  }`}
                aria-label="Next slide"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export const HOMEPAGE_MEDIA_SECTIONS = [
  {
    key: 'gender_men',
    title: "Shop by Gender — Men's Banner",
    slots: [{ key: 'gender_men', label: "Banner Image", default: '/assets/men_watches.jpg' }]
  },
  {
    key: 'gender_women',
    title: "Shop by Gender — Women's Banner",
    slots: [{ key: 'gender_women', label: "Banner Image", default: '/assets/women_watches_beach.jpeg' }]
  },
  {
    key: 'khronomaster_professional',
    title: 'Classic Professional — Hero Image',
    description: '5-slide carousel for the homepage Classic Professional spotlight.',
    slots: [
      { key: 'khronomaster_professional', label: 'Slide 1', default: '/assets/spotlight_red_angled.png' },
      { key: 'khronomaster_professional_slide2', label: 'Slide 2', default: '/assets/spotlight_green_side.jpeg' },
      { key: 'khronomaster_professional_slide3', label: 'Slide 3', default: '/assets/spotlight_red_overhead.png' },
      { key: 'khronomaster_professional_slide4', label: 'Slide 4', default: '/assets/watch_green.jpg' },
      { key: 'khronomaster_professional_slide5', label: 'Slide 5', default: '/assets/watch_red.jpg' }
    ]
  },
  {
    key: 'dive_deeper_tile1',
    title: 'Classic Professional — Tile 1 (Emerald Green)',
    slots: [{ key: 'dive_deeper_tile1', label: 'Tile Image', default: '/assets/spotlight_green_side.jpeg' }]
  },
  {
    key: 'dive_deeper_tile2',
    title: 'Classic Professional — Tile 2 (Crimson Red)',
    slots: [{ key: 'dive_deeper_tile2', label: 'Tile Image', default: '/assets/spotlight_red_overhead.png' }]
  },
  {
    key: 'hero_slide1_lifestyle',
    title: 'Hero Slide 1 — Crimson Red (Lifestyle)',
    slots: [{ key: 'hero_slide1_lifestyle', label: 'Lifestyle Image', default: '/assets/lifestyle_red.jpg' }]
  },
  {
    key: 'hero_slide1_product',
    title: 'Hero Slide 1 — Crimson Red (Watch)',
    slots: [{ key: 'hero_slide1_product', label: 'Watch Image', default: '/assets/watch_red.jpg' }]
  },
  {
    key: 'hero_slide2_lifestyle',
    title: 'Hero Slide 2 — Emerald Green (Lifestyle)',
    slots: [{ key: 'hero_slide2_lifestyle', label: 'Lifestyle Image', default: '/assets/slide_green_lifestyle.jpg' }]
  },
  {
    key: 'hero_slide2_product',
    title: 'Hero Slide 2 — Emerald Green (Watch)',
    slots: [{ key: 'hero_slide2_product', label: 'Watch Image', default: '/assets/watch_green.jpg' }]
  },
  {
    key: 'hero_slide3_lifestyle',
    title: 'Hero Slide 3 — Midnight Black (Lifestyle)',
    slots: [{ key: 'hero_slide3_lifestyle', label: 'Lifestyle Image', default: '/assets/lifestyle_black_cafe.jpg' }]
  },
  {
    key: 'hero_slide3_product',
    title: 'Hero Slide 3 — Midnight Black (Watch)',
    slots: [{ key: 'hero_slide3_product', label: 'Watch Image', default: '/assets/watch_black_steel.png' }]
  },
  {
    key: 'hero_slide4_lifestyle',
    title: 'Hero Slide 4 — Cobalt Blue (Lifestyle)',
    slots: [{ key: 'hero_slide4_lifestyle', label: 'Lifestyle Image', default: '/assets/lifestyle_blue_window.jpg' }]
  },
  {
    key: 'hero_slide4_product',
    title: 'Hero Slide 4 — Cobalt Blue (Watch)',
    slots: [{ key: 'hero_slide4_product', label: 'Watch Image', default: '/assets/watch_blue_brown.png' }]
  },
  {
    key: 'hero_slide5_lifestyle',
    title: 'Hero Slide 5 — Sterling Silver (Lifestyle)',
    slots: [{ key: 'hero_slide5_lifestyle', label: 'Lifestyle Image', default: '/assets/lifestyle_pink_cafe.jpg' }]
  },
  {
    key: 'hero_slide5_product',
    title: 'Hero Slide 5 — Sterling Silver (Watch)',
    slots: [{ key: 'hero_slide5_product', label: 'Watch Image', default: '/assets/slide_white_product.png' }]
  },
  {
    key: 'khroniq_updates',
    title: 'Khroniq Updates — Drawer / Header Banner',
    slots: [{ key: 'khroniq_updates', label: 'Banner Image', default: '/assets/khroniq_updates_bg.jpg' }]
  }
];

export const defaultHomeImages = Object.fromEntries(
  HOMEPAGE_MEDIA_SECTIONS.flatMap(sec => sec.slots.map(slot => [slot.key, slot.default]))
);

export const HOMEPAGE_SECTION_LABELS = Object.fromEntries(
  HOMEPAGE_MEDIA_SECTIONS.flatMap(sec =>
    sec.slots.map(slot => [
      slot.key,
      sec.slots.length > 1 ? `${sec.title} (${slot.label})` : sec.title
    ])
  )
);

const updateSlideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

let publicMediaCache = null;
let publicMediaPromise = null;

export default function Home({ onPageChange, onUpdatesOpen, onUpdatesClose, updatesOpen }) {
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);
  const featuredReviews = useSelector(state => state.watch.featuredReviews || []);
  const [homeImages, setHomeImages] = useState(defaultHomeImages);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const spotlightImages = [
    homeImages.khronomaster_professional || "/assets/spotlight_red_angled.png",
    homeImages.khronomaster_professional_slide2 || "/assets/spotlight_green_side.jpeg",
    homeImages.khronomaster_professional_slide3 || "/assets/spotlight_red_overhead.png",
    homeImages.khronomaster_professional_slide4 || "/assets/watch_green.jpg",
    homeImages.khronomaster_professional_slide5 || "/assets/watch_red.jpg",
  ];

  const [currentSpotlight, setCurrentSpotlight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpotlight((prev) => (prev + 1) % spotlightImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const filters = useSelector(state => state.watch.filters || []);
  const contentSections = useSelector(state => state.watch.contentSections || []);

  // Fetch featured reviews for testimonials section
  useEffect(() => {
    dispatch(fetchFeaturedReviews());
  }, [dispatch]);


  useEffect(() => {
    document.title = 'KHRONIQ — Born from The Movement Of Time';
  }, []);

  useEffect(() => {
    if (publicMediaCache) {
      setHomeImages(prev => ({ ...prev, ...publicMediaCache }));
      return;
    }
    if (!publicMediaPromise) {
      publicMediaPromise = fetch('/api/admin/media/public')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.media) {
            publicMediaCache = data.media;
            return data.media;
          }
          return null;
        })
        .catch(err => {
          console.error('Failed to fetch homepage media:', err);
          publicMediaPromise = null;
          return null;
        });
    }
    publicMediaPromise.then(media => {
      if (media) setHomeImages(prev => ({ ...prev, ...media }));
    });
  }, []);

  /* ── Hero unified parallax ── */
  const heroRef = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spr = { stiffness: 55, damping: 16, mass: 0.8 };
  const spX = useSpring(rawX, spr);
  const spY = useSpring(rawY, spr);

  /* ALL content moves together in the cursor direction */
  const contentX = useTransform(spX, [-1, 1], ['-22px', '22px']);
  const contentY = useTransform(spY, [-1, 1], ['-13px', '13px']);

  /* Video drifts opposite (depth layer) */
  const vidX = useTransform(spX, [-1, 1], ['14px', '-14px']);
  const vidY = useTransform(spY, [-1, 1], ['9px', '-9px']);

  /* Orb moves more opposite (furthest layer) */
  const orbX = useTransform(spX, [-1, 1], ['55px', '-55px']);
  const orbY = useTransform(spY, [-1, 1], ['32px', '-32px']);

  const { scrollY } = useScroll();
  const scrollFade = useTransform(scrollY, [0, 180], [1, 0]);



  const onMouseMove = useCallback((e) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }, [rawX, rawY]);
  const onMouseLeave = useCallback(() => { rawX.set(0); rawY.set(0); }, [rawX, rawY]);

  // --- CAROUSEL SLIDER STATE & LOGIC ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [showUpdates, setShowUpdates] = useState(true);
  const DEFAULT_BRAND_UPDATES = [
    {
      _id: 'default-1',
      title: 'WEB HOSTING SOON',
      detail: 'khroniq is launching its timepieces: wait is over.',
      createdAt: '2026-07-17T00:00:00.000Z'
    }
  ];

  const [brandUpdates, setBrandUpdates] = useState(DEFAULT_BRAND_UPDATES);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const updatesRef = useRef(null);
  const updatesInView = useInView(updatesRef, { once: false, margin: '-40%' });

  const hoverTimeoutRef = useRef(null);

  const handleHoverStart = (product) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredProduct(product);
  };

  const handleHoverEnd = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredProduct(null);
      hoverTimeoutRef.current = null;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch('/api/brand-updates');
        const data = await res.json();
        if (data && data.success && Array.isArray(data.updates) && data.updates.length > 0) {
          setBrandUpdates(data.updates);
        }
      } catch (err) {
        console.error("Error fetching brand updates:", err);
      }
    };
    fetchUpdates();
  }, []);

  // Auto-opening updates drawer disabled as requested

  const defaultUpdates = [
    {
      _id: 'up-1',
      title: 'GENESIS COLLECTION LAUNCH',
      detail: 'Unveiling Khroniq inaugural luxury timepieces. Crafted for those who master time.',
      createdAt: '2026-09-25',
    },
    {
      _id: 'up-2',
      title: 'SWISS CRAFTSMANSHIP',
      detail: 'Precision engineered automatic movements with anti-reflective sapphire crystal.',
      createdAt: '2026-08-05',
    },
    {
      _id: 'up-3',
      title: 'LIMITED EDITION COLLECTION',
      detail: 'Exclusive hand-crafted timepieces coming soon to select luxury boutiques.',
      createdAt: '2026-08-20',
    },
  ];

  const displayedUpdates = (brandUpdates && brandUpdates.length >= 3)
    ? brandUpdates
    : (brandUpdates && brandUpdates.length > 0)
      ? [...brandUpdates, ...defaultUpdates.slice(brandUpdates.length)]
      : defaultUpdates;
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

  useEffect(() => {
    if (!displayedUpdates || displayedUpdates.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentUpdateIndex((prev) => (prev + 1) % displayedUpdates.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayedUpdates.length]);

  const handlePrevUpdate = (e) => {
    e?.stopPropagation();
    setCurrentUpdateIndex((prev) => (prev - 1 + displayedUpdates.length) % displayedUpdates.length);
  };

  const handleNextUpdate = (e) => {
    e?.stopPropagation();
    setCurrentUpdateIndex((prev) => (prev + 1) % displayedUpdates.length);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - visibleCards);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);



  // --- Dynamic Content Sections from CMS (MongoDB) ---
  const heroSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'hero');
  const marqueeASection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'marquee_a');
  const genderSplitSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'gender_split');
  const featuredSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'featured');
  const storySection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'story');
  const collectionsSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'collections');
  const bannerSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'banner');
  const marqueeBSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'marquee_b');
  const lifestyleSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'lifestyle');
  const statsSection = contentSections.find(s => s.page === 'home' && s.sectionKey === 'stats');

  // Featured Timepieces: Dynamically derive the newest eligible products (max 8)
  // Backend /api/products returns products in newest-first order ({ createdAt: -1, _id: -1 }),
  // so we reuse that ordering directly without duplicate sorting.
  const eligibleProducts = Array.isArray(products)
    ? products.filter(p => p && (p.id || p._id) && p.name)
    : [];
  const featured = eligibleProducts.slice(0, 8);

  const safeFeaturedIndex = (selectedProductIndex >= 0 && selectedProductIndex < featured.length) ? selectedProductIndex : 0;

  // --- Global Collection Synchronization (Single Source of Truth: Catalog Filters) ---
  const collectionCat = filters.find(c => c.slug === 'collection');
  const activeCollectionOptions = (collectionCat?.options && collectionCat.options.length > 0)
    ? collectionCat.options.filter(opt => opt.isActive)
    : [
      { name: 'Deevaaz', slug: 'deevaaz', value: 'deevaaz' },
      { name: 'Classic', slug: 'classic', value: 'classic' }
    ];

  const defaultCollectionArt = {
    deevaaz: {
      tagline: 'CONTEMPORARY SWADESHI LUXURY',
      desc: 'Modern elegance and graceful proportions, tailored for distinction.',
      dark: false
    },
    classic: {
      tagline: 'HIGH-FREQUENCY CHRONOGRAPHS',
      desc: 'Engineered for precision. Built for timeless performance.',
      dark: false
    }
  };

  const collections = activeCollectionOptions.map((opt, idx) => {
    const slug = (opt.slug || opt.value || opt.name).toLowerCase();
    const customItem = collectionsSection?.items?.find(it =>
      (it.metadata?.collectionSlug && it.metadata.collectionSlug.toLowerCase() === slug) ||
      (it.title && it.title.toLowerCase() === opt.name.toLowerCase())
    );

    const art = defaultCollectionArt[slug] || {
      tagline: 'LUXURY TIMEPIECE COLLECTION',
      desc: `Distinct expressions of our watchmaking philosophy in the ${opt.name} collection.`,
      dark: false
    };

    return {
      num: customItem?.metadata?.num || String(idx + 1).padStart(2, '0'),
      name: opt.name.toUpperCase(),
      tagline: customItem?.subtitle || art.tagline,
      desc: customItem?.description || art.desc,
      specs: (customItem?.metadata?.specs || [
        { label: 'Quartz Movement', icon: 'Cpu' },
        { label: 'Mineral Glass', icon: 'Gem' }
      ]).map(s => {
        let label = s.label;
        if (/automatic/i.test(label)) label = 'Quartz Movement';
        if (/sapphire/i.test(label)) label = 'Mineral Glass';
        return { ...s, label };
      }),
      dark: customItem?.metadata?.dark !== undefined ? customItem.metadata.dark : art.dark,
      filter: { category: opt.value || opt.slug || opt.name }
    };
  });

  const marqueeA = (marqueeASection?.items && marqueeASection.items.length > 0)
    ? marqueeASection.items.map(i => i.title)
    : ['Premium & Luxury', 'Indian Engineered', '1 Year Premium Warranty'];

  const marqueeB = (marqueeBSection?.items && marqueeBSection.items.length > 0)
    ? marqueeBSection.items.map(i => i.title)
    : ['Born from The Movement Of Time'];

  const stats = (statsSection?.items && statsSection.items.length > 0)
    ? statsSection.items.map(i => ({
      raw: i.title.replace(/[^0-9]/g, '') || i.title,
      suffix: i.title.replace(/[0-9]/g, '') || '',
      label: i.subtitle || i.description || ''
    }))
    : [
      { raw: '100', suffix: '%', label: 'Swadeshi Design' },
      { raw: '2026', suffix: '', label: 'Indian Launch' },
      { raw: '50', suffix: 'K+', label: 'Pre-bookings' },
    ];

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section
        ref={heroRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-[#1c1a17]"
        style={{ perspective: '1200px' }}
      >
        {/* Video — deepest layer, drifts opposite — cycles video 1 → video 2 → … */}
        <motion.div className="absolute inset-0 z-0" style={{ x: vidX, y: vidY, scale: 1.06 }}>
          <HeroVideoCycler />
          <div className="absolute inset-0 bg-black/28 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          {/* Masking overlay to cover the bottom-right Gemini watermark on the video */}
          <div className="absolute bottom-0 right-0 w-64 h-48 sm:w-[28rem] sm:h-[20rem] bg-gradient-to-br from-transparent via-black/90 to-black blur-2xl sm:blur-3xl pointer-events-none z-10 opacity-95" />
        </motion.div>

        {/* Ambient orb — furthest opposite */}
        <motion.div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none z-[2]"
          style={{ x: orbX, y: orbY, background: 'radial-gradient(circle,rgba(52,211,153,0.48) 0%,transparent 70%)', filter: 'blur(48px)' }}
          animate={{ opacity: [0.07, 0.16, 0.07], scale: [1, 1.14, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Particles */}
        {[
          { width: 4, height: 4, top: '18%', left: '14%', background: '#c5a880', dur: 5, del: 0 },
          { width: 6, height: 6, top: '63%', left: '8%', background: '#34d399', dur: 7, del: 1 },
          { width: 3, height: 3, top: '77%', left: '78%', background: '#c5a880', dur: 6, del: 2 },
          { width: 5, height: 5, top: '32%', left: '88%', background: '#6ee7b7', dur: 8, del: 0.5 },
          { width: 4, height: 4, top: '68%', left: '52%', background: '#fff', dur: 5.5, del: 1.5 },
          { width: 3, height: 3, top: '12%', left: '63%', background: '#c5a880', dur: 9, del: 3 },
          { width: 5, height: 5, top: '44%', left: '30%', background: '#34d399', dur: 7.5, del: 2.5 },
        ].map((p, i) => <FloatingParticle key={i} style={p} />)}

        {/* ── ALL content as one unified block — follows cursor ── */}
        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center pointer-events-none"
          style={{ x: contentX, y: contentY }}
        >
          <div className="col-span-1 sm:col-span-8 space-y-6 text-center sm:text-left pointer-events-none sm:-translate-x-5 translate-y-4 sm:translate-y-8">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center sm:justify-start pointer-events-auto">
              <motion.span
                className="inline-flex items-center justify-center border border-luxury-gold/50 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full bg-black/50 backdrop-blur-sm max-w-[90vw] sm:max-w-none"
                whileHover={{ scale: 1.05, borderColor: 'rgba(197,168,128,0.9)' }} transition={{ duration: 0.15 }}>
                <img
                  src="/assets/logo_text.png"
                  alt="KHRONIQ"
                  className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto max-w-[65vw] sm:max-w-xs md:max-w-sm lg:max-w-none object-contain shrink-0"
                  style={{ filter: 'brightness(1.05) saturate(1.1)' }}
                />
              </motion.span>
            </motion.div>

            {/* Heading — both lines same depth */}
            <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.16, ease: [0.22, 1, 0.36, 1] }} className="select-none cursor-default">
              <div className="font-cinzel font-bold text-2xl sm:text-3xl md:text-4xl tracking-wider text-white uppercase leading-tight">
                {heroSection?.title || 'Born from The'}
              </div>
              <div className="font-cinzel font-bold text-2xl sm:text-3xl md:text-4xl tracking-wider uppercase leading-tight mt-1">
                <span className="text-white inline-block" style={{
                  color: '#ffffff',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4)) drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
                }}>{heroSection?.subtitle || 'Movement Of Time'}</span>
              </div>
            </motion.div>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.85, delay: 0.32 }}
              className="text-gray-200 text-sm sm:text-base max-w-xl font-light tracking-wide leading-relaxed">
              {heroSection?.description || 'KHRONIQ exists to inspire those who strive towards their dreams, offering unmatched horological mastery and mechanical innovation.'}
            </motion.p>

            {/* Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.46 }}
              className="pt-4 flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-4 pointer-events-auto">
              <MagBtn onClick={() => onPageChange('shop')}
                className="px-8 py-4 text-white text-xs font-bold tracking-widest uppercase hover:opacity-90 transition duration-150 w-full sm:w-auto cursor-pointer border shadow-lg"
                style={{ background: 'linear-gradient(135deg, #047857 0%, #065f46 45%, #022c22 100%)', borderColor: '#047857' }}>
                {heroSection?.buttonText || 'Explore Timepieces'}
              </MagBtn>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div style={{ opacity: scrollFade }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none">
          <span className="text-white/40 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown size={16} className="text-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ MARQUEE A ══════════ */}
      <Marquee items={marqueeA} speed={20} />

      {/* ══════════ GENDER SPLIT ══════════
          Each panel: mouse-tracking image parallax + reactive overlay + badge pop */}
      <section className="w-full overflow-hidden">
        <div className="text-center py-14 bg-white">
          <Reveal dir="down">
            <p className="text-[10px] text-luxury-gold-dark font-bold tracking-widest uppercase mb-3">
              {genderSplitSection?.label || 'CURATED FOR YOU'}
            </p>
          </Reveal>
          <SlideReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-luxury-text tracking-wide uppercase">
              {genderSplitSection?.title || 'Shop By Gender'}
            </h2>
          </SlideReveal>
          <motion.div className="w-12 h-[2px] bg-luxury-gold-dark mx-auto mt-5"
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <GenderPanel
            label={genderSplitSection?.items?.[0]?.title || "Men's Watches"}
            img={genderSplitSection?.items?.[0]?.image || homeImages.gender_men || "/assets/men_watches.jpg"}
            gender="men"
            delay={0}
            accent="#ffffff"
            onPageChange={onPageChange}
          />
          <GenderPanel
            label={genderSplitSection?.items?.[1]?.title || "Women's Watches"}
            img={
              (genderSplitSection?.items?.[1]?.image &&
                !genderSplitSection.items[1].image.includes('women_watches.jpg') &&
                genderSplitSection.items[1].image.trim()) ||
              (homeImages?.gender_women &&
                !homeImages.gender_women.includes('women_watches.jpg') &&
                homeImages.gender_women.trim()) ||
              "/assets/women_watches_beach.jpeg"
            }
            gender="women"
            delay={0.1}
            accent="#34d399"
            onPageChange={onPageChange}
          />
        </div>
      </section>

      {/* ══════════ MARQUEE B (reverse) ══════════ */}
      <Marquee items={marqueeB} speed={18} reverse />

      {/* ══════════ SPOTLIGHT SECTION ══════════
          Left: headline + desc + discover link
          Right: large hero image
          Below: 2-up product image mini-grid */}
      <section className="w-full bg-white overflow-hidden">
        {/* Top half — editorial split */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Left — text */}
          <div className="flex flex-col justify-center px-10 sm:px-16 py-16 space-y-6 bg-white">
            <Reveal dir="left" delay={0}>
              <p className="text-[30px] font-bold tracking-[0.25em] uppercase text-luxury-gold-dark">
                {storySection?.label || 'Featured Collection'}
              </p>
            </Reveal>
            <SlideReveal delay={0.1}>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-luxury-text leading-tight">
                {storySection?.title ? (
                  <span>{storySection.title}</span>
                ) : (
                  <>
                    <span className="text-luxury-gold-dark">Classic</span> Professional
                  </>
                )}
              </h2>
            </SlideReveal>
            <Reveal dir="left" delay={0.2}>
              <p className="text-luxury-muted text-sm leading-relaxed max-w-md">
                {storySection?.description ||
                  'Engineered with Indian precision, the Classic Professional pushes boundaries with components from the True Knock Group and the legendary Khroniq caliber. Built to inspire confidence for every Indian connoisseur.'}
              </p>
            </Reveal>
          </div>

          {/* Right — 5-image auto sliding hero */}
          <div
            className="relative overflow-hidden min-h-[420px] lg:min-h-0 group"
            style={{ perspective: "1800px" }}
          >
            <AnimatePresence >
              <motion.div
                key={currentSpotlight}
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105"
                style={{
                  backgroundImage: `url(${spotlightImages[currentSpotlight]})`,
                }}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent" />
          </div>
        </motion.div>

        {/* Bottom half — 2-up product mini grid */}
        <div className="grid grid-cols-2 border-t border-luxury-text/8">
          {[
            { img: homeImages.dive_deeper_tile1 || '/assets/spotlight_green_side.jpeg', label: 'Khroniq Emerald Green', sub: 'Heritage Automatic', style: { backgroundPosition: 'center center' } },
            { img: homeImages.dive_deeper_tile2 || '/assets/spotlight_red_overhead.png', label: 'Khroniq Crimson Red', sub: 'Heritage Automatic', style: { backgroundPosition: 'center center' } },
          ].map(({ img, label, sub, style }, i) => (
            <motion.div
              key={i}
              onClick={() => onPageChange('shop')}
              className={`relative overflow-hidden cursor-pointer group h-[300px] ${i === 0 ? 'border-r border-luxury-text/8' : ''
                }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${img}')`, ...style }}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-7 space-y-1.5">
                <motion.p
                  className="font-serif text-xl font-bold"
                  style={{ color: '#ffffff', textShadow: '0 1px 14px rgba(0,0,0,1), 0 0 32px rgba(0,0,0,0.8)' }}
                  initial={{ y: 8, opacity: 0.8 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                >{label}</motion.p>
                <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 10px rgba(0,0,0,1)' }}>{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ COLLECTIONS ══════════
          Each card: different enter anim + full 3-D mouse-track tilt + image parallax */}
      <section className="w-full px-4 sm:px-8 lg:px-12 pt-32 pb-24 space-y-14 bg-white">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Reveal dir="flip">
            <p className="text-xs text-neutral-800 font-extrabold tracking-[0.35em] uppercase">
              {collectionsSection?.label || 'The Pillars of KHRONIQ'}
            </p>
          </Reveal>

          <Reveal dir="up" delay={0.15}>
            <h2 className="text-4xl sm:text-5xl font-serif font-black text-neutral-900 tracking-wide uppercase">
              {collectionsSection?.title || 'Signature Collections'}
            </h2>
          </Reveal>

          <div className="flex items-center justify-center gap-5 mt-2">
            <motion.div
              className="h-[1.5px] bg-gradient-to-r from-transparent to-[#047857]"
              initial={{ width: 0 }}
              whileInView={{ width: '80px' }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ width: '80px' }}
            />

            <motion.div
              className="h-[1.5px] bg-gradient-to-l from-transparent to-[#047857]"
              initial={{ width: 0 }}
              whileInView={{ width: '80px' }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ width: '80px' }}
            />
          </div>

          <Reveal dir="up" delay={0.3}>
            <p className="text-neutral-600 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
              {collectionsSection?.description || 'Distinct expressions of our watchmaking philosophy. Crafted for those who value timeless excellence.'}
            </p>
          </Reveal>
        </div>

        <div className={`grid grid-cols-1 ${collections.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' : 'md:grid-cols-3'} gap-8`}>
          {collections.map((col, idx) => (
            <CollectionCard key={col.name + idx} col={col} idx={idx} onPageChange={onPageChange} />
          ))}
        </div>
      </section>

      {/* ══════════ FULL-WIDTH SCROLLING TEXT BANNER ══════════ */}
      <div className="w-full overflow-hidden bg-[#0e0d0b] select-none" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Strip 1 — forward */}
        <motion.div
          className="flex items-center whitespace-nowrap py-5"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {[...Array(8)].map((_, i) => (
            <React.Fragment key={i}>
              <span style={{ color: '#ffffff', fontFamily: 'Georgia, serif', letterSpacing: '0.18em' }} className="text-sm sm:text-base font-bold uppercase mx-10 whitespace-nowrap shrink-0">
                {bannerSection?.title || 'Born from The Movement Of Time'}
              </span>
              <LogoMark className="h-9 w-9 mx-4 shrink-0 opacity-95" />
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* ══════════ LIFESTYLE SHOWCASE SLIDER ══════════ */}
      <LifestyleShowcaseSlider products={products} onPageChange={onPageChange} homeImages={homeImages} />


      {/* ══════════ FEATURED PRODUCTS ══════════ */}
      <div className="relative overflow-hidden bg-white py-24 sm:py-32" style={{
        background:
          "linear-gradient(180deg,#faf8f3,#f2eee5)",
      }}>


        {/* Centered Heading */}
        <div className="text-center mb-16 z-20 relative">
          <h2
            style={{
              color: "#111111",
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700,
              letterSpacing: "0.25em",
            }}
            className="text-2xl sm:text-3xl lg:text-5xl uppercase"
          >
            {featuredSection?.title || 'FEATURED COLLECTION'}
          </h2>
          <div className="w-12 h-[1px] bg-[#047857] mx-auto mt-4" />
        </div>

        {featured.length > 0 ? (
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full z-20 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-20">

              {/* --- BACKGROUND SVG LINING (unchanged, already black/green) --- */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center z-0">
                <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="opacity-100 hidden lg:block">
                  <circle cx="-50" cy="350" r="400" stroke="#000000" strokeWidth="1" fill="none" opacity="0.09" />
                  <circle cx="1250" cy="300" r="400" stroke="#000000" strokeWidth="1" fill="none" opacity="0.05" />
                  <path d="M -50 60 L 180 60 L 300 180 L 300 640 L 90 850" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.7" />
                </svg>
              </div>

              {/* Left Column: Big Watch Image and Arrows */}
              <div className="flex flex-col items-center justify-center relative z-10 lg:translate-y-6 translate-y-0 w-full">
                <div className="w-full max-w-[260px] sm:max-w-[320px] lg:max-w-md aspect-[3/4] flex items-center justify-center p-4 sm:p-6 relative">
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 45%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.06) 40%, transparent 70%)',
                      filter: 'blur(18px)',
                    }}
                  />
                  <motion.img
                    key={safeFeaturedIndex}
                    src={featured[safeFeaturedIndex]?.image || featured[safeFeaturedIndex]?.images?.[0] || ''}
                    alt={featured[safeFeaturedIndex]?.name || 'Timepiece'}
                    onError={(e) => handleImageError(e)}
                    className="max-h-full max-w-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.25)] z-10"
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: [0, -12, 0],
                      rotate: [0, 1, -1, 0]
                    }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.5 },
                      y: {
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut"
                      },
                      rotate: {
                        repeat: Infinity,
                        duration: 8,
                        ease: "easeInOut"
                      }
                    }}
                  />
                </div>

                <div className="flex mt-2 z-20">
                  <button
                    onClick={() => setSelectedProductIndex((prev) => (prev === 0 ? featured.length - 1 : prev - 1))}
                    className="w-10 h-10 border border-[#047857] bg-white text-[#047857] hover:bg-[#047857] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
                    aria-label="Previous timepiece"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedProductIndex((prev) => (prev === featured.length - 1 ? 0 : prev + 1))}
                    className="w-10 h-10 border border-[#047857] bg-white text-[#047857] hover:bg-[#047857] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
                    aria-label="Next timepiece"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Right Column: Text & Product Selector */}
              <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8 relative z-10 lg:pl-8 xl:pl-12 w-full">

                <div className="space-y-3 sm:space-y-4 w-full">
                  <h3
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-tight"
                    style={{
                      color: "#111111",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 500,
                      fontStyle: "italic",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {featured[safeFeaturedIndex]?.name}
                  </h3>

                  <p
                    className="uppercase text-xs sm:text-sm font-bold tracking-[0.25em]"
                    style={{
                      color: "#047857",
                      letterSpacing: "0.25em",
                    }}
                  >
                    {featured[safeFeaturedIndex]?.category
                      ? featured[safeFeaturedIndex].category.toUpperCase()
                      : (featured[safeFeaturedIndex]?.subtitle || 'PRECISION AT EVERY LEVEL')}
                  </p>

                  <p
                    style={{ color: '#047857' }}
                    className="text-xl sm:text-2xl font-serif italic font-light tracking-wider uppercase"
                  >
                    {featured[safeFeaturedIndex]?.price !== undefined && featured[safeFeaturedIndex]?.price !== null
                      ? `₹${Number(featured[safeFeaturedIndex].price).toLocaleString('en-IN')}`
                      : formatPrice(getDiscountedPrice(featured[safeFeaturedIndex]), currentCurrency)}
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        const targetId = featured[safeFeaturedIndex]?.id || featured[safeFeaturedIndex]?._id;
                        if (targetId) {
                          onPageChange("product-detail", {
                            id: targetId,
                            product: featured[safeFeaturedIndex]
                          });
                        } else {
                          onPageChange("shop");
                        }
                      }}
                      className="uppercase font-bold text-xs tracking-[0.28em] border-b border-black pb-1 hover:text-[#047857] hover:border-[#047857] transition-all duration-300 cursor-pointer inline-block"
                    >
                      EXPLORE
                    </button>
                  </div>
                </div>

                {/* Navigation: Responsive Switch */}
                <div className="pt-2 sm:pt-4 w-full flex justify-center lg:justify-start">
                  {/* Desktop Circular Wheel */}
                  <div className="hidden lg:block w-full max-w-full">
                    <WatchWheel
                      products={featured}
                      selectedIndex={safeFeaturedIndex}
                      setSelectedIndex={setSelectedProductIndex}
                      size={350}
                    />
                  </div>

                  {/* Mobile & Tablet Compact Horizontal Product Selector */}
                  <div className="lg:hidden w-full max-w-full">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 px-1 overflow-x-auto no-scrollbar scroll-smooth">
                      {featured.map((item, idx) => {
                        const isSel = idx === safeFeaturedIndex;
                        return (
                          <button
                            key={item.id || item._id || idx}
                            type="button"
                            onClick={() => setSelectedProductIndex(idx)}
                            className={`relative shrink-0 rounded-full transition-all duration-300 p-1 cursor-pointer ${isSel
                              ? 'ring-2 ring-[#047857] scale-110 shadow-sm bg-emerald-50/70'
                              : 'opacity-60 hover:opacity-100 hover:scale-105'
                              }`}
                            title={item.name}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-white/90 border border-neutral-200 flex items-center justify-center p-1">
                              <img
                                src={item.image || item.images?.[0] || ''}
                                alt={item.name || 'Timepiece'}
                                onError={(e) => handleImageError(e)}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            {isSel && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#047857]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-500">
            No masterpieces currently in stock.
          </div>
        )}
      </div>

      {/* ══════════ CLIENT TESTIMONIALS ══════════ */}
      {featuredReviews.length > 0 && (
        <section className="w-full py-20 sm:py-28 bg-[#0e0d0b] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            {/* Section Header */}
            <div className="text-center mb-14 space-y-4">
              <motion.p
                className="text-[10px] font-extrabold tracking-[0.35em] uppercase text-[#34d399]"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                What Our Patrons Say
              </motion.p>
              <motion.h2
                className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide uppercase"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Client Testimonials
              </motion.h2>
              <motion.div
                className="w-12 h-[1.5px] bg-[#34d399] mx-auto"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredReviews.slice(0, 6).map((review, idx) => (
                <motion.div
                  key={review.id || idx}
                  className="relative bg-[#1a1916]/80 border border-white/[0.06] rounded-2xl p-6 sm:p-7 space-y-4 backdrop-blur-sm hover:border-[#34d399]/30 transition-all duration-500 group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#34d399]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= review.rating ? '#c5a880' : 'transparent'}
                        stroke={star <= review.rating ? '#c5a880' : '#555'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-white/80 text-sm leading-relaxed font-light italic line-clamp-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>

                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                    {review.productImage && (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 flex-shrink-0">
                        <img
                          src={review.productImage}
                          alt={review.productName}
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold tracking-wide truncate">
                        {review.userName}
                      </p>
                      <p className="text-[10px] text-[#34d399]/70 font-medium tracking-wider uppercase truncate">
                        on {review.productName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Spacer to shift KHRONIQ updates section lower */}
      <div className="w-full h-32 bg-black relative z-30" />

      {/* ══════════ FULL SCREEN IMAGE BACKGROUND UPDATES SECTION ══════════ */}
      {/* ══════════ KHRONIQ UPDATE PARALLAX BANNER SECTION ══════════ */}
      <div
        ref={updatesRef}
        className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden bg-black text-white"
      >
        {/* Background Image with crisp opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85"
          style={{
            backgroundImage: `url(${homeImages.khroniq_updates || "/assets/khroniq_updates_bg.jpg"})`,
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-black/20 z-10" />

        {/* Centered Wide Rectangular Frosted Glass KHRONIQ Updates Card */}
        <div
          onMouseEnter={() => setIsUpdatesHovered(true)}
          onMouseLeave={() => setIsUpdatesHovered(false)}
          className="relative z-20 w-full max-w-[820px] rounded-3xl p-6 sm:p-9 lg:p-10 select-none overflow-hidden"
          style={{
            background: 'rgba(8, 25, 22, 0.22)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 220, 190, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35), 0 0 35px rgba(0, 220, 190, 0.15)',
          }}
        >
          {/* Ambient Corner Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          {/* Card Header Row */}
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="font-sans font-bold text-xs sm:text-sm tracking-[0.28em] text-white uppercase block">
                KHRONIQ UPDATES
              </span>
              {/* Subtle Teal Accent Line */}
              <div className="w-16 sm:w-20 h-[2px] bg-teal-400 mt-2.5 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
            </div>

          {/* Top Header: Title on Left, Slide Counter on Right */}
          <div className="flex items-center justify-between border-b border-[#34d399]/25 pb-3">
            <span className="text-xs sm:text-sm uppercase font-black tracking-[0.3em] text-[#34d399] drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              KHRONIQ UPDATES
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-200/90 bg-black/40 px-3 py-1 rounded-full border border-emerald-500/20">
              {currentUpdateIndex + 1} / {displayedUpdates.length}
            </span>
          </div>

          {/* Slider Content Row: Previous Arrow (<), Center Details, Next Arrow (>) */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 py-2">

            {/* Left Previous Arrow Button */}
            <button
              onClick={handlePrevUpdate}
              aria-label="Previous Update"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#34d399]/60 bg-[#031c18]/50 hover:bg-[#34d399]/25 hover:border-[#34d399] hover:scale-110 active:scale-95 text-[#34d399] flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(4,120,87,0.3)] shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>

            {/* Center Animated Slide Info */}
            <div className="flex-1 text-center space-y-3 px-1 min-h-[130px] flex flex-col justify-center items-center">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] animate-pulse shadow-[0_0_10px_#34d399]" />
                <h3 className="font-serif text-lg sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  {displayedUpdates[currentUpdateIndex]?.title || 'WEB HOSTING SOON'}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-emerald-50/90 font-medium leading-relaxed max-w-md drop-shadow">
                {displayedUpdates[currentUpdateIndex]?.detail || 'khroniq is launching its timepieces :wait is over'}
              </p>

              <div className="w-full max-w-xs border-b border-emerald-500/25 my-1" />

              <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold font-mono text-xs tracking-widest pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>
                  {displayedUpdates[currentUpdateIndex]?.createdAt
                    ? new Date(displayedUpdates[currentUpdateIndex].createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                    : '17 JUL 2026'}
                </span>
              </div>
            </div>

            {/* Right Next Arrow Button */}
            <button
              onClick={handleNextUpdate}
              aria-label="Next Update"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#34d399]/60 bg-[#031c18]/50 hover:bg-[#34d399]/25 hover:border-[#34d399] hover:scale-110 active:scale-95 text-[#34d399] flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(4,120,87,0.3)] shrink-0 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>

          </div>

          {/* Bottom Dot Indicators */}
          {displayedUpdates.length > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              {displayedUpdates.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentUpdateIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentUpdateIndex
                    ? 'w-7 bg-[#34d399] shadow-[0_0_8px_#34d399]'
                    : 'w-2 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-500/50'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

        </div>

        {/* Vertical Tab sticking to the extreme left of this section only — COMMENTED OUT AS REQUESTED */}
        {/*
        <button
          onClick={() => onUpdatesOpen && onUpdatesOpen()}
          className="absolute left-0 top-0 h-full w-20 sm:w-24 text-white font-black text-[22px] sm:text-[26px] tracking-[0.35em] uppercase border-r border-[#047857]/30 shadow-2xl hover:opacity-100 hover:translate-x-1.5 transition-all duration-300 z-30 cursor-pointer flex flex-col items-center justify-center select-none rounded-none group"
          style={{
            writingMode: 'vertical-lr',
            textOrientation: 'mixed',
            background: 'linear-gradient(180deg, #047857 0%, #065f46 45%, #022c22 100%)',
          }}
        >
          <div className="absolute top-10 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </div>

          <span className="group-hover:scale-105 transition-transform duration-300">
            KHRONIQ UPDATES
          </span>

          <div className="absolute bottom-10 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </div>
        </button>
        */}
      </div>
    </>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import {
  Gift, Heart, Users, Star, ArrowRight, Sparkles,
  Clock, Package, Ribbon, ChevronDown, Check, Crown,
  Baby, Briefcase, User, UserRound,
} from 'lucide-react';
import BackButton from '../components/BackButton';

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, dir = 'up', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const variants = {
    up: { hidden: { opacity: 0, y: 48 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -48 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: 48 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: -48 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.82 }, visible: { opacity: 1, scale: 1 } },
  };
  return (
    <motion.div ref={ref} variants={variants[dir]} initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function SlideReveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '105%' }}
        animate={inView ? { y: '0%' } : { y: '105%' }}
        transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </div>
  );
}

function FloatingParticle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{ y: [0, -22, 0], x: [0, 9, -6, 0], opacity: [0.08, 0.32, 0.08], scale: [1, 1.4, 1] }}
      transition={{ duration: style.dur || 6, repeat: Infinity, ease: 'easeInOut', delay: style.del || 0 }}
    />
  );
}

/* 3-D tilt card */
function TiltCard({ children, className, onClick, style = {} }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 280, damping: 24 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 280, damping: 24 });
  const [hov, setHov] = useState(false);

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => { mx.set(0); my.set(0); setHov(false); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RECIPIENT CATEGORIES
───────────────────────────────────────────────────────────────── */
const RECIPIENTS = [
  {
    id: 'father',
    icon: Crown,
    label: 'Father',
    desc: 'A timepiece as dependable and distinguished as he is.',
    accent: '#c5a880',
    gradient: 'from-amber-900/90 via-amber-800/70 to-yellow-900/80',
    tag: 'Most Popular',
    filter: { gender: 'men' },
    bgImg: '/assets/gift_father.jpg',
  },
  {
    id: 'mother',
    icon: Heart,
    label: 'Mother',
    desc: 'Elegant craftsmanship to celebrate her timeless grace.',
    accent: '#34d399',
    gradient: 'from-emerald-900/90 via-teal-800/70 to-green-900/80',
    filter: { gender: 'women' },
    bgImg: '/assets/gift_mother.jpg',
  },
  {
    id: 'partner',
    icon: Ribbon,
    label: 'Partner',
    desc: 'Mark every moment together with a symbol of forever.',
    accent: '#f472b6',
    gradient: 'from-pink-900/90 via-rose-800/70 to-pink-900/80',
    filter: { gender: 'women' },
    bgImg: '/assets/gift_partner.jpg',
  },
  {
    id: 'friend-him',
    icon: User,
    label: 'Friend (Him)',
    desc: 'Celebrate the bond that stands the test of time — gift him a watch as bold as your friendship.',
    accent: '#60a5fa',
    gradient: 'from-blue-900/90 via-blue-800/70 to-indigo-900/80',
    filter: { gender: 'men' },
    bgImg: '/assets/gift_friend_him.jpg',
  },
  {
    id: 'friend-her',
    icon: UserRound,
    label: 'Friend (Her)',
    desc: 'For the friend who lights up every room — gift her elegance she\'ll wear with pride.',
    accent: '#2dd4bf',
    gradient: 'from-teal-900/90 via-cyan-800/70 to-emerald-900/80',
    filter: { gender: 'women' },
    bgImg: '/assets/gift_sister.jpg',
  },
  {
    id: 'brother',
    icon: Users,
    label: 'Brother',
    desc: 'Your partner in mischief, your lifelong ally — give him time worth wearing.',
    accent: '#818cf8',
    gradient: 'from-indigo-900/90 via-violet-800/70 to-purple-900/80',
    filter: { gender: 'men' },
    bgImg: '/assets/gift_brother.jpg',
  },
  {
    id: 'sister',
    icon: Heart,
    label: 'Sister',
    desc: 'The first friend you ever had — celebrate her grace with a watch as elegant as she is.',
    accent: '#f9a8d4',
    gradient: 'from-rose-900/90 via-pink-800/70 to-fuchsia-900/80',
    filter: { gender: 'women' },
    bgImg: '/assets/gift_sister.jpg',
  },
  {
    id: 'boss',
    icon: Briefcase,
    label: 'Boss / Mentor',
    desc: 'Make a statement with a gift that commands respect.',
    accent: '#fbbf24',
    gradient: 'from-yellow-900/90 via-amber-800/70 to-orange-900/80',
    filter: { gender: 'men' },
    bgImg: '/assets/gift_boss.jpg',
  },
];




/* ─────────────────────────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Priya S.',
    location: 'Mumbai',
    text: 'Gifted a Khroniq Crescent to my father on his 60th birthday. The look on his face was priceless. The gift set was stunning — every detail was perfect.',
    stars: 5,
    watch: 'Khroniq Crescent Brown',
  },
  {
    name: 'Arjun M.',
    location: 'Delhi',
    text: 'My wife absolutely loved her Gentleman Blue. The bespoke engraving made it truly personal. Will definitely come back for more.',
    stars: 5,
    watch: 'Khroniq Gentleman Blue',
  },
  {
    name: 'Rhea K.',
    location: 'Bengaluru',
    text: 'Ordered the Luxury Gift Set for my mentor\'s retirement. The presentation was absolutely world-class. Khroniq exceeded every expectation.',
    stars: 5,
    watch: 'Khroniq Aurex Green',
  },
];

/* ═══════════════════════════════════════════════════════════════
   GIFTING PAGE
═══════════════════════════════════════════════════════════════ */
export default function Gifting({ onPageChange, params }) {
  const products = useSelector(state => state.watch.products);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [giftNote, setGiftNote] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    document.title = 'Bespoke Luxury Gifting | KHRONIQ';
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleShopForRecipient = (recipient) => {
    localStorage.setItem('khroniq_is_gifting_journey', 'true');
    localStorage.setItem('khroniq_gift_relation', recipient.label || '');
    onPageChange('shop', recipient.filter || {});
  };

  const handleCustomize = () => {
    localStorage.setItem('khroniq_is_gifting_journey', 'true');
    onPageChange('customization', { reset: Date.now() });
  };

  const particleData = [
    { width: 5, height: 5, top: '12%', left: '8%', background: '#c5a880', dur: 5, del: 0 },
    { width: 4, height: 4, top: '65%', left: '5%', background: '#f472b6', dur: 7, del: 1.2 },
    { width: 6, height: 6, top: '78%', left: '88%', background: '#34d399', dur: 6, del: 0.5 },
    { width: 3, height: 3, top: '22%', left: '90%', background: '#c5a880', dur: 8, del: 2 },
    { width: 5, height: 5, top: '45%', left: '75%', background: '#60a5fa', dur: 5.5, del: 1.5 },
    { width: 4, height: 4, top: '35%', left: '20%', background: '#fbbf24', dur: 9, del: 3 },
    { width: 3, height: 3, top: '88%', left: '42%', background: '#fff', dur: 7, del: 2.5 },
  ];

  return (
    <div className="dark-panel">
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0d0b08]">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <BackButton onPageChange={onPageChange} fallbackPage="home" label="BACK" dark={true} />
        </div>
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/men_watches.jpg')", filter: 'brightness(0.28)' }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0d0b08]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b08]/70 via-transparent to-[#0d0b08]/70" />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(197,168,128,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        {/* Particles */}
        {particleData.map((p, i) => <FloatingParticle key={i} style={p} />)}

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 border border-luxury-gold/50 text-luxury-gold px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.22em] uppercase bg-black/50 backdrop-blur-sm">
              <Gift size={11} />
              KHRONIQ GIFTING COLLECTION
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-cinzel font-bold text-5xl sm:text-6xl md:text-8xl tracking-wide uppercase leading-tight" style={{ color: '#ffffff' }}>
              Gift the
            </h1>
            <h1 className="font-cinzel font-bold text-5xl sm:text-6xl md:text-8xl tracking-wide uppercase leading-tight mt-2 text-white"
              style={{
                color: '#ffffff',
                filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.4))',
              }}>
              Art of Time
            </h1>
          </motion.div>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto font-light tracking-wide leading-relaxed"
          >
            A Khroniq watch isn't just a gift — it's a memory, a milestone, a legacy worn on the wrist.
            Choose the perfect timepiece for every cherished person in your life.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPageChange('shop')}
              className="px-8 py-4 bg-luxury-gold-dark text-white text-xs font-black tracking-widest uppercase border border-luxury-gold-dark hover:bg-[#047857] hover:border-[#047857] transition-colors duration-200 cursor-pointer min-w-[200px]"
            >
              Shop All Watches
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleCustomize}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/25 text-white hover:bg-white/20 text-xs font-black tracking-widest uppercase transition-colors duration-200 cursor-pointer min-w-[200px]"
            >
              Customize a Watch
            </motion.button>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1.5 mt-8 opacity-40"
          >
            <span className="text-white text-[9px] tracking-[0.3em] uppercase">Discover</span>
            <ChevronDown size={16} className="text-white" />
          </motion.div>
        </div>
      </section>



      {/* ══════ RECIPIENT GRID ══════ */}
      <section className="w-full bg-[#0d0b08] py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-16 space-y-4">
            <Reveal dir="down">
              <p className="text-[10px] text-luxury-gold font-black tracking-[0.28em] uppercase">Gift For Someone Special</p>
            </Reveal>
            <SlideReveal delay={0.1}>
              <h2 className="font-cinzel text-4xl sm:text-5xl font-bold text-white tracking-wide uppercase">
                Who Are You Gifting?
              </h2>
            </SlideReveal>
            <Reveal delay={0.2}>
              <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
                Every relationship is unique. Let us help you find the perfect Khroniq for each one.
              </p>
            </Reveal>
            <motion.div className="w-16 h-[2px] bg-luxury-gold-dark mx-auto"
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }} />
          </div>

          {/* Gifting CTA Buttons (Start Journey / Customize) - Placed below title */}
          <Reveal delay={0.2} dir="up">
            <div className="mb-16 flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  localStorage.setItem('khroniq_is_gifting_journey', 'true');
                  onPageChange('shop');
                }}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-luxury-gold-dark text-white text-xs font-black tracking-widest uppercase cursor-pointer border border-luxury-gold-dark hover:bg-[#2a2a2a] hover:border-[#2a2a2a] transition-colors duration-200"
              >
                <Gift size={15} />
                Start Your Gift Journey
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCustomize}
                className="flex items-center justify-center gap-3 px-8 py-4 border border-luxury-gold/30 text-luxury-gold text-xs font-black tracking-widest uppercase cursor-pointer hover:border-luxury-gold/60 transition-colors duration-200"
              >
                <Sparkles size={15} />
                Customize & Gift
              </motion.button>
            </div>
          </Reveal>

          {/* 4×2 card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RECIPIENTS.map((rec, i) => {
              const Icon = rec.icon;
              const isSelected = selectedRecipient === rec.id;
              return (
                <Reveal key={rec.id} delay={i * 0.08} dir="up">
                  <TiltCard
                    className={`relative h-[360px] rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all duration-300 ${isSelected ? 'border-opacity-100 shadow-2xl' : 'border-transparent'
                      }`}
                    style={{ borderColor: isSelected ? rec.accent : 'transparent' }}
                    onClick={() => setSelectedRecipient(isSelected ? null : rec.id)}
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url('${rec.bgImg}')` }}
                    />
                    {/* Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${rec.gradient}`} />
                    {/* Glow on selected */}
                    {isSelected && (
                      <div className="absolute inset-0 pointer-events-none" style={{
                        boxShadow: `inset 0 0 60px ${rec.accent}22`
                      }} />
                    )}

                    {/* Tag */}
                    {rec.tag && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase bg-luxury-gold-dark text-white">
                        {rec.tag}
                      </div>
                    )}

                    {/* Selected check */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: rec.accent }}
                        >
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full p-7 space-y-3">
                      {/* Icon badge */}
                      <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm bg-black/20"
                        style={{ borderColor: `${rec.accent}60` }}>
                        <Icon size={18} style={{ color: rec.accent }} />
                      </div>

                      <div>
                        <h3 className="font-cinzel text-2xl font-bold text-white tracking-widest uppercase">
                          {rec.label}
                        </h3>
                        <p className="text-white/70 text-xs mt-1 leading-relaxed font-light">{rec.desc}</p>
                      </div>

                      {/* CTA */}
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleShopForRecipient(rec); }}
                        className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase border-b pb-0.5 w-fit transition-all duration-200 cursor-pointer"
                        style={{ color: rec.accent, borderColor: `${rec.accent}60` }}
                        whileHover={{ gap: 12, x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        Shop Now <ArrowRight size={10} />
                      </motion.button>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>

          {/* Shop CTA when recipient selected */}
          <AnimatePresence>
            {selectedRecipient && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                className="mt-10 flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const rec = RECIPIENTS.find(r => r.id === selectedRecipient);
                    if (rec) handleShopForRecipient(rec);
                  }}
                  className="flex items-center gap-3 px-10 py-4 bg-luxury-gold-dark text-white text-sm font-black tracking-widest uppercase cursor-pointer border border-luxury-gold-dark hover:bg-[#047857] hover:border-[#047857] transition-colors duration-200 shadow-xl shadow-luxury-gold/20"
                >
                  <Gift size={16} />
                  Shop Watches for {RECIPIENTS.find(r => r.id === selectedRecipient)?.label}
                  <ArrowRight size={14} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>


      {/* ══════ WHY GIFT KHRONIQ ══════ */}
      <section className="w-full py-24 px-4 bg-[#111007]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Reveal dir="down">
              <p className="text-[10px] text-luxury-gold font-black tracking-[0.28em] uppercase">Why Khroniq</p>
            </Reveal>
            <SlideReveal delay={0.1}>
              <h2 className="font-cinzel text-4xl sm:text-5xl font-bold text-white tracking-wide uppercase">
                The Perfect Gift, Always
              </h2>
            </SlideReveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Clock, title: 'Lifetime Legacy', desc: 'A Khroniq is built to last generations, making it a gift that lives beyond the moment.', accent: '#c5a880' },
              { icon: Package, title: 'Luxury Packaging', desc: 'Every box is a keepsake — crafted with the same attention to detail as the watch inside.', accent: '#34d399' },
              { icon: Star, title: 'Made in India', desc: '100% Swadeshi design and assembly — gift pride, gift heritage, gift Khroniq.', accent: '#60a5fa' },

            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <Reveal key={feat.title} delay={i * 0.1} dir="up">
                  <motion.div
                    className="rounded-2xl p-7 border border-white/8 text-center space-y-4 group cursor-default"
                    style={{ background: 'rgba(255,255,255,0.025)' }}
                    whileHover={{ y: -6, borderColor: feat.accent + '50' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto transition-colors duration-200"
                      style={{ background: `${feat.accent}15`, border: `1px solid ${feat.accent}40` }}>
                      <Icon size={22} style={{ color: feat.accent }} />
                    </div>
                    <h4 className="font-cinzel text-sm font-bold text-white tracking-widest uppercase">{feat.title}</h4>
                    <p className="text-white/50 text-xs leading-relaxed font-light">{feat.desc}</p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="w-full py-24 px-4 bg-[#0d0b08]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Reveal dir="down">
              <p className="text-[10px] text-luxury-gold font-black tracking-[0.28em] uppercase">Stories of Joy</p>
            </Reveal>
            <SlideReveal delay={0.1}>
              <h2 className="font-cinzel text-4xl sm:text-5xl font-bold text-white tracking-wide uppercase">
                Gifted with Love
              </h2>
            </SlideReveal>
          </div>

          <div className="relative">
            {(() => {
              const safeTestimonial = TESTIMONIALS[activeTestimonial] || TESTIMONIALS[0];
              return (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-2xl p-10 sm:p-14 border border-white/10 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(safeTestimonial.stars || 5)].map((_, si) => (
                        <Star key={si} size={14} fill="#c5a880" className="text-luxury-gold" />
                      ))}
                    </div>

                    <blockquote className="text-white/80 text-base sm:text-lg font-light italic leading-relaxed max-w-2xl mx-auto"
                      style={{ fontFamily: 'Georgia, serif' }}>
                      "{safeTestimonial.text}"
                    </blockquote>

                    <div className="mt-8 space-y-1">
                      <p className="text-white font-cinzel font-bold text-sm tracking-widest uppercase">
                        {safeTestimonial.name}
                      </p>
                      <p className="text-luxury-gold/60 text-xs font-light">
                        {safeTestimonial.location} · Gifted a <span className="font-semibold">{safeTestimonial.watch}</span>
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })()}

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {TESTIMONIALS.map((_, ti) => (
                <button
                  key={ti}
                  onClick={() => setActiveTestimonial(ti)}
                  className="cursor-pointer transition-all duration-300"
                >
                  <motion.div
                    className="h-1.5 rounded-full"
                    animate={{
                      width: activeTestimonial === ti ? 28 : 8,
                      background: activeTestimonial === ti ? '#c5a880' : 'rgba(255,255,255,0.2)'
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

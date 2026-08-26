import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, ArrowRight, Clock, Award, Gem } from 'lucide-react';
import LogoMark from './LogoMark';

/* ─── tiny hook: fires once when element enters viewport ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const NAV_COLS = [
  {
    title: 'Collections',
    links: [
      { label: 'Khronomaster', page: 'shop', args: { category: 'Khronomaster' } },
      { label: 'Defy',         page: 'shop', args: { category: 'Defy' } },
      { label: 'Heritage',     page: 'shop', args: { category: 'Heritage' } },
      { label: 'Elite',        page: 'shop', args: { category: 'Elite' } },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Book an Appointment', page: 'static',  args: { view: 'contact' } },
      { label: 'Register My Watch',   action: 'warranty' },
      { label: 'Shipping Policy',     page: 'static',  args: { view: 'shipping' } },
      { label: 'Cancellation Policy', page: 'static',  args: { view: 'cancellation' } },
      { label: 'Replacement Policy',  page: 'static',  args: { view: 'exchange' } },
      { label: 'Refund Policy',       page: 'static',  args: { view: 'refund' } },
      { label: 'Warranty Policy',     page: 'static',  args: { view: 'warranty' } },
    ],
  },
  {
    title: 'More Policies',
    links: [
      { label: 'FAQ',                 page: 'static',  args: { view: 'faq' } },
      { label: 'Privacy Policy',   page: 'static', args: { view: 'privacy' } },
      { label: 'COD Policy',       page: 'static', args: { view: 'cod' } },
      { label: 'Cookie Policy',    page: 'static', args: { view: 'cookie' } },
      { label: 'Gifting Policy',   page: 'static', args: { view: 'gifting' } },
      { label: 'Repair & Service', page: 'static', args: { view: 'repair' } },
      { label: 'Community Guidelines', page: 'static', args: { view: 'community' } },
    ],
  },
  {
    title: 'The Brand',
    links: [
      { label: 'Our History',    page: 'static', args: { view: 'about' } },
      { label: 'The Manufacture',page: 'static', args: { view: 'about' } },
      { label: 'Sustainability', page: 'static', args: { view: 'about' } },
      { label: 'Blogs & Editorial', page: 'static', args: { view: 'blogs' } },
      { label: 'Terms & Conditions', page: 'static', args: { view: 'policies' } },
    ],
  },
];
const BADGES = [
  { icon: ShieldCheck, label: 'Indian Guarantee',   sub: 'Premium Warranty' },
  { icon: Award,       label: 'Master Craftsmanship', sub: 'Hand-finished movements' },
  { icon: Gem,         label: 'Certified Swadeshi', sub: 'Crafted with Indian Pride' },
];

const SOCIALS = [
  {
    label: 'Facebook',
    href: '#',
    path: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z',
    rule: 'evenodd',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/khroniqofficial?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    path: 'M12.315 2c2.43 0 2.784.01 3.71.054 1 .046 1.637.208 2.07.377a4.78 4.78 0 0 1 1.7 1.1 4.78 4.78 0 0 1 1.1 1.7c.17.43.33 1 .376 2.07.045.926.054 1.28.054 3.71s-.01 2.784-.054 3.71c-.046 1-.208 1.637-.377 2.07a4.78 4.78 0 0 1-1.1 1.7 4.78 4.78 0 0 1-1.7 1.1c-.43.17-1 .33-2.07.376-.926.045-1.28.054-3.71.054s-2.784-.01-3.71-.054c-1-.046-1.637-.208-2.07-.377a4.78 4.78 0 0 1-1.7-1.1 4.78 4.78 0 0 1-1.1-1.7c-.17-.43-.33-1-.376-2.07C2.01 14.784 2 14.43 2 12s.01-2.784.054-3.71c.046-1 .208-1.637.377-2.07a4.78 4.78 0 0 1 1.1-1.7 4.78 4.78 0 0 1 1.7-1.1c.43-.17 1-.33 2.07-.376.926-.045 1.28-.054 3.71-.054zm0 2.25c-2.4 0-2.71.01-3.66.053-.94.043-1.45.2-1.8.34a2.53 2.53 0 0 0-1.5 1.5c-.14.35-.3.86-.34 1.8-.043.95-.053 1.26-.053 3.66s.01 2.71.053 3.66c.043.94.2 1.45.34 1.8a2.53 2.53 0 0 0 1.5 1.5c.35.14.86.3 1.8.34.95.043 1.26.053 3.66.053s2.71-.01 3.66-.053c.94-.043 1.45-.2 1.8-.34a2.53 2.53 0 0 0 1.5-1.5c.14-.35.3-.86.34-1.8.043-.95.053-1.26.053-3.66s-.01-2.71-.053-3.66c-.043-.94-.2-1.45-.34-1.8a2.53 2.53 0 0 0-1.5-1.5c-.35-.14-.86-.3-1.8-.34-.95-.043-1.26-.053-3.66-.053zm0 3.75a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5zm5.75-2.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z',
    rule: 'evenodd',
  },
  {
    label: 'LinkedIn',
    href: '#',
    path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
    rule: 'evenodd',
  },
];

/* ─────────────────────────────────────────────────────────── */
export default function Footer({ onPageChange, onWarrantyOpen }) {
  const [email, setEmail]           = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [heroRef, heroVisible]      = useInView(0.1);
  const [bodyRef, bodyVisible]      = useInView(0.05);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer style={{ backgroundColor: '#000000' }}
            className="relative mt-auto overflow-hidden text-white">

      {/* ══════════════════════════════════════════════════════
          MANIFESTO BAND
      ══════════════════════════════════════════════════════ */}
      <div ref={heroRef}
           style={{ borderBottom: '1px solid rgba(4,120,87,0.15)' }}
           className="relative">

        {/* thin gold top-border accent */}
        <div style={{
          height:'2px',
          background:'linear-gradient(90deg, transparent 0%, #047857 30%, #10b981 50%, #047857 70%, transparent 100%)',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left – Brand statement */}
            <div style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.9s ease, transform 0.9s ease',
            }}>
              {/* Logo */}
              <div className="flex items-center space-x-5 mb-8">
                <img 
                  src="/assets/logo_icon.png" 
                  alt="KHRONIQ Logo" 
                  className="w-20 h-20 object-contain" 
                />
                <img 
                  src="/assets/logo_text.png" 
                  alt="KHRONIQ" 
                  className="h-16 object-contain mt-0.5" 
                />
              </div>

              {/* Divider */}
              <div style={{ width:'48px', height:'1.5px', background:'#047857', marginBottom:'1.5rem' }} />

              {/* Manifesto headline */}
              <h2 style={{
                fontFamily:"'Playfair Display', Georgia, serif",
                fontSize:'clamp(1.8rem, 3.5vw, 2.8rem)',
                fontWeight:600, lineHeight:1.25, color:'#ffffff',
                marginBottom:'1.25rem',
              }}>
                Time is the only<br />
                <span style={{
                  background:'linear-gradient(90deg, #047857, #10b981, #047857)',
                  backgroundSize:'200% auto',
                  WebkitBackgroundClip:'text',
                  WebkitTextFillColor:'transparent',
                  backgroundClip:'text',
                  animation:'shimmer 3s linear infinite',
                }}>luxury that matters.</span>
              </h2>

              <p style={{ fontSize:'0.82rem', lineHeight:1.85, color:'#ffffff', maxWidth:'420px' }}>
                Crafted with Swadeshi pride, KHRONIQ designs exceptional timepieces for those who dare to dream.
                Every second counts — make it extraordinary.
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap gap-6 mt-10">
                {BADGES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center space-x-3 group" style={{ cursor:'default' }}>
                    <div style={{
                      width:'36px', height:'36px', borderRadius:'50%',
                      border:'1px solid rgba(4,120,87,0.3)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'border-color 0.3s, background 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#047857'; e.currentTarget.style.background='rgba(4,120,87,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(4,120,87,0.3)'; e.currentTarget.style.background='transparent'; }}>
                      <Icon size={15} style={{ color:'#047857' }} />
                    </div>
                    <div>
                      <p style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', color:'#ffffff', textTransform:'uppercase' }}>{label}</p>
                      <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.7)', marginTop:'1px' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right – Newsletter CTA */}
            <div style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
            }}>
              <div style={{
                background:'rgba(255,255,255,0.025)',
                border:'1px solid rgba(4,120,87,0.2)',
                borderRadius:'2px',
                padding:'2.5rem',
                backdropFilter:'blur(8px)',
                position:'relative',
                overflow:'hidden',
              }}>
                {/* corner accents */}
                {[
                  { top:0, left:0, borderTop:'1.5px solid #047857', borderLeft:'1.5px solid #047857' },
                  { top:0, right:0, borderTop:'1.5px solid #047857', borderRight:'1.5px solid #047857' },
                  { bottom:0, left:0, borderBottom:'1.5px solid #047857', borderLeft:'1.5px solid #047857' },
                  { bottom:0, right:0, borderBottom:'1.5px solid #047857', borderRight:'1.5px solid #047857' },
                ].map((s, i) => (
                  <div key={i} style={{ position:'absolute', width:'18px', height:'18px', ...s }} />
                ))}

                <p style={{
                  fontSize:'0.6rem', letterSpacing:'0.25em', textTransform:'uppercase',
                  color:'#047857', fontWeight:700, marginBottom:'0.6rem',
                }}>Exclusive Access</p>

                <h3 style={{
                  fontFamily:"'Playfair Display', Georgia, serif",
                  fontSize:'1.55rem', fontWeight:600, color:'#ffffff',
                  lineHeight:1.3, marginBottom:'0.8rem',
                }}>
                  Join the KHRONIQ<br />Inner Circle
                </h3>

                <p style={{ fontSize:'0.75rem', color:'#ffffff', lineHeight:1.75, marginBottom:'1.75rem' }}>
                  Be the first to discover new collections, private events,
                  and exclusive offers reserved for true connoisseurs of fine watchmaking.
                </p>

                {subscribed ? (
                  <div style={{
                    padding:'1rem 1.5rem',
                    background:'rgba(4,120,87,0.1)',
                    border:'1px solid rgba(4,120,87,0.35)',
                    borderRadius:'2px',
                    textAlign:'center',
                  }}>
                    <LogoMark className="w-5 h-5 mx-auto mb-2" />
                    <p style={{ fontSize:'0.75rem', color:'#047857', fontWeight:600, letterSpacing:'0.05em' }}>
                      Welcome to the Inner Circle.
                    </p>
                    <p style={{ fontSize:'0.65rem', color:'#ffffff', marginTop:'0.3rem' }}>
                      Expect something extraordinary soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe}>
                    <div style={{ position:'relative', marginBottom:'0.75rem' }}>
                      <Mail size={14} style={{
                        position:'absolute', left:'14px', top:'50%',
                        transform:'translateY(-50%)', color:'rgba(4,120,87,0.5)',
                        pointerEvents:'none',
                      }} />
                      <input
                        type="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{
                          width:'100%', boxSizing:'border-box',
                          background:'rgba(255,255,255,0.04)',
                          border:'1px solid rgba(4,120,87,0.2)',
                          borderRadius:'2px',
                          padding:'0.85rem 1rem 0.85rem 2.5rem',
                          fontSize:'0.75rem',
                          color:'#ffffff',
                          outline:'none',
                          transition:'border-color 0.3s',
                        }}
                        onFocus={e => { e.target.style.borderColor='#047857'; e.target.style.background='rgba(4,120,87,0.05)'; }}
                        onBlur={e => { e.target.style.borderColor='rgba(4,120,87,0.2)'; e.target.style.background='rgba(255,255,255,0.04)'; }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="group"
                      style={{
                        width:'100%',
                        background:'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                        border:'none',
                        borderRadius:'2px',
                        padding:'0.9rem',
                        color:'#ffffff',
                        fontSize:'0.7rem',
                        fontWeight:700,
                        letterSpacing:'0.2em',
                        textTransform:'uppercase',
                        cursor:'pointer',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        gap:'8px',
                        transition:'opacity 0.3s, transform 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
                    >
                      Subscribe Now <ArrowRight size={13} />
                    </button>
                    <p style={{ fontSize:'0.6rem', color:'#ffffff', opacity: 0.6, textAlign:'center', marginTop:'0.65rem' }}>
                      No spam, ever. Unsubscribe at any time.
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          NAVIGATION COLUMNS
      ══════════════════════════════════════════════════════ */}
      <div ref={bodyRef}
           className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
           style={{ borderBottom: '1px solid rgba(4,120,87,0.1)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-14">

          {NAV_COLS.map(({ title, links }, ci) => (
            <div key={title} style={{
              opacity: bodyVisible ? 1 : 0,
              transform: bodyVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.7s ease ${ci * 0.12}s, transform 0.7s ease ${ci * 0.12}s`,
            }}>
              {/* Column heading with gold underline */}
              <div style={{ marginBottom:'1.25rem' }}>
                <h4 style={{
                  fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.22em',
                  textTransform:'uppercase', color:'#ffffff', marginBottom:'0.5rem',
                }}>{title}</h4>
                <div style={{ width:'20px', height:'1.5px', background:'#047857' }} />
              </div>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {links.map(({ label, page, args }) => {
                  if (label === 'FAQ') {
                    return (
                      <li key={label} className="relative group">
                        <button
                          onClick={() => onPageChange(page, args)}
                          style={{
                            background:'none', border:'none', padding:0,
                            fontSize:'0.72rem', color:'#ffffff',
                            cursor:'pointer', transition:'color 0.25s',
                            display:'flex', alignItems:'center', gap:'6px',
                            fontFamily:'inherit',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color='#047857'; }}
                          onMouseLeave={e => { e.currentTarget.style.color='#ffffff'; }}
                        >
                          <span style={{
                            display:'inline-block', width:'14px', height:'1px',
                            background:'currentColor', flexShrink:0,
                            transition:'width 0.3s',
                          }} className="link-dash" />
                          {label}
                        </button>
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#111111] border border-white/10 rounded shadow-2xl py-2 hidden group-hover:block transition duration-200 z-50 text-left">
                          {[
                            { label: 'Our Story', view: 'about' },
                            { label: 'Boutique Contact', view: 'contact' },
                            { label: 'Client FAQ', view: 'faq' },
                            { label: 'Blogs & Editorial', view: 'blogs' },
                            { label: 'Legal Policies', view: 'policies' }
                          ].map((sub) => (
                            <button
                              key={sub.view}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPageChange('static', { view: sub.view });
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-white/10 text-gray-300 hover:text-white transition text-[11px] font-bold uppercase tracking-wider cursor-pointer block"
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={label}>
                      <button
                        onClick={() => {
                          if (args?.action === 'warranty' || label === 'Register My Watch') {
                            onWarrantyOpen && onWarrantyOpen();
                          } else {
                            localStorage.setItem('khroniq_is_gifting_journey', 'false');
                            onPageChange(page, args);
                          }
                        }}
                        style={{
                          background:'none', border:'none', padding:0,
                          fontSize:'0.72rem', color:'#ffffff',
                          cursor:'pointer', transition:'color 0.25s',
                          display:'flex', alignItems:'center', gap:'6px',
                          fontFamily:'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color='#047857'; }}
                        onMouseLeave={e => { e.currentTarget.style.color='#ffffff'; }}
                      >
                        <span style={{
                          display:'inline-block', width:'14px', height:'1px',
                          background:'currentColor', flexShrink:0,
                          transition:'width 0.3s',
                        }} className="link-dash" />
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Col 4 – Contact & Social */}
          <div style={{
            opacity: bodyVisible ? 1 : 0,
            transform: bodyVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 0.36s, transform 0.7s ease 0.36s',
          }}>
            <div style={{ marginBottom:'1.25rem' }}>
              <h4 style={{
                fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.22em',
                textTransform:'uppercase', color:'#ffffff', marginBottom:'0.5rem',
              }}>Connect</h4>
              <div style={{ width:'20px', height:'1.5px', background:'#047857' }} />
            </div>

            <p style={{ fontSize:'0.68rem', color:'#ffffff', lineHeight:1.7, marginBottom:'1.25rem' }}>
              khroniq.com
            </p>

            {/* Clock-hours decoration */}
            <p style={{ fontSize:'0.6rem', color:'#ffffff', opacity: 0.8, letterSpacing:'0.1em', marginBottom:'1rem' }}>
              <Clock size={10} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />
              MON–SAT · 9AM–7PM CET
            </p>

            {/* Social icons */}
            <div style={{ display:'flex', gap:'10px' }}>
              {SOCIALS.map(({ label, href, path, rule }) => (
                <a key={label} href={href} aria-label={label}
                   target={href !== '#' ? "_blank" : undefined}
                   rel={href !== '#' ? "noopener noreferrer" : undefined}
                   style={{
                     width:'34px', height:'34px', borderRadius:'50%',
                     border:'1px solid rgba(255,255,255,0.25)',
                     display:'flex', alignItems:'center', justifyContent:'center',
                     color:'#ffffff',
                     transition:'color 0.3s, border-color 0.3s, background 0.3s, box-shadow 0.3s',
                   }}
                   onMouseEnter={e => {
                     e.currentTarget.style.color='#047857';
                     e.currentTarget.style.borderColor='#047857';
                     e.currentTarget.style.background='rgba(4,120,87,0.1)';
                     e.currentTarget.style.boxShadow='0 0 12px rgba(4,120,87,0.2)';
                   }}
                   onMouseLeave={e => {
                     e.currentTarget.style.color='#ffffff';
                     e.currentTarget.style.borderColor='rgba(255,255,255,0.25)';
                     e.currentTarget.style.background='transparent';
                     e.currentTarget.style.boxShadow='none';
                   }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {rule
                      ? <path fillRule={rule} d={path} clipRule={rule} />
                      : <path d={path} />
                    }
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DISCLAIMER SECTION
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ borderBottom: '1px solid rgba(4,120,87,0.1)' }}>
        <div style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(4,120,87,0.1)',
          borderRadius: '4px',
          padding: '1.5rem',
        }}>
          <h5 style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#047857',
            marginBottom: '0.75rem'
          }}>Disclaimer & Horological Notice</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[0.62rem] leading-relaxed text-gray-400">
            <div>
              <p className="mb-2">
                <strong className="text-gray-300">Product Representation:</strong> All timepieces featured are subject to availability. While we strive to show accurate details, technical specifications, and current pricing, errors or minor variations in hand-finished components may occasionally occur.
              </p>
              <p>
                <strong className="text-gray-300">Warranty Coverage:</strong> Our 3-Year Premium Swadeshi Warranty is valid only for watches purchased directly from our official portal or authorized concierge boutique service. Watches obtained from unverified sources do not qualify for official servicing.
              </p>
            </div>
            <div>
              <p>
                <strong className="text-gray-300">Intellectual Property:</strong> KHRONIQ and its brand marks, logos, custom dials, and interface assets are proprietary designs. All website content, photography, and layout are protected under trademark and intellectual property rights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BOTTOM BAR
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left – copyright */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <LogoMark className="w-3.5 h-3.5" />
            <p style={{ fontSize:'0.62rem', color:'#ffffff', opacity: 0.6, letterSpacing:'0.08em' }}>
              © 2026 KHRONIQ. All Rights Reserved. A TRUE KNOCK GROUP BRAND.
            </p>
          </div>

          {/* Right – legal links */}
          <div style={{ display:'flex', gap:'1.5rem' }}>
            {[
              { label:'Terms of Use',      page:'static', args:{ view:'policies' } },
              { label:'Privacy Policy',    page:'static', args:{ view:'policies' } },
              { label:'Cookie Preferences',page:'static', args:{ view:'policies' } },
            ].map(({ label, page, args }) => (
              <button
                key={label}
                onClick={() => onPageChange(page, args)}
                style={{
                  background:'none', border:'none', padding:0,
                  fontSize:'0.6rem', color:'#ffffff', opacity: 0.6,
                  cursor:'pointer', letterSpacing:'0.06em',
                  transition:'color 0.25s', fontFamily:'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.color='#047857'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#ffffff'; e.currentTarget.style.opacity = '0.6'; }}
              >{label}</button>
            ))}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          GIANT BRANDING BANNER (TISSOT STYLE)
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
        <div className="flex items-center justify-center space-x-6 sm:space-x-8 md:space-x-12 select-none pointer-events-none opacity-90">
          <img 
            src="/assets/logo_icon.png" 
            alt="KHRONIQ Logo" 
            className="h-16 sm:h-28 lg:h-40 object-contain filter drop-shadow-[0_0_15px_rgba(4,120,87,0.2)]" 
          />
          <img 
            src="/assets/logo_text.png" 
            alt="KHRONIQ" 
            className="h-14 sm:h-24 lg:h-36 object-contain filter drop-shadow-[0_0_15px_rgba(4,120,87,0.2)]" 
          />
        </div>
      </div>

      {/* thin gold bottom line */}
      <div style={{
        height:'1.5px',
        background:'linear-gradient(90deg, transparent 0%, #047857 30%, #10b981 50%, #047857 70%, transparent 100%)',
      }} />

    </footer>
  );
}


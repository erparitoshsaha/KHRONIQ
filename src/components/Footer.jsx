import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ShieldCheck, ArrowRight, Clock, Award, Gem } from 'lucide-react';
import LogoMark from './LogoMark';
import { DEFAULT_FOOTER_SECTIONS } from '../store/slices/watchSlice';

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

const STATIC_NAV_COLS = [
  {
    title: 'Legal',
    links: [
      { label: 'Book an Appointment', page: 'static', args: { view: 'contact' } },
      { label: 'Register My Watch', action: 'warranty' },
      { label: 'Boutique Contact', page: 'static', args: { view: 'contact' } },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Privacy Policy', page: 'static', args: { view: 'privacy' } },
      { label: 'COD Policy', page: 'static', args: { view: 'cod' } },
      { label: 'Cookie Policy', page: 'static', args: { view: 'cookie' } },
      { label: 'Gifting Policy', page: 'static', args: { view: 'gifting' } },
      { label: 'Repair & Service', page: 'static', args: { view: 'repair' } },
      { label: 'Community Guidelines', page: 'static', args: { view: 'community' } },
      { label: 'Cancellation Policy', page: 'static', args: { view: 'cancellation' } },
      { label: 'Replacement Policy', page: 'static', args: { view: 'exchange' } },
      { label: 'Refund Policy', page: 'static', args: { view: 'refund' } },
      { label: 'Warranty Policy', page: 'static', args: { view: 'warranty' } },
      { label: 'Shipping Policy', page: 'static', args: { view: 'shipping' } },
    ],
  },
  {
    title: 'The Brand',
    links: [
      { label: 'Our History', page: 'static', args: { view: 'about' } },
      { label: 'The Manufacture', page: 'static', args: { view: 'about' } },
      { label: 'Sustainability', page: 'static', args: { view: 'about' } },
      { label: 'Blogs & Editorial', page: 'static', args: { view: 'blogs' } },
      { label: 'FAQ', page: 'static', args: { view: 'faq' } },
    ],
  },
];
const BADGES = [
  { icon: ShieldCheck, label: 'Exquisite Design', sub: 'Premium Warranty' },
  { icon: Award, label: 'MASTER CRAFTSMANSHIP', sub: 'Hand-finished movements' },
  { icon: Gem, label: 'CERTIFIED', sub: 'Crafted with Pride' },
];

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/khroniq/',
    path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
    rule: 'evenodd',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/p/Khroniq-61590964700030/',
    path: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z',
    rule: 'evenodd',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/khroniqofficial?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    path: 'M12.315 2c2.43 0 2.784.01 3.71.054 1 .046 1.637.208 2.07.377a4.78 4.78 0 0 1 1.7 1.1 4.78 4.78 0 0 1 1.1 1.7c.17.43.33 1 .376 2.07.045.926.054 1.28.054 3.71s-.01 2.784-.054 3.71c-.046 1-.208 1.637-.377 2.07a4.78 4.78 0 0 1-1.1 1.7 4.78 4.78 0 0 1-1.7 1.1c-.43.17-1 .33-2.07.376-.926.045-1.28.054-3.71.054s-2.784-.01-3.71-.054c-1-.046-1.637-.208-2.07-.377a4.78 4.78 0 0 1-1.7-1.1 4.78 4.78 0 0 1-1.1-1.7c-.17-.43-.33-1-.376-2.07C2.01 14.784 2 14.43 2 12s.01-2.784.054-3.71c.046-1 .208-1.637.377-2.07a4.78 4.78 0 0 1 1.1-1.7 4.78 4.78 0 0 1 1.7-1.1c.43-.17 1-.33 2.07-.376.926-.045 1.28-.054 3.71-.054zm0 2.25c-2.4 0-2.71.01-3.66.053-.94.043-1.45.2-1.8.34a2.53 2.53 0 0 0-1.5 1.5c-.14.35-.3.86-.34 1.8-.043.95-.053 1.26-.053 3.66s.01 2.71.053 3.66c.043.94.2 1.45.34 1.8a2.53 2.53 0 0 0 1.5 1.5c.35.14.86.3 1.8.34.95.043 1.26.053 3.66.053s2.71-.01 3.66-.053c.94-.043 1.45-.2 1.8-.34a2.53 2.53 0 0 0 1.5-1.5c.14-.35.3-.86.34-1.8.043-.95.053-1.26.053-3.66s-.01-2.71-.053-3.66c-.043-.94-.2-1.45-.34-1.8a2.53 2.53 0 0 0-1.5-1.5c-.35-.14-.86-.3-1.8-.34-.95-.043-1.26-.053-3.66-.053zm0 3.75a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5zm5.75-2.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z',
    rule: 'evenodd',
  },
];

/* ─────────────────────────────────────────────────────────── */
export default function Footer({ onPageChange, onWarrantyOpen }) {
  const [heroRef, heroVisible] = useInView(0.1);
  const [bodyRef, bodyVisible] = useInView(0.05);

  const filters = useSelector(state => state.watch.filters || []);
  const footerSections = useSelector(state => state.watch.footerSections || DEFAULT_FOOTER_SECTIONS);

  const collectionCat = filters.find(c => c.slug === 'collection');
  const collectionLinks = (collectionCat?.options && collectionCat.options.length > 0)
    ? collectionCat.options.filter(opt => opt.isActive).map(opt => ({
        label: opt.name,
        page: 'shop',
        args: { category: opt.value || opt.slug || opt.name }
      }))
    : [
        { label: 'Deevaaz', page: 'shop', args: { category: 'deevaaz' } },
        { label: 'Classic', page: 'shop', args: { category: 'classic' } }
      ];

  const activeSections = (footerSections && footerSections.length > 0)
    ? footerSections.filter(sec => sec.isActive)
    : DEFAULT_FOOTER_SECTIONS;

  const navCols = activeSections.map(sec => {
    if (sec.type === 'dynamic_collection' || sec.slug === 'collections') {
      return {
        title: sec.title || 'Collections',
        links: collectionLinks
      };
    }
    return {
      title: sec.title,
      links: (sec.links || []).filter(l => l.isActive)
    };
  });

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
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #047857 30%, #10b981 50%, #047857 70%, transparent 100%)',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">

            {/* Brand statement */}
            <div style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.9s ease, transform 0.9s ease',
            }}>
              {/* Logo */}
              <div className="flex items-center space-x-4 sm:space-x-5 mb-8">
                <img
                  src="/assets/logo_icon.png"
                  alt="KHRONIQ Logo"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain shrink-0"
                />
                <img
                  src="/assets/logo_text.png"
                  alt="KHRONIQ"
                  className="h-8 sm:h-12 md:h-16 w-auto max-w-[60vw] sm:max-w-none object-contain shrink-0"
                />
              </div>

              {/* Divider */}
              <div style={{ width: '48px', height: '1.5px', background: '#047857', marginBottom: '1.5rem' }} />

              {/* Manifesto headline */}
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                fontWeight: 600, lineHeight: 1.25, color: '#ffffff',
                marginBottom: '1.25rem',
              }}>
                Time is the only<br />
                <span style={{
                  background: 'linear-gradient(90deg, #047857, #10b981, #047857)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s linear infinite',
                }}>luxury that matters.</span>
              </h2>

              <p style={{ fontSize: '0.82rem', lineHeight: 1.85, color: '#ffffff', maxWidth: '520px' }}>
                Crafted with pride, KHRONIQ designs exceptional timepieces for those who dare to dream.
                Every second counts — make it extraordinary.
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap gap-6 mt-10">
                {BADGES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center space-x-3 group" style={{ cursor: 'default' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      border: '1px solid rgba(4,120,87,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.3s, background 0.3s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#047857'; e.currentTarget.style.background = 'rgba(4,120,87,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(4,120,87,0.3)'; e.currentTarget.style.background = 'transparent'; }}>
                      <Icon size={15} style={{ color: '#047857' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffffff', textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>{sub}</p>
                    </div>
                  </div>
                ))}
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

          {navCols.map(({ title, links }, ci) => (
            <div key={title} style={{
              opacity: bodyVisible ? 1 : 0,
              transform: bodyVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.7s ease ${ci * 0.12}s, transform 0.7s ease ${ci * 0.12}s`,
            }}>
              {/* Column heading with gold underline */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: '#ffffff', marginBottom: '0.5rem',
                }}>{title}</h4>
                <div style={{ width: '20px', height: '1.5px', background: '#047857' }} />
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {links.map(({ label, page, args, action }) => (
                  <li key={label}>
                    <button
                      onClick={() => {
                        if (action === 'warranty' || label === 'Register My Watch') {
                          onWarrantyOpen && onWarrantyOpen();
                        } else {
                          localStorage.setItem('khroniq_is_gifting_journey', 'false');
                          onPageChange(page, args);
                        }
                      }}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        fontSize: '0.72rem', color: '#ffffff',
                        cursor: 'pointer', transition: 'color 0.25s',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#047857'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#ffffff'; }}
                    >
                      <span style={{
                        display: 'inline-block', width: '14px', height: '1px',
                        background: 'currentColor', flexShrink: 0,
                        transition: 'width 0.3s',
                      }} className="link-dash" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Connect sub-section placed in first column below Collections */}
              {ci === 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em',
                      textTransform: 'uppercase', color: '#ffffff', marginBottom: '0.5rem',
                    }}>Connect</h4>
                    <div style={{ width: '20px', height: '1.5px', background: '#047857' }} />
                  </div>

                  <p style={{ fontSize: '0.72rem', color: '#ffffff', lineHeight: 1.7, marginBottom: '0.6rem' }}>
                    khroniq.com
                  </p>

                  <p style={{ fontSize: '0.62rem', color: '#ffffff', opacity: 0.8, letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', color: '#047857' }} />
                    MON–FRI · 10AM–6PM IST
                  </p>

                  {/* Social icons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {SOCIALS.map(({ label, href, path, rule }) => (
                      <a key={label} href={href} aria-label={label}
                        target={href !== '#' ? "_blank" : undefined}
                        rel={href !== '#' ? "noopener noreferrer" : undefined}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          border: '1px solid rgba(255,255,255,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff',
                          transition: 'color 0.3s, border-color 0.3s, background 0.3s, box-shadow 0.3s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#047857';
                          e.currentTarget.style.borderColor = '#047857';
                          e.currentTarget.style.background = 'rgba(4,120,87,0.1)';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(4,120,87,0.2)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                        <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          {rule
                            ? <path fillRule={rule} d={path} clipRule={rule} />
                            : <path d={path} />
                          }
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DISCLAIMER SECTION
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ borderBottom: '1px solid rgba(4,120,87,0.1)' }}>
        <div style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(4,120,87,0.2)',
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
                <strong className="text-gray-300">Product Representation:</strong> All images featured are subject to availability. While we strive to show accurate details, technical specifications and current pricing are not at times reflected in hand-finished components may occasionally cause out.
              </p>
              <p>
                <strong className="text-gray-300">Warranty Coverage:</strong> Our 1-Year Premium Warranty is valid only for watches purchased directly from our official portal or authorized concierge boutique service. Watches obtained from unverified sources do not qualify for official servicing.
              </p>
            </div>
            <div>
              <p>
                <strong className="text-gray-300">Intellectual Property:</strong> KHRONIQ and its brand marks, logos, custom dials, and interface assets are proprietary designs. All inclusive content, photography and layout are protected under trademark and intellectual property rights.
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoMark className="w-3.5 h-3.5" />
            <p style={{ fontSize: '0.62rem', color: '#ffffff', opacity: 0.6, letterSpacing: '0.08em' }}>
              © 2026 KHRONIQ. All Rights Reserved. A TRUE KNOCK GROUP BRAND.
            </p>
          </div>

          {/* Right – legal links */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Terms of Use', page: 'static', args: { view: 'policies' } },
              { label: 'Privacy Policy', page: 'static', args: { view: 'policies' } },
              { label: 'Cookie Preferences', page: 'static', args: { view: 'policies' } },
            ].map(({ label, page, args }) => (
              <button
                key={label}
                onClick={() => onPageChange(page, args)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: '0.6rem', color: '#ffffff', opacity: 0.6,
                  cursor: 'pointer', letterSpacing: '0.06em',
                  transition: 'color 0.25s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#047857'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.opacity = '0.6'; }}
              >{label}</button>
            ))}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          GIANT BRANDING BANNER (TISSOT STYLE)
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 md:space-x-12 select-none pointer-events-none opacity-90">
          <img
            src="/assets/logo_icon.png"
            alt="KHRONIQ Logo"
            className="h-10 sm:h-20 md:h-28 lg:h-36 object-contain filter drop-shadow-[0_0_15px_rgba(4,120,87,0.2)]"
          />
          <img
            src="/assets/logo_text.png"
            alt="KHRONIQ"
            className="h-8 sm:h-16 md:h-24 lg:h-32 max-w-[65vw] sm:max-w-none object-contain filter drop-shadow-[0_0_15px_rgba(4,120,87,0.2)]"
          />
        </div>
      </div>

      {/* thin gold bottom line */}
      <div style={{
        height: '1.5px',
        background: 'linear-gradient(90deg, transparent 0%, #047857 30%, #10b981 50%, #047857 70%, transparent 100%)',
      }} />

    </footer>
  );
}


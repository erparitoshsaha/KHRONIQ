// ============================================================================
// KHRONIQ CMS — DEFAULT CONTENT SECTIONS (Backend Seed Reference)
// ============================================================================

export const DEFAULT_CONTENT_SECTIONS = [
  // ─── HOMEPAGE (home) ───────────────────────────────────────────────────────
  {
    page: 'home',
    sectionKey: 'hero',
    name: 'Hero Section',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Born from The',
    subtitle: 'Movement Of Time',
    description: 'KHRONIQ exists to inspire those who strive towards their dreams, offering unmatched horological mastery and mechanical innovation.',
    buttonText: 'Explore Timepieces',
    buttonLink: '/shop',
    image: '/assets/spotlight_red_angled.png',
    metadata: {
      secondaryButtonText: 'Classic DNA',
      secondaryButtonLink: '/shop?gender=men',
      badgeLogo: '/assets/logo_text.png'
    }
  },
  {
    page: 'home',
    sectionKey: 'marquee_a',
    name: 'Top Feature Marquee',
    type: 'marquee',
    order: 2,
    isActive: true,
    items: [
      { title: 'Premium & Luxury', order: 1, isActive: true },
      { title: 'Indian Engineered', order: 2, isActive: true },
      { title: '1 Year Premium Warranty', order: 3, isActive: true }
    ]
  },
  {
    page: 'home',
    sectionKey: 'gender_split',
    name: 'Shop By Gender Split',
    type: 'grid',
    order: 3,
    isActive: true,
    label: 'CURATED FOR YOU',
    title: 'Shop By Gender',
    items: [
      {
        title: "Men's Watches",
        image: '/assets/men_watches.jpg',
        buttonText: 'Discover',
        buttonLink: '/shop?gender=men',
        metadata: { gender: 'men' },
        order: 1,
        isActive: true
      },
      {
        title: "Women's Watches",
        image: '/assets/women_watches_beach.jpeg',
        buttonText: 'Discover',
        buttonLink: '/shop?gender=women',
        metadata: { gender: 'women' },
        order: 2,
        isActive: true
      }
    ]
  },
  {
    page: 'home',
    sectionKey: 'marquee_b',
    name: 'Brand Philosophy Banner (Marquee B)',
    type: 'marquee',
    order: 4,
    isActive: true,
    items: [
      { title: 'True Knock Group Product', order: 1, isActive: true },
      { title: 'Limited Edition Masterpiece', order: 2, isActive: true },
      { title: 'Khroniq Caliber Craftsmanship', order: 3, isActive: true },
      { title: 'Excellence Redefined', order: 4, isActive: true },
      { title: 'State-of-the-Art Indian Manufacture', order: 5, isActive: true },
      { title: 'Precision Made in India', order: 6, isActive: true }
    ]
  },
  {
    page: 'home',
    sectionKey: 'story',
    name: 'Featured Collection / Dive Deeper',
    type: 'standard',
    order: 5,
    isActive: true,
    label: 'Featured Collection',
    title: 'Classic Professional',
    subtitle: 'The Archetype of Precision Diving',
    description: 'Engineered with Indian precision, the Classic Professional pushes boundaries with components from the True Knock Group and the legendary Khroniq caliber. Built to inspire confidence for every Indian connoisseur.',
    image: '/assets/spotlight_green_side.jpeg',
    secondaryImage: '/assets/spotlight_red_overhead.png',
    buttonText: 'Discover',
    buttonLink: '/shop?gender=men'
  },
  {
    page: 'home',
    sectionKey: 'collections',
    name: 'Signature Collections Showcase',
    type: 'dynamic_collection',
    order: 6,
    isActive: true,
    label: 'The Pillars of KHRONIQ',
    title: 'Signature Collections',
    description: 'Distinct expressions of our watchmaking philosophy. Crafted for those who value timeless excellence.',
    items: [
      {
        title: 'Deevaaz',
        subtitle: 'CONTEMPORARY SWADESHI LUXURY',
        description: 'Modern elegance and graceful proportions, tailored for distinction.',
        image: '/assets/watch_uploaded_2.png',
        buttonText: 'Explore Collection',
        buttonLink: '/shop?category=Deevaaz',
        metadata: {
          collectionSlug: 'deevaaz',
          num: '01',
          dark: false,
          specs: [
            { label: 'Quartz Movement', icon: 'Cpu' },
            { label: 'Sapphire Crystal', icon: 'Gem' }
          ]
        },
        order: 1,
        isActive: true
      },
      {
        title: 'Classic',
        subtitle: 'HIGH-FREQUENCY CHRONOGRAPHS',
        description: 'Engineered for precision. Built for timeless performance.',
        image: '/assets/watch_green.jpg',
        buttonText: 'Explore Collection',
        buttonLink: '/shop?category=Classic',
        metadata: {
          collectionSlug: 'classic',
          num: '02',
          dark: false,
          specs: [
            { label: 'Quartz Movement', icon: 'Cpu' },
            { label: 'Sapphire Crystal', icon: 'Gem' }
          ]
        },
        order: 2,
        isActive: true
      }
    ]
  },
  {
    page: 'home',
    sectionKey: 'banner',
    name: 'Full-Width Scrolling Text Banner',
    type: 'standard',
    order: 7,
    isActive: true,
    title: 'Born from The Movement Of Time',
    subtitle: 'KHRONIQ Signature Tagline'
  },
  {
    page: 'home',
    sectionKey: 'lifestyle',
    name: 'Lifestyle Showcase Slider',
    type: 'list',
    order: 8,
    isActive: true,
    items: [
      {
        title: 'The Boardroom',
        description: 'Command attention with the commanding presence of high-precision craft.',
        image: '/assets/lifestyle_black_cafe.jpg',
        order: 1,
        isActive: true
      },
      {
        title: 'Evening Gala',
        description: 'Graceful silhouettes and lustrous steel catching ambient light.',
        image: '/assets/lifestyle_rose_gold_wine.jpg',
        order: 2,
        isActive: true
      },
      {
        title: 'Coastal Escapes',
        description: 'Built for resilience against the elements without compromising poise.',
        image: '/assets/lifestyle_blue_ocean.jpg',
        order: 3,
        isActive: true
      },
      {
        title: 'Weekend Retreat',
        description: 'Effortless luxury tailored for moments of leisure and refinement.',
        image: '/assets/lifestyle_green_leather.jpg',
        order: 4,
        isActive: true
      },
      {
        title: 'Atelier Precision',
        description: 'Every component finished and calibrated with painstaking Indian mastery.',
        image: '/assets/lifestyle_silver_cuff.jpg',
        order: 5,
        isActive: true
      }
    ]
  },
  {
    page: 'home',
    sectionKey: 'featured',
    name: 'Featured Timepieces Collection',
    type: 'list',
    order: 9,
    isActive: true,
    label: 'PRECISION ENGINEERING',
    title: 'FEATURED TIMEPIECES',
    subtitle: 'A curated selection of our finest models, engineered for everyday distinction.',
    items: [
      {
        title: 'W1',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Iconic black dial with luxury steel casing and high-frequency quartz movement.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1784980492/zenith-watches/j233x8em0dvkzrtzvojc.png',
        price: 1425,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 1,
        isActive: true,
        metadata: { price: 1425, originalPrice: 1500, productId: '6a64a41b886a09339d66d8ef' }
      },
      {
        title: 'KHRONIQ SIGNATURE',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Refined dual-tone stainless steel with Swadeshi horological craftsmanship.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1784981592/zenith-watches/rpmhrlkyzs3lbo34dkmc.png',
        price: 1900,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 2,
        isActive: true,
        metadata: { price: 1900, originalPrice: 2000, productId: '6a64a86bcb9bba5143ef1bbb' }
      },
      {
        title: 'W4 CHRONOGRAPH',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Dynamic sports chronograph with contrasting indices and scratch-resistant sapphire crystal.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1784981707/zenith-watches/yt1nbb5p0wia55oh8smt.png',
        price: 1425,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 3,
        isActive: true,
        metadata: { price: 1425, originalPrice: 1500, productId: '6a64a8de5fa1137bf0d7f509' }
      },
      {
        title: 'W2 ELEGANCE',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Sleek dress watch profile with sunburst finish and hand-stitched leather strap.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1784981755/zenith-watches/qwljjc2ccz6ytt1c4kt6.png',
        price: 1045,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 4,
        isActive: true,
        metadata: { price: 1045, originalPrice: 1100, productId: '6a64a91b62046d2d2744187d' }
      },
      {
        title: 'W5 ROYAL GOLD',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Commanding luxury with gold-plated bezel and micro-milled indices.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1784982488/zenith-watches/h70sycn304ihi1f9x8is.png',
        price: 2185,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 5,
        isActive: true,
        metadata: { price: 2185, originalPrice: 2300, productId: '6a64ac3c526ce17094849f0f' }
      },
      {
        title: 'W6 EXECUTIVE',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Understated power with brushed steel bracelet and midnight black dial.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1784982651/zenith-watches/ujvptrsrv2rmoyr4k0ae.png',
        price: 1615,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 6,
        isActive: true,
        metadata: { price: 1615, originalPrice: 1700, productId: '6a64ac7d526ce17094849f71' }
      },
      {
        title: 'KHRONIQ ATELIER',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Pure minimalist dial engineered for distinguished everyday performance.',
        image: 'https://res.cloudinary.com/ysl2umba/image/upload/v1787555490/zenith-watches/hxumrvpgxtyuhiqlk4f4.png',
        price: 370,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 7,
        isActive: true,
        metadata: { price: 370, originalPrice: 389, productId: '6a8beeb6b9afcdd1c986f1bd' }
      },
      {
        title: 'KHRONIQ HERITAGE TAN',
        subtitle: 'PRECISION AT EVERY LEVEL',
        description: 'Rugged black dial on a genuine tan leather strap with contrast green stitching.',
        image: '/assets/wt8.png',
        price: 2799,
        buttonText: 'EXPLORE',
        buttonLink: '/shop',
        order: 8,
        isActive: true,
        metadata: { price: 2799, originalPrice: 2999, productId: 'kq-08' }
      }
    ]
  },
  {
    page: 'home',
    sectionKey: 'stats',
    name: 'Brand Milestones & Statistics',
    type: 'list',
    order: 10,
    isActive: true,
    items: [
      { title: '100%', subtitle: 'Swadeshi Design', order: 1, isActive: true },
      { title: '2026', subtitle: 'Indian Launch', order: 2, isActive: true },
      { title: '50K+', subtitle: 'Pre-bookings', order: 3, isActive: true }
    ]
  },

  // ─── ABOUT PAGE (about) ───────────────────────────────────────────────────
  {
    page: 'about',
    sectionKey: 'brand_story',
    name: 'Brand Story & Launch Heritage',
    type: 'standard',
    order: 1,
    isActive: true,
    label: 'LAUNCH EDITION',
    title: 'The Dawn of Modern Indian Luxury',
    description: 'Khroniq was born from a bold vision: to establish a world-class luxury horology house in India. Merging traditional styling with cutting-edge micro-engineering, we design timepieces that redefine elegance and stand as a symbol of modern Indian precision.',
    subtitle: 'From our state-of-the-art assembly headquarters, our designers and engineers push technical limits. We craft robust calibers and elegant designs tailored for individuals who demand sophistication, reliability, and distinction.',
    image: '/assets/spotlight_red_angled.png'
  },
  {
    page: 'about',
    sectionKey: 'pillars',
    name: 'Core Brand Pillars',
    type: 'list',
    order: 2,
    isActive: true,
    title: 'Three Pillars of Horological Excellence',
    items: [
      {
        title: 'PRESTIGE DESIGN',
        description: 'Every caliber is meticulously engineered and assembled by master craftsmen at our state-of-the-art facilities.',
        order: 1,
        isActive: true
      },
      {
        title: 'PRECISION ENGINEERING',
        description: 'Accurately calibrated movements designed to deliver reliable performance and smooth everyday timekeeping.',
        order: 2,
        isActive: true
      },
      {
        title: 'REFINED CRAFTSMANSHIP',
        description: 'Uncompromising standards of quality, durable materials, and contemporary luxury design.',
        order: 3,
        isActive: true
      }
    ]
  },

  // ─── CONTACT PAGE (contact) ───────────────────────────────────────────────
  {
    page: 'contact',
    sectionKey: 'concierge',
    name: 'Concierge & Headquarters',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Concierge Inquiry',
    subtitle: 'Available Mon–Sat, 10 AM – 7 PM IST',
    description: 'Reserve a personalized consultation or viewing session with our private concierge team.',
    label: 'Office No. - 2, Chamber - 4, Udaigiri Tower, Kaushambi, Ghaziabad, Uttar Pradesh — 201010, India',
    buttonText: 'support@khroniq.com',
    buttonLink: 'mailto:support@khroniq.com'
  },

  // ─── FAQ PAGE (faq) ───────────────────────────────────────────────────────
  {
    page: 'faq',
    sectionKey: 'faq_list',
    name: 'Frequently Asked Questions',
    type: 'list',
    order: 1,
    isActive: true,
    title: 'Frequently Asked Questions',
    subtitle: 'Comprehensive Client Support Directory',
    description: 'Find official answers regarding watch movements, water resistance, care, warranty coverage, and shipping.',
    items: [
      { order: 1, isActive: true, title: "What type of movement does KHRONIQ use?", description: "KHRONIQ watches are equipped with high-quality quartz movements designed to deliver accurate and reliable timekeeping." },
      { order: 2, isActive: true, title: "Are KHRONIQ watches waterproof?", description: "KHRONIQ watches are water-resistant according to the rating specified for each model. Please refer to your watch's specifications before exposing it to water." },
      { order: 3, isActive: true, title: "Can I wear my watch while swimming?", description: "Only watches specifically rated for swimming should be worn in water. Always check your model's water-resistance rating before swimming or participating in water activities." },
      { order: 4, isActive: true, title: "Can I wear my watch while showering?", description: "No. Hot water, soap, shampoo, and steam may damage the seals and reduce water resistance over time." },
      { order: 5, isActive: true, title: "How long does the battery last?", description: "Depending on the model and usage, the battery typically lasts between 2 to 5 years." },
      { order: 6, isActive: true, title: "Can I replace the battery myself?", description: "No. Battery replacement should only be carried out by KHRONIQ or an authorized service centre to maintain product integrity and water resistance." },
      { order: 7, isActive: true, title: "Why has my watch stopped working?", description: "Possible reasons include battery depletion, impact damage, water damage, or internal movement malfunction. If your watch stops unexpectedly, please contact KHRONIQ Customer Support." },
      { order: 8, isActive: true, title: "Why is my watch gaining or losing a few seconds?", description: "Minor variations in quartz timekeeping are normal and fall within accepted industry standards." },
      { order: 9, isActive: true, title: "Can I adjust the date at any time?", description: "No. Do not adjust the date between 9:00 PM and 3:00 AM, as this may damage the date-change mechanism." },
      { order: 10, isActive: true, title: "Can I wear my watch while sleeping?", description: "Although it is possible, removing your watch while sleeping can help reduce unnecessary wear on the strap and case." },
      { order: 11, isActive: true, title: "How do I clean my watch?", description: "Use a soft microfiber cloth to gently clean the watch. Avoid abrasive cleaners, harsh chemicals, or polishing compounds." },
      { order: 12, isActive: true, title: "Can leather straps get wet?", description: "Leather straps should be kept away from excessive moisture. If they become wet, dry them naturally and avoid direct heat." },
      { order: 13, isActive: true, title: "Can I replace the strap?", description: "Yes. Most KHRONIQ watches support compatible replacement straps. We recommend using genuine KHRONIQ straps whenever available." },
      { order: 14, isActive: true, title: "Does the warranty cover accidental damage?", description: "No. The warranty covers manufacturing defects only and does not cover accidental damage, misuse, normal wear and tear, battery depletion, or unauthorized repairs." },
      { order: 15, isActive: true, title: "What should I do if my watch arrives damaged?", description: "If your watch arrives damaged or the package appears tampered with, contact KHRONIQ within 24 hours of delivery and provide photographs of the product and packaging." },
      { order: 16, isActive: true, title: "How can I verify that my watch is genuine?", description: "Purchase only from KHRONIQ or an authorized dealer. Verify the serial number or QR code, where applicable, and retain your original purchase invoice." },
      { order: 17, isActive: true, title: "Can I return my watch?", description: "Returns are accepted only in accordance with the KHRONIQ Return & Refund Policy. Please review the policy on our Website for eligibility and conditions." },
      { order: 18, isActive: true, title: "How can I claim my warranty?", description: "Contact KHRONIQ Customer Support with your purchase invoice, warranty card, watch serial number (if applicable), and photographs or videos showing the issue. Our team will guide you through the warranty claim process." },
      { order: 19, isActive: true, title: "Do I need to register my warranty?", description: "Warranty registration may be available for selected models. Even if registration is optional, we recommend completing it for faster service and product verification." },
      { order: 20, isActive: true, title: "Can I repair my watch at any local shop?", description: "No. Repairs should only be performed by KHRONIQ or an authorized service centre. Unauthorized repairs may void your warranty." },
      { order: 21, isActive: true, title: "Are replacement parts genuine?", description: "Yes. KHRONIQ uses genuine replacement parts for approved warranty and service repairs, subject to availability." },
      { order: 22, isActive: true, title: "Do watch colours look exactly the same as shown online?", description: "We strive to display products accurately. However, slight differences in colour or finish may occur due to screen settings, lighting, and photography." },
      { order: 23, isActive: true, title: "Do you offer gift wrapping?", description: "Yes, premium gift packaging may be available for eligible products during checkout." },
      { order: 24, isActive: true, title: "Can I cancel my order?", description: "Orders can generally be cancelled only before dispatch. Once shipped, the order is subject to the applicable Return & Refund Policy." },
      { order: 25, isActive: true, title: "How long does delivery take?", description: "Estimated delivery timelines are: Metro Cities 2–5 business days, Tier-2 & Tier-3 Cities 3–7 business days, Remote Areas 5–10 business days. Actual delivery times may vary due to logistics or Force Majeure events." },
      { order: 26, isActive: true, title: "How can I contact KHRONIQ Customer Support?", description: "Email: support@khroniq.com. Our Customer Support team will be happy to assist you with product information, warranty claims, order tracking, returns, servicing, and general enquiries." }
    ]
  },

  // ─── NAVIGATION (navigation) ───────────────────────────────────────────────
  {
    page: 'navigation',
    sectionKey: 'header_nav',
    name: 'Header Navigation Menu',
    type: 'list',
    order: 1,
    isActive: true,
    items: [
      { title: 'HOME', buttonLink: 'home', order: 1, isActive: true },
      { title: 'MEN', buttonLink: 'shop', metadata: { filter: { gender: 'men' } }, order: 2, isActive: true },
      { title: 'WOMEN', buttonLink: 'shop', metadata: { filter: { gender: 'women' } }, order: 3, isActive: true },
      { title: 'SHOP ALL', buttonLink: 'shop', metadata: { filter: { shopAll: true } }, order: 4, isActive: true },
      { title: 'CUSTOMIZE', buttonLink: 'customization', order: 5, isActive: true },
      { title: '🎁 GIFTING', buttonLink: 'gifting', metadata: { megaMenu: true }, order: 6, isActive: true }
    ]
  },

  // ─── POLICIES ─────────────────────────────────────────────────────────────
  {
    page: 'terms',
    sectionKey: 'policy_terms',
    name: 'Terms of Service Overview',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Terms of Service',
    subtitle: 'Effective Date: 1st July 2026',
    description: 'Welcome to KHRONIQ. These Terms of Service constitute a legally binding agreement between you and True Knock Industries Private Limited governing access, account creation, intellectual property, and order fulfillment.'
  },
  {
    page: 'privacy',
    sectionKey: 'policy_privacy',
    name: 'Privacy Policy Overview',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Privacy Policy',
    subtitle: 'Effective Date: 1st July 2026',
    description: 'This Privacy Policy describes how KHRONIQ collects, uses, and discloses your personal data when you visit or make purchases through our official website.'
  },
  {
    page: 'shipping',
    sectionKey: 'policy_shipping',
    name: 'Shipping & Delivery Policy',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Shipping & Delivery Policy',
    subtitle: 'Effective Date: 1st July 2026',
    description: 'Estimated delivery timelines: Metro Cities 2–5 business days, Tier-2 & Tier-3 Cities 3–7 business days, Remote Areas 5–10 business days. Orders dispatched via secure insured logistics.'
  },
  {
    page: 'returns',
    sectionKey: 'policy_returns',
    name: 'Return & Refund Policy',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Return & Refund Policy',
    subtitle: 'Effective Date: 1st July 2026',
    description: 'This Return & Refund Policy explains eligibility guidelines, the 7-day inspection window, required unworn condition with tags intact, and prompt refund settlement.'
  },
  {
    page: 'warranty',
    sectionKey: 'policy_warranty',
    name: 'Warranty Policy Overview',
    type: 'standard',
    order: 1,
    isActive: true,
    title: 'Warranty Policy',
    subtitle: 'Effective Date: 1st July 2026',
    description: 'Every KHRONIQ timepiece is rigorously inspected and calibrated. Our warranty covers manufacturing defects under normal usage with authorized repairs and genuine replacement components.'
  }
];

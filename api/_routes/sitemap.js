import express from 'express';
import Product from '../_models/Product.js';
import Blog from '../_models/Blog.js';

const router = express.Router();

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date) {
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
}

// @route   GET /api/sitemap.xml (or /sitemap-products.xml)
// @desc    Dynamic XML sitemap indexing all active timepieces and blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://www.khroniq.com';

    // Fetch products (lean query for low memory footprint)
    const products = await Product.find({}, '_id modelNo slug image name updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch blogs
    let blogs = [];
    try {
      blogs = await Blog.find({}, '_id title image updatedAt createdAt').lean();
    } catch (_) {}

    const staticRoutes = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/men`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/women`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/shop-all`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/gifting`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/customization`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/blogs`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/warranty`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${baseUrl}/contact`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${baseUrl}/faq`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${baseUrl}/policies`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/privacy`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/shipping`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/returns`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/cancellation`, priority: '0.5', changefreq: 'monthly' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static core pages
    for (const r of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(r.loc)}</loc>\n`;
      xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
      xml += `    <priority>${r.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Products
    for (const p of products) {
      const identifier = p.slug || p.modelNo || p._id;
      if (!identifier) continue;

      const productUrl = `${baseUrl}/product/${encodeURIComponent(identifier.toString())}`;
      const lastMod = formatDate(p.updatedAt || p.createdAt);

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(productUrl)}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;

      if (p.image) {
        let imgUrl = p.image;
        if (imgUrl.startsWith('/')) {
          imgUrl = `${baseUrl}${imgUrl}`;
        }
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
        if (p.name) {
          xml += `      <image:title>${escapeXml(p.name)}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
      }

      xml += `  </url>\n`;
    }

    // Dynamic Blogs
    for (const b of blogs) {
      if (!b._id) continue;
      const blogUrl = `${baseUrl}/blogs?id=${b._id}`;
      const lastMod = formatDate(b.updatedAt || b.createdAt);

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(blogUrl)}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      if (b.image) {
        let imgUrl = b.image;
        if (imgUrl.startsWith('/')) {
          imgUrl = `${baseUrl}${imgUrl}`;
        }
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
        if (b.title) {
          xml += `      <image:title>${escapeXml(b.title)}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.khroniq.com/</loc></url></urlset>`);
  }
});

export default router;

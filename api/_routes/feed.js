import express from 'express';
import Product from '../_models/Product.js';

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

function getSellingPrice(product) {
  if (!product) return 0;
  if (product.sellingPrice !== undefined && product.sellingPrice !== null) return Number(product.sellingPrice) || 0;
  if (product.salePrice !== undefined && product.salePrice !== null) return Number(product.salePrice) || 0;
  const mrp = Number(product.originalPrice || product.price) || 0;
  const discountPercent = Number(product.discountPercent) || 0;
  if (discountPercent > 0 && discountPercent < 100) {
    return Math.round(mrp * (100 - discountPercent) / 100);
  }
  return mrp;
}

function cleanTitle(rawName) {
  if (!rawName) return 'KHRONIQ Luxury Watch';
  const parts = rawName.split('|').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const collection = parts[2]
      .replace(/MEN\x27S/i, "Men's")
      .replace(/WOMEN\x27S/i, "Women's")
      .replace(/WATCH/i, 'Watch')
      .replace(/-+/g, '—')
      .trim();
    const dial = parts[3] ? ` (${parts[3].toLowerCase().replace(/\b\w/g, c => c.toUpperCase())})` : '';
    return `KHRONIQ ${collection}${dial}`;
  }
  return rawName;
}

// @route   GET /api/google-feed.xml (or /google-feed.xml)
// @desc    Dynamic Google Merchant Center XML feed auto-synced with MongoDB
// @access  Public
router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://www.khroniq.com';
    const products = await Product.find({}).sort({ createdAt: -1, _id: -1 }).lean();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>KHRONIQ Watches India</title>\n`;
    xml += `    <link>${baseUrl}</link>\n`;
    xml += `    <description>Luxury &amp; stylish analog watches for men and women in India</description>\n`;

    for (const p of products) {
      const id = p.modelNo || (p._id ? p._id.toString() : '');
      const link = `${baseUrl}/product/${encodeURIComponent(id)}`;
      const img = p.image || (Array.isArray(p.images) && p.images[0]) || '';
      const fullImg = img.startsWith('http') ? img : `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
      const title = cleanTitle(p.name);
      const price = getSellingPrice(p);
      const formattedPrice = `${Number(price || 2499).toFixed(2)} INR`;
      const isAvailable = (p.stock === undefined || p.stock === null || p.stock > 0) ? 'in_stock' : 'out_of_stock';
      const gender = (p.gender === 'women') ? 'female' : 'male';
      const desc = p.description
        ? p.description.slice(0, 500).trim()
        : `KHRONIQ luxury analog watch with premium craftsmanship, official warranty and free express shipping in India.`;

      xml += `    <item>\n`;
      xml += `      <g:id>${escapeXml(id)}</g:id>\n`;
      xml += `      <g:title>${escapeXml(title)}</g:title>\n`;
      xml += `      <g:description>${escapeXml(desc)}</g:description>\n`;
      xml += `      <g:link>${escapeXml(link)}</g:link>\n`;
      xml += `      <g:image_link>${escapeXml(fullImg)}</g:image_link>\n`;
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:availability>${isAvailable}</g:availability>\n`;
      xml += `      <g:price>${formattedPrice}</g:price>\n`;
      xml += `      <g:brand>KHRONIQ</g:brand>\n`;
      xml += `      <g:gender>${gender}</g:gender>\n`;
      xml += `      <g:age_group>adult</g:age_group>\n`;
      xml += `      <g:shipping>\n`;
      xml += `        <g:country>IN</g:country>\n`;
      xml += `        <g:service>Free Express Shipping</g:service>\n`;
      xml += `        <g:price>0.00 INR</g:price>\n`;
      xml += `      </g:shipping>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n</rss>\n`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating Google Merchant feed:', error);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>KHRONIQ</title></channel></rss>`);
  }
});

export default router;

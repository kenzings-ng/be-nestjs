/**
 * Seed danh mục + sản phẩm mẫu cho storefront (khớp dữ liệu demo bên FE).
 *
 * An toàn để chạy nhiều lần: dùng slug làm khóa, upsert thay vì insert thô,
 * nên không tạo trùng danh mục/sản phẩm nếu chạy lại.
 *
 * Chạy:  node scripts/seed-products.js
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function resolveUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = /^\s*MONGODB_URI\s*=\s*(.*)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('Không tìm thấy MONGODB_URI (env hoặc .env)');
}

const PHOTO_IDS = [
  '1521572163474-6864f9cf17ab',
  '1591047139829-d91aecb6caea',
  '1445205170230-053b83016050',
  '1490481651871-ab68de25d43d',
  '1515372039744-b8f02a3ae446',
  '1552374196-c4e7ffc6e126',
  '1503342217505-b0a15ec3261c',
  '1490578474895-699cd4e2cf59',
  '1509631179647-0177331693ae',
  '1525507119028-ed4c629a60a3',
  '1560243563-062bfc001d68',
  '1441984904996-e0b6ba687e04',
  '1469334031218-e382a71b716b',
  '1529139574466-a303027c1d8b',
  '1485462537746-965f33f7f6a7',
  '1524504388940-b1c1722653e1',
  '1520006403909-838d6b92c22e',
  '1554568218-0f1715e72254',
  '1551232864-3f0890e580d9',
  '1503341455253-b2e723bb3dbb',
  '1516762689617-e1cffcef479d',
  '1490114538077-0a7f8cb49891',
  '1489987707025-afc232f7ea0f',
  '1434389677669-e08b4cac3105',
  '1544022613-e87ca75a784a',
  '1483985988355-763728e1935b',
  '1566174053879-31528523f8ae',
  '1601924994987-69e26d50dc26',
  '1596783074918-c84cb06531ca',
];

function unsplash(index, width = 900, height = 1125) {
  const id = PHOTO_IDS[index % PHOTO_IDS.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

const CATEGORIES = [
  { slug: 'outerwear', title: 'Outerwear' },
  { slug: 'knitwear', title: 'Knitwear' },
  { slug: 'tailoring', title: 'Tailoring' },
  { slug: 'dresses', title: 'Dresses' },
  { slug: 'accessories', title: 'Accessories' },
  { slug: 'footwear', title: 'Footwear' },
];

const PRODUCTS = [
  {
    slug: 'the-wool-overcoat',
    name: 'The Wool Overcoat',
    category: 'outerwear',
    price: 480,
    newArrival: true,
    stock: 25,
    description:
      'Cut from double-faced Italian wool, this overcoat is built on a single principle: a coat should outlast the season it was bought for. The silhouette is architectural but unfussy — a straight shoulder, a clean drape, room enough to layer through the coldest months.',
    details: [
      '100% double-faced Italian wool',
      'Horn buttons, hand-finished lapel',
      'Interior pocket in Bemberg lining',
      'Dry clean only',
    ],
    images: [unsplash(0), unsplash(1), unsplash(2)],
    colors: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Charcoal', hex: '#3A3A3A' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'cashmere-crewneck',
    name: 'Cashmere Crewneck',
    category: 'knitwear',
    price: 210,
    stock: 40,
    description:
      'Two-ply Mongolian cashmere, spun soft enough for bare skin and dense enough to hold its shape wash after wash. A quiet wardrobe staple with a slightly relaxed body and ribbed cuffs.',
    details: [
      '100% two-ply cashmere',
      'Ribbed collar, cuffs and hem',
      'Hand wash cold, dry flat',
    ],
    images: [unsplash(3), unsplash(4), unsplash(5)],
    colors: [
      { name: 'Ivory', hex: '#F2EDE4' },
      { name: 'Forest', hex: '#2F4538' },
      { name: 'Burnished Gold', hex: '#B8860B' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'tailored-wide-leg-trouser',
    name: 'Tailored Wide-Leg Trouser',
    category: 'tailoring',
    price: 165,
    stock: 30,
    description:
      'A high-rise trouser with a fluid wide leg, finished with a pressed center crease. Woven from a wool-blend that resists wrinkling through a full day of wear.',
    details: [
      '70% wool, 28% viscose, 2% elastane',
      'Concealed hook-and-bar closure',
      'Side seam pockets',
    ],
    images: [unsplash(6), unsplash(7), unsplash(8)],
    colors: [
      { name: 'Charcoal', hex: '#3A3A3A' },
      { name: 'Sand', hex: '#D8CBB8' },
    ],
    sizes: ['24', '26', '28', '30', '32'],
  },
  {
    slug: 'silk-slip-dress',
    name: 'Silk Slip Dress',
    category: 'dresses',
    price: 240,
    newArrival: true,
    stock: 20,
    description:
      'Cut on the bias from mulberry silk charmeuse, this slip dress moves the way liquid does. Adjustable straps and a fitted bodice taper into a softly gathered skirt.',
    details: [
      '100% mulberry silk charmeuse',
      'Adjustable straps, side zip',
      'Dry clean only',
    ],
    images: [unsplash(9), unsplash(10), unsplash(11)],
    colors: [
      { name: 'Champagne', hex: '#E8D9B5' },
      { name: 'Rich Black', hex: '#1A1A1A' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'leather-tote',
    name: 'The Leather Tote',
    category: 'accessories',
    price: 320,
    stock: 15,
    description:
      'Vegetable-tanned leather that develops a deeper patina with every season carried. Structured enough for the office, roomy enough for everything else.',
    details: [
      'Full-grain vegetable-tanned leather',
      'Interior zip and slip pockets',
      'Brass hardware, detachable strap',
    ],
    images: [unsplash(12), unsplash(13), unsplash(14)],
    colors: [
      { name: 'Cognac', hex: '#9A5B3A' },
      { name: 'Rich Black', hex: '#1A1A1A' },
    ],
    sizes: ['One Size'],
  },
  {
    slug: 'structured-blazer',
    name: 'Structured Blazer',
    category: 'tailoring',
    price: 295,
    stock: 22,
    description:
      'A single-breasted blazer with a sculpted shoulder and nipped waist, built on a canvassed chest for a jacket that holds its shape rather than following the body.',
    details: [
      '98% wool, 2% elastane',
      'Canvassed chest construction',
      'Functional cuff buttons',
    ],
    images: [unsplash(15), unsplash(16), unsplash(17)],
    colors: [
      { name: 'Charcoal', hex: '#3A3A3A' },
      { name: 'Camel', hex: '#C19A6B' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'merino-turtleneck',
    name: 'Merino Turtleneck',
    category: 'knitwear',
    price: 145,
    stock: 35,
    description:
      'Fine-gauge merino wool, knit close to the body with a stand turtleneck collar. Light enough to layer, warm enough to wear alone.',
    details: [
      '100% extrafine merino wool',
      'Fine 14-gauge knit',
      'Machine wash cold, lay flat to dry',
    ],
    images: [unsplash(18), unsplash(19), unsplash(20)],
    colors: [
      { name: 'Ivory', hex: '#F2EDE4' },
      { name: 'Warm Gray', hex: '#6B6B6B' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'leather-ankle-boot',
    name: 'Leather Ankle Boot',
    category: 'footwear',
    price: 275,
    stock: 18,
    description:
      'A clean-lined ankle boot in supple calfskin, built on a leather sole with a stacked block heel. Designed to work equally well with tailoring and denim.',
    details: [
      'Calfskin leather upper',
      'Leather sole, stacked block heel',
      'Side zip closure',
    ],
    images: [unsplash(21), unsplash(22), unsplash(23)],
    colors: [
      { name: 'Cognac', hex: '#9A5B3A' },
      { name: 'Rich Black', hex: '#1A1A1A' },
    ],
    sizes: ['36', '37', '38', '39', '40', '41'],
  },
  {
    slug: 'linen-shirt-dress',
    name: 'Linen Shirt Dress',
    category: 'dresses',
    price: 195,
    stock: 28,
    description:
      'Washed European linen, cut in a relaxed shirt-dress silhouette with a self-belt at the waist. Softens and drapes further with every wash.',
    details: [
      '100% European linen',
      'Mother-of-pearl buttons',
      'Removable self-belt',
    ],
    images: [unsplash(24), unsplash(25), unsplash(26)],
    colors: [
      { name: 'Sand', hex: '#D8CBB8' },
      { name: 'Forest', hex: '#2F4538' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'cotton-trench',
    name: 'Cotton Trench Coat',
    category: 'outerwear',
    price: 385,
    compareAtPrice: 450,
    stock: 24,
    description:
      'A tightly woven cotton gabardine trench with storm flaps, a removable belt and a mid-calf length. Water-resistant enough for a passing shower, timeless enough for every year after.',
    details: [
      '100% cotton gabardine, water-resistant finish',
      'Removable belt, storm flap',
      'Dry clean only',
    ],
    images: [unsplash(27), unsplash(28)],
    colors: [
      { name: 'Sand', hex: '#D8CBB8' },
      { name: 'Rich Black', hex: '#1A1A1A' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
];

(async () => {
  const uri = resolveUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log(`\nSeed products — ${db.databaseName}\n`);

  const categories = db.collection('categories');
  const products = db.collection('products');

  const categoryIdBySlug = new Map();
  for (const cat of CATEGORIES) {
    const res = await categories.findOneAndUpdate(
      { slug: cat.slug },
      { $set: { slug: cat.slug, title: cat.title } },
      { upsert: true, returnDocument: 'after' },
    );
    const doc = res.value ?? (await categories.findOne({ slug: cat.slug }));
    categoryIdBySlug.set(cat.slug, doc._id);
    console.log(`category  ${cat.slug} -> ${doc._id}`);
  }

  for (const p of PRODUCTS) {
    const { category, ...rest } = p;
    const categoryId = categoryIdBySlug.get(category);
    const now = new Date();
    await products.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: { ...rest, categoryId, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    console.log(`product   ${p.slug}`);
  }

  console.log(`\nXong: ${CATEGORIES.length} danh mục, ${PRODUCTS.length} sản phẩm.\n`);
  await client.close();
})().catch((err) => {
  console.error('Seed thất bại:', err);
  process.exit(1);
});

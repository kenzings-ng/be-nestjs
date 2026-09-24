/**
 * Master Rich Store Seeder for MAISON.
 * 
 * Seeds:
 * - 8 Categories (Outerwear, Knitwear, Tailoring, Dresses, Footwear, Accessories, Denim, Loungewear)
 * - 60+ Editorial Fashion Products with multi-images, colors (HEX swatches), sizes, compareAtPrice, stock
 * - 5 Full Editorial Magazine Articles / Journal stories with cover photography
 *
 * Safe to run multiple times (upsert based on slug).
 * Run: node scripts/seed-rich-store.js
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
  return 'mongodb://localhost:27017/nest';
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
  '1539109136881-3be0616acf4b',
  '1558769132-cb1aea458c5e',
  '1512436991641-6745cdb1723f',
  '1508427953056-b00b8d78ebf5',
  '1576995853123-5a10305d93c0',
  '1534528741775-53994a69daeb',
  '1506152983158-b4a74a01c721',
  '1479064555552-3ef4979f8908',
  '1509631179647-0177331693ae',
  '1549298916-b41d501d3772',
  '1525966222134-fcfa99b8ae77',
  '1595950653106-6c9ebd614d3a',
  '1600185365483-26d7a4cc7519',
  '1578632767115-351597cf2477',
  '1515886657613-9f3515b0c78f',
  '1529720317453-c8da503f2051',
  '1584917865442-de89df76afd3',
  '1548036328-c9fa89d128fa',
  '1553062407-98eeb64c6a62',
  '1591561954557-26941169b49e',
  '1576871337632-b9aef4c17ab9',
  '1583743814966-8936f5b7be1a',
  '1608234807905-4466023792f5',
];

function img(idx, w = 900, h = 1125) {
  const id = PHOTO_IDS[idx % PHOTO_IDS.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

const CATEGORIES = [
  { slug: 'outerwear', title: 'Outerwear', description: 'Architectural coats, tailored jackets, and functional layers built for all seasons.' },
  { slug: 'knitwear', title: 'Knitwear', description: 'Spun from Mongolian cashmere and extrafine merino wool for effortless warmth.' },
  { slug: 'tailoring', title: 'Tailoring', description: 'Precision-cut blazers, wide-leg trousers, and structured modern suits.' },
  { slug: 'dresses', title: 'Dresses', description: 'Bias-cut silk slips, washed European linen, and fluid evening silhouettes.' },
  { slug: 'footwear', title: 'Footwear', description: 'Handcrafted calfskin boots, minimalist sneakers, and timeless leather loafers.' },
  { slug: 'accessories', title: 'Accessories', description: 'Vegetable-tanned leather bags, artisanal scarves, and minimal brass accents.' },
  { slug: 'denim', title: 'Denim', description: 'Raw Japanese selvedge and vintage washed cotton denim, engineered to age beautifully.' },
  { slug: 'loungewear', title: 'Loungewear', description: 'Ultra-heavyweight French terry and organic supima cotton essentials for relaxed living.' },
];

const RAW_PRODUCTS = [
  // --- OUTERWEAR (1-8) ---
  {
    slug: 'the-wool-overcoat',
    name: 'The Double-Faced Wool Overcoat',
    category: 'outerwear',
    price: 480,
    compareAtPrice: 560,
    newArrival: true,
    stock: 25,
    description: 'Cut from double-faced Italian wool, this overcoat is built on a single principle: a coat should outlast the season it was bought for. Architectural silhouette with a straight shoulder, clean drape, and room enough to layer through the coldest months.',
    details: ['100% double-faced Italian wool', 'Horn buttons, hand-finished lapel', 'Interior pocket in Bemberg lining', 'Dry clean only'],
    images: [img(0), img(1), img(2)],
    colors: [{ name: 'Camel', hex: '#C19A6B' }, { name: 'Charcoal', hex: '#3A3A3A' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'cotton-trench',
    name: 'Water-Repellent Cotton Trench',
    category: 'outerwear',
    price: 360,
    compareAtPrice: 420,
    newArrival: false,
    stock: 18,
    description: 'A contemporary take on the classic storm trench. Crafted from high-density Japanese cotton gabardine treated with a fluorine-free water-repellent finish.',
    details: ['100% Japanese cotton gabardine', 'Storm flap with throat latch', 'Horn belt buckle and horn buttons', 'Water-resistant finish'],
    images: [img(27), img(28), img(29)],
    colors: [{ name: 'Sand', hex: '#D8CBB8' }, { name: 'Midnight', hex: '#1C2833' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'shearling-cropped-jacket',
    name: 'Merino Shearling Aviator Jacket',
    category: 'outerwear',
    price: 780,
    compareAtPrice: 920,
    newArrival: true,
    stock: 12,
    description: 'Plush Spanish merino shearling with a cracked nappa leather exterior. An heirloom investment designed to develop a rich, personal patina over decades.',
    details: ['100% Spanish merino shearling', 'Full front RiRi brass zipper', 'Buckled collar tab', 'Handcrafted in Portugal'],
    images: [img(1), img(2), img(0)],
    colors: [{ name: 'Espresso', hex: '#362B28' }, { name: 'Cream', hex: '#FFFDD0' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    slug: 'lightweight-padded-liner',
    name: 'Quilted Ripstop Liner Jacket',
    category: 'outerwear',
    price: 195,
    newArrival: false,
    stock: 35,
    description: 'Insulated with recycled PrimaLoft Gold, this featherlight quilted jacket functions equally well as a standalone mid-season piece or snapped into our overcoats.',
    details: ['Recycled Japanese ripstop nylon', 'PrimaLoft Gold eco insulation', 'Concealed snap buttons', 'Machine wash cold'],
    images: [img(30), img(31), img(32)],
    colors: [{ name: 'Olive Drab', hex: '#4B5320' }, { name: 'Matte Black', hex: '#1C1C1C' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'minimalist-rain-parka',
    name: 'Seam-Sealed Technical Parka',
    category: 'outerwear',
    price: 320,
    newArrival: true,
    stock: 22,
    description: 'Three-layer waterproof breathable shell with a crisp matte texture. Fully taped seams keep sudden downpours outside without sacrificing interior breathability.',
    details: ['3-Layer technical waterproof membrane', '15,000mm hydrostatic head', 'Aquaguard waterproof zips', 'Adjustable storm hood'],
    images: [img(32), img(33), img(30)],
    colors: [{ name: 'Slate Gray', hex: '#708090' }, { name: 'Black', hex: '#0A0A0A' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'wool-car-coat',
    name: 'Heavy Melton Wool Car Coat',
    category: 'outerwear',
    price: 440,
    stock: 16,
    description: 'Dense 650gsm melton wool woven in Prato. Cut shorter than a full overcoat for natural mobility when commuting or driving.',
    details: ['100% British wool melton', 'Satin cupro sleeve lining', 'Slash welt pockets', 'Concealed button placket'],
    images: [img(28), img(27), img(1)],
    colors: [{ name: 'Navy', hex: '#000080' }, { name: 'Oatmeal', hex: '#E3DAC9' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'relaxed-linen-duster',
    name: 'Relaxed Belgian Linen Duster',
    category: 'outerwear',
    price: 260,
    compareAtPrice: 310,
    newArrival: false,
    stock: 20,
    description: 'Breezy raw linen coat cut with a draped, flowing collar. Designed to be thrown over casual separates for instant architectural poise.',
    details: ['100% Belgian flax linen', 'Garment dyed and washed', 'Self-fabric tie belt', 'Deep front patch pockets'],
    images: [img(24), img(25), img(26)],
    colors: [{ name: 'Natural Flax', hex: '#C2B280' }, { name: 'Chalk White', hex: '#F5F5F0' }],
    sizes: ['One Size'],
  },
  {
    slug: 'suede-overshirt-jacket',
    name: 'Goat Suede Utility Overshirt',
    category: 'outerwear',
    price: 520,
    newArrival: true,
    stock: 14,
    description: 'Unlined buttery goat suede that feels like a heavy silk shirt with the substance of outerwear. Finished with horn buttons and double chest pockets.',
    details: ['100% full-grain goat suede', 'Unlined body for pure drape', 'Dual chest flap pockets', 'Specialist leather clean'],
    images: [img(15), img(16), img(17)],
    colors: [{ name: 'Tobacco', hex: '#715D47' }, { name: 'Moss Green', hex: '#4A5D4E' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },

  // --- KNITWEAR (9-16) ---
  {
    slug: 'cashmere-crewneck',
    name: 'Relaxed Cashmere Crewneck',
    category: 'knitwear',
    price: 210,
    compareAtPrice: 260,
    newArrival: true,
    stock: 40,
    description: 'Two-ply Mongolian cashmere, spun soft enough for bare skin and dense enough to hold its shape wash after wash. A quiet wardrobe staple with a slightly relaxed body and ribbed cuffs.',
    details: ['100% two-ply Mongolian cashmere', 'Ribbed collar, cuffs and hem', 'Hand wash cold, dry flat', 'GOTS certified yarn'],
    images: [img(3), img(4), img(5)],
    colors: [{ name: 'Ivory', hex: '#F2EDE4' }, { name: 'Forest', hex: '#2F4538' }, { name: 'Burnished Gold', hex: '#B8860B' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'merino-turtleneck',
    name: 'Seamless Merino Turtleneck',
    category: 'knitwear',
    price: 145,
    stock: 35,
    description: 'Fine-gauge merino wool, knit close to the body with a stand turtleneck collar. Light enough to layer cleanly under tailoring, warm enough to wear alone.',
    details: ['100% extrafine merino wool', 'Fine 14-gauge seamless knit', 'Machine wash cold on wool cycle', 'Responsible Wool Standard'],
    images: [img(18), img(19), img(20)],
    colors: [{ name: 'Ivory', hex: '#F2EDE4' }, { name: 'Warm Gray', hex: '#6B6B6B' }, { name: 'Burgundy', hex: '#800020' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'alpaca-ribbed-cardigan',
    name: 'Chunky Alpaca V-Neck Cardigan',
    category: 'knitwear',
    price: 285,
    compareAtPrice: 340,
    newArrival: true,
    stock: 28,
    description: 'Knit from a cloud-soft blend of baby alpaca and organic wool in a bold fisherman rib. Features mottled faux-tortoise buttons and dropped shoulders.',
    details: ['70% baby alpaca, 30% organic wool', 'Chunky 5-gauge fisherman rib', 'Real horn buttons', 'Hand wash cold'],
    images: [img(4), img(5), img(3)],
    colors: [{ name: 'Oatmeal Heather', hex: '#D7C4B7' }, { name: 'Chocolate', hex: '#3D2817' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    slug: 'cashmere-sleeveless-vest',
    name: 'Boxy Cashmere Knit Vest',
    category: 'knitwear',
    price: 160,
    stock: 30,
    description: 'A versatile layering piece designed with generous armholes and a wide ribbed hem. Styles over crisp poplin shirts or worn solo with high-waisted trousers.',
    details: ['100% Grade-A Mongolian cashmere', 'Relaxed boxy silhouette', 'Wide rib detailing', 'Hand wash cold'],
    images: [img(5), img(3), img(4)],
    colors: [{ name: 'Sage Green', hex: '#9CAF88' }, { name: 'Ecru', hex: '#F5F5DC' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'waffle-cotton-half-zip',
    name: 'Waffle Knit Half-Zip Pullover',
    category: 'knitwear',
    price: 135,
    stock: 45,
    description: 'Structured honeycomb waffle knit made from heavy combed organic cotton. Features an antique silver YKK zip and a high fold-over collar.',
    details: ['100% combed organic cotton', 'Heavyweight thermal waffle weave', 'Antique metal half-zip', 'Pre-shrunk for reliable fit'],
    images: [img(19), img(20), img(18)],
    colors: [{ name: 'Mineral Blue', hex: '#5B7C8D' }, { name: 'Off White', hex: '#FAF9F6' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'cable-knit-fisherman-sweater',
    name: 'Heritage Cable Knit Sweater',
    category: 'knitwear',
    price: 230,
    newArrival: false,
    stock: 20,
    description: 'Intricate traditional cable patterns knit from untreated Donegal wool flecked with subtle colored neps. Substantial, durable, and naturally weather-resistant.',
    details: ['100% pure Donegal tweed wool', 'Heritage cable & diamond motifs', 'Natural lanolin water resistance', 'Hand wash only'],
    images: [img(20), img(18), img(19)],
    colors: [{ name: 'Donegal Cream', hex: '#F0ECE1' }, { name: 'Forest Fleck', hex: '#2C3E2D' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'linen-blend-summer-knit',
    name: 'Open-Weave Linen Knit Shirt',
    category: 'knitwear',
    price: 155,
    stock: 38,
    description: 'Textured open-stitch knit blending crisp European linen and organic cotton. Superbly breathable for high summer evenings.',
    details: ['55% linen, 45% organic cotton', 'Breathable open-gauge stitch', 'Camp collar with button loop', 'Gentle machine wash'],
    images: [img(3), img(19), img(5)],
    colors: [{ name: 'Sandstone', hex: '#D2B48C' }, { name: 'Ink Navy', hex: '#1B263B' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    slug: 'merino-polo-sweater',
    name: 'Fine-Rib Merino Knit Polo',
    category: 'knitwear',
    price: 175,
    compareAtPrice: 205,
    newArrival: true,
    stock: 25,
    description: 'A sharp, refined long-sleeve polo knit from Italian superfine merino. Seamless construction around the collar allows it to sit cleanly under a blazer.',
    details: ['100% Super 120s Italian merino wool', 'Concealed 3-button placket', 'Ribbed cuffs and waistband', 'Dry clean or hand wash'],
    images: [img(18), img(3), img(20)],
    colors: [{ name: 'Espresso', hex: '#2A1F1D' }, { name: 'Heather Charcoal', hex: '#333333' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },

  // --- TAILORING (17-24) ---
  {
    slug: 'tailored-wide-leg-trouser',
    name: 'Pleated Wide-Leg Wool Trouser',
    category: 'tailoring',
    price: 165,
    compareAtPrice: 195,
    stock: 30,
    description: 'A high-rise trouser with deep forward pleats and a fluid wide leg. Woven from a fine four-season wool blend that resists wrinkling through a full day of meetings and transit.',
    details: ['70% wool, 28% viscose, 2% elastane', 'Concealed hook-and-bar waistband closure', 'Deep front pleats and side seam pockets', 'Dry clean only'],
    images: [img(6), img(7), img(8)],
    colors: [{ name: 'Charcoal', hex: '#3A3A3A' }, { name: 'Sand', hex: '#D8CBB8' }, { name: 'Black', hex: '#111111' }],
    sizes: ['28', '30', '32', '34', '36'],
  },
  {
    slug: 'structured-blazer',
    name: 'Double-Breasted Wool Blazer',
    category: 'tailoring',
    price: 295,
    compareAtPrice: 360,
    newArrival: true,
    stock: 22,
    description: 'A structured blazer with peak lapels and a subtly sculpted shoulder. Half-canvas interior construction allows the jacket to drape naturally against the chest without feeling rigid.',
    details: ['98% virgin wool, 2% elastane', 'Half-canvassed chest construction', 'Real horn buttons with functional cuff buttonholes', 'Full cupro jacquard lining'],
    images: [img(15), img(16), img(17)],
    colors: [{ name: 'Charcoal', hex: '#3A3A3A' }, { name: 'Camel', hex: '#C19A6B' }],
    sizes: ['36R', '38R', '40R', '42R', '44R'],
  },
  {
    slug: 'relaxed-single-breasted-blazer',
    name: 'Unstructured Linen-Cotton Blazer',
    category: 'tailoring',
    price: 245,
    stock: 24,
    description: 'Unlined, soft-shouldered jacket made for effortless dressing. Drapes like a cardigan but reads with the crisp lines of tailored suiting.',
    details: ['60% European linen, 40% organic cotton', 'Unlined with piped interior seams', 'Patch hip pockets', 'Dual back vents'],
    images: [img(16), img(17), img(15)],
    colors: [{ name: 'Natural Sand', hex: '#E2DAC8' }, { name: 'Midnight Navy', hex: '#162238' }],
    sizes: ['38R', '40R', '42R'],
  },
  {
    slug: 'cropped-straight-tailored-pant',
    name: 'Cropped Cigarette Wool Pant',
    category: 'tailoring',
    price: 155,
    stock: 32,
    description: 'Clean mid-rise trousers terminating right at the ankle bone. Perfect for showing off leather loafers or boots with a sharp center crease.',
    details: ['95% wool, 5% elastane for comfort stretch', 'Curved back waistband for gap-free fit', 'Rear welt pockets', 'Blind hem finish'],
    images: [img(7), img(8), img(6)],
    colors: [{ name: 'Jet Black', hex: '#121212' }, { name: 'Taupe', hex: '#8B8589' }],
    sizes: ['28', '30', '32', '34'],
  },
  {
    slug: 'oversized-poplin-shirt',
    name: 'Crisp Poplin Boy Shirt',
    category: 'tailoring',
    price: 125,
    compareAtPrice: 150,
    newArrival: true,
    stock: 50,
    description: '100% Giza Egyptian cotton woven into a sharp 120-thread-count poplin with a smooth silky touch. Exaggerated cuffs and a curved split hem.',
    details: ['100% Giza long-staple cotton poplin', 'Genuine Australian mother-of-pearl buttons', 'French front placket', 'Machine wash warm, iron crisp'],
    images: [img(8), img(6), img(7)],
    colors: [{ name: 'Optic White', hex: '#FFFFFF' }, { name: 'Sky Stripe', hex: '#C6D9E8' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'silk-habotai-button-down',
    name: 'Washed Silk Camp Collar Shirt',
    category: 'tailoring',
    price: 185,
    stock: 26,
    description: 'Sandwashed 16mm silk habotai that slides against the skin like water. Relaxed cuban camp collar and clean topstitching.',
    details: ['100% sandwashed mulberry silk', 'Camp collar silhouette', 'Real shell buttons', 'Dry clean recommended'],
    images: [img(17), img(15), img(16)],
    colors: [{ name: 'Champagne Silk', hex: '#F7E7CE' }, { name: 'Onyx', hex: '#0F0F0F' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    slug: 'tailored-vest-waistcoat',
    name: 'Sleeveless Tailored Waistcoat',
    category: 'tailoring',
    price: 140,
    newArrival: false,
    stock: 20,
    description: 'A tailored suit vest with an adjustable cinch back and angled hemline. Wear directly against bare skin or layered with its matching trouser.',
    details: ['Italian tropical wool blend', 'Cinched metal back buckle', 'Viscose satin back panel', 'Dry clean only'],
    images: [img(16), img(8), img(15)],
    colors: [{ name: 'Charcoal', hex: '#3A3A3A' }, { name: 'Ivory Cream', hex: '#FFFFF0' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'fluid-drawstring-tailored-pant',
    name: 'Elasticated Back City Trouser',
    category: 'tailoring',
    price: 160,
    stock: 35,
    description: 'The polished front of a tailored trouser paired with an elastic back waistband for uncompromised travel and office comfort.',
    details: ['Wool-viscose stretch flannel', 'Interior drawstring with flat front', 'Tapered leg profile', 'Machine wash gentle'],
    images: [img(7), img(6), img(8)],
    colors: [{ name: 'Dark Olive', hex: '#3B443B' }, { name: 'Black', hex: '#111111' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },

  // --- DRESSES (25-32) ---
  {
    slug: 'silk-slip-dress',
    name: 'Bias-Cut Mulberry Silk Slip',
    category: 'dresses',
    price: 240,
    compareAtPrice: 290,
    newArrival: true,
    stock: 20,
    description: 'Cut on the bias from 19mm mulberry silk charmeuse, this slip dress moves the way liquid does. Adjustable lingerie straps and a fitted bodice taper into a softly gathered floor-grazing skirt.',
    details: ['100% Grade 6A mulberry silk charmeuse', 'True bias-cut construction for natural curve drape', 'French seams throughout', 'Dry clean only'],
    images: [img(9), img(10), img(11)],
    colors: [{ name: 'Champagne', hex: '#E8D9B5' }, { name: 'Rich Black', hex: '#1A1A1A' }, { name: 'Emerald', hex: '#046307' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'linen-shirt-dress',
    name: 'Belted European Linen Shirt Dress',
    category: 'dresses',
    price: 195,
    stock: 28,
    description: 'Washed European linen cut in an effortless shirt-dress silhouette with a removable sash self-belt. Softens and drapes further with every wash cycle.',
    details: ['100% certified European flax linen', 'Mother-of-pearl buttons down front', 'Curved high-low hem with side vents', 'Deep inseam pockets'],
    images: [img(24), img(25), img(26)],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Natural Sand', hex: '#D8CBB8' }, { name: 'Terracotta', hex: '#CC4E33' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'ribbed-knit-midi-dress',
    name: 'Fine Rib-Knit Column Dress',
    category: 'dresses',
    price: 175,
    compareAtPrice: 210,
    newArrival: false,
    stock: 32,
    description: 'A figure-skimming knit midi dress crafted from a blend of organic cotton and modal. Sculptural high neckline and a side slit for unrestricted stride.',
    details: ['60% organic cotton, 40% TENCEL modal', 'Contouring directional rib panels', 'Subtle right-side calf slit', 'Machine wash cold'],
    images: [img(10), img(11), img(9)],
    colors: [{ name: 'Espresso', hex: '#2E1D1A' }, { name: 'Sage', hex: '#77815C' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'tiered-cotton-poplin-maxi',
    name: 'Voluminous Tiered Poplin Maxi',
    category: 'dresses',
    price: 220,
    newArrival: true,
    stock: 18,
    description: 'Sweeping tiered silhouette cut from crisp Italian poplin. Dramatic volume that feels weightless in motion, completed with a subtle keyhole tie back.',
    details: ['100% fine Italian cotton poplin', 'Generous gathered tiers', 'Self-tie neck closure', 'Machine wash cold'],
    images: [img(11), img(9), img(10)],
    colors: [{ name: 'Cobalt Blue', hex: '#0047AB' }, { name: 'Pristine White', hex: '#FEFEFE' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    slug: 'wool-crepe-wrap-dress',
    name: 'Asymmetric Wool Crepe Wrap Dress',
    category: 'dresses',
    price: 290,
    stock: 15,
    description: 'Tailored wrap dress constructed from matte Japanese wool crepe. Clean surplice neckline with an interior button anchor and exterior waist tie.',
    details: ['100% Japanese wool crepe', 'Bemberg cupro lining', 'Asymmetric wrap closure', 'Dry clean only'],
    images: [img(9), img(11), img(10)],
    colors: [{ name: 'Deep Burgundy', hex: '#4A0E17' }, { name: 'Midnight Black', hex: '#050505' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'backless-halter-gown',
    name: 'Minimalist Halter Evening Gown',
    category: 'dresses',
    price: 350,
    compareAtPrice: 420,
    newArrival: true,
    stock: 12,
    description: 'An architectural evening silhouette cut with a dramatic low back and high gathered halter neck. Heavy silk crepe that pools elegantly at the floor.',
    details: ['Heavyweight 30mm silk crepe de chine', 'Concealed neck button fastening', 'Floor sweeping length', 'Specialist dry clean'],
    images: [img(10), img(9), img(11)],
    colors: [{ name: 'Jet Black', hex: '#111111' }, { name: 'Crimson', hex: '#990000' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    slug: 'pleated-apron-midi-dress',
    name: 'Accordion Pleated Apron Dress',
    category: 'dresses',
    price: 215,
    stock: 24,
    description: 'Permanent heat-set accordion pleats that cascade from an apron-style square neckline. Layer over a fine turtleneck in winter or wear bare in summer.',
    details: ['100% recycled technical poly crepe', 'Heat-set micro pleating', 'Adjustable shoulder straps', 'Hand wash cold'],
    images: [img(11), img(10), img(9)],
    colors: [{ name: 'Silver Gray', hex: '#C0C0C0' }, { name: 'Black', hex: '#1A1A1A' }],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    slug: 'raw-silk-tunic-dress',
    name: 'Textured Noil Raw Silk Tunic',
    category: 'dresses',
    price: 210,
    stock: 22,
    description: 'Nubby organic raw silk noil with the breathability of cotton and the nubby texture of natural linen. Deep V-neck with relaxed drop shoulders.',
    details: ['100% raw silk noil', 'Pre-washed for soft matte hand', 'Side slits for movement', 'Gentle hand wash'],
    images: [img(9), img(24), img(11)],
    colors: [{ name: 'Unbleached Cream', hex: '#EBE6DC' }, { name: 'Charcoal Wash', hex: '#3B3B3B' }],
    sizes: ['S', 'M', 'L'],
  },

  // --- FOOTWEAR (33-40) ---
  {
    slug: 'leather-ankle-boot',
    name: 'Calfskin Stacked Block Boot',
    category: 'footwear',
    price: 275,
    compareAtPrice: 320,
    newArrival: false,
    stock: 18,
    description: 'A clean-lined ankle boot in supple full-grain calfskin, built on a Blake-stitched leather sole with a stacked 50mm Cuban block heel.',
    details: ['Full-grain Italian calfskin leather', 'Blake-stitched leather sole with rubber injected grip', 'YKK antique brass side zipper', 'Handcrafted in Civitanova Marche, Italy'],
    images: [img(21), img(22), img(23)],
    colors: [{ name: 'Cognac', hex: '#9A5B3A' }, { name: 'Rich Black', hex: '#1A1A1A' }],
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
  },
  {
    slug: 'minimalist-leather-sneaker',
    name: 'Court Low Minimalist Sneaker',
    category: 'footwear',
    price: 180,
    compareAtPrice: 220,
    newArrival: true,
    stock: 45,
    description: 'Stripped of all logos and ornamentation. Supple nappa leather upper, full calfskin glove lining, and a stitched Margom rubber cupsole.',
    details: ['Italian Nappa calf leather upper', '100% calfskin lining and insole', 'Custom vulcanized Margom rubber sole', 'Waxed cotton tonal laces'],
    images: [img(38), img(39), img(40)],
    colors: [{ name: 'Monochrome White', hex: '#FFFFFF' }, { name: 'Off White / Gum', hex: '#F0EAD6' }],
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
  },
  {
    slug: 'chunky-leather-loafer',
    name: 'Commando Lug Penny Loafer',
    category: 'footwear',
    price: 240,
    stock: 25,
    description: 'Traditional penny keeper strap mounted over an exaggerated Vibram commando lug sole. Adds instant grounding grit to tailored trousers or dresses.',
    details: ['Polished French box calf leather', 'Vibram lightweight rubber lug sole', 'Goodyear welted construction', 'Cushioned leather footbed'],
    images: [img(22), img(23), img(21)],
    colors: [{ name: 'Bordeaux', hex: '#58111A' }, { name: 'Gloss Black', hex: '#080808' }],
    sizes: ['39', '40', '41', '42', '43', '44'],
  },
  {
    slug: 'chelsea-boot-crepe-sole',
    name: 'Suede Chelsea Boot on Natural Crepe',
    category: 'footwear',
    price: 265,
    newArrival: true,
    stock: 20,
    description: 'Water-resistant waxed suede from Leeds tanners Charles F. Stead. Hand-lasted over a soft, bouncy natural plantation crepe sole.',
    details: ['C.F. Stead waxed water-resistant suede', 'Natural plantation crepe rubber sole', 'Heavy duty elastic side gussets', 'Front and rear leather pull tabs'],
    images: [img(23), img(21), img(22)],
    colors: [{ name: 'Snuff Suede', hex: '#8B5A2B' }, { name: 'Charcoal Suede', hex: '#363636' }],
    sizes: ['40', '41', '42', '43', '44'],
  },
  {
    slug: 'mule-slide-leather',
    name: 'Sleek Almond Toe Leather Mule',
    category: 'footwear',
    price: 195,
    stock: 30,
    description: 'Backless slip-on mule with an elongated almond toe shape. Padded memory foam footbed encased in buttery calf leather.',
    details: ['Supple lambskin leather upper', 'Leather wrapped 25mm low heel', 'Flexible leather outsole', 'Slip-on ease'],
    images: [img(21), img(38), img(23)],
    colors: [{ name: 'Butter Cream', hex: '#FDF6E2' }, { name: 'Espresso', hex: '#2F1E19' }],
    sizes: ['36', '37', '38', '39', '40', '41'],
  },
  {
    slug: 'combat-lace-up-boot',
    name: '8-Eyelet Field Combat Boot',
    category: 'footwear',
    price: 310,
    compareAtPrice: 380,
    newArrival: false,
    stock: 14,
    description: 'Built like historical military boots with double-row Norwegian welt stitching. Padded tongue and collar to prevent break-in soreness.',
    details: ['Heavy 2.2mm waxed cowhide leather', 'Norwegian storm welt construction', 'Vibram Montagna rubber sole', 'Includes round waxed and flat leather laces'],
    images: [img(22), img(21), img(39)],
    colors: [{ name: 'Matte Black', hex: '#141414' }],
    sizes: ['40', '41', '42', '43', '44', '45'],
  },
  {
    slug: 'strappy-leather-sandal',
    name: 'Minimalist Asymmetric Leather Sandal',
    category: 'footwear',
    price: 165,
    stock: 35,
    description: 'Slender vegetable-tanned leather straps that wrap the foot with delicate simplicity. Built with an ergonomic cupped leather footbed.',
    details: ['Vegetable-tanned vacchetta leather', 'Molded arch support footbed', 'Brass buckle ankle adjustment', 'Handcrafted in Athens'],
    images: [img(38), img(21), img(22)],
    colors: [{ name: 'Natural Tan', hex: '#D2B48C' }, { name: 'Black', hex: '#1C1C1C' }],
    sizes: ['36', '37', '38', '39', '40'],
  },
  {
    slug: 'monk-strap-leather-shoe',
    name: 'Single Monk Strap Leather Shoe',
    category: 'footwear',
    price: 250,
    stock: 19,
    description: 'A contemporary monk shoe featuring a brushed gunmetal buckle and chiseled toe box. Finished by hand with an artisan burnished wash.',
    details: ['French box calf leather', 'Hand-burnished toe finish', 'Solid brass buckle with gunmetal coating', 'Goodyear welted'],
    images: [img(39), img(22), img(23)],
    colors: [{ name: 'Burnished Walnut', hex: '#4A2F1D' }, { name: 'Black', hex: '#0C0C0C' }],
    sizes: ['40', '41', '42', '43', '44'],
  },

  // --- ACCESSORIES (41-48) ---
  {
    slug: 'leather-tote',
    name: 'The Structured Vegetable-Tanned Tote',
    category: 'accessories',
    price: 320,
    compareAtPrice: 380,
    stock: 15,
    description: 'Full-grain vegetable-tanned leather that develops a deeper golden patina with every season carried. Structured enough to stand upright on its own, roomy enough for a 16-inch laptop and overnight essentials.',
    details: ['Full-grain Tuscan vegetable-tanned leather', 'Padded interior laptop compartment (fits up to 16")', 'Solid brushed brass hardware', 'Unlined raw suede interior'],
    images: [img(12), img(13), img(14)],
    colors: [{ name: 'Cognac', hex: '#9A5B3A' }, { name: 'Rich Black', hex: '#1A1A1A' }, { name: 'Olive Green', hex: '#556B2F' }],
    sizes: ['One Size (40cm x 32cm x 14cm)'],
  },
  {
    slug: 'leather-crossbody-bag',
    name: 'Half-Moon Leather Saddle Bag',
    category: 'accessories',
    price: 220,
    compareAtPrice: 260,
    newArrival: true,
    stock: 24,
    description: 'Smooth nappa leather curved into a sculptural half-moon silhouette. Magnetic flap closure with an adjustable shoulder strap for shoulder or crossbody wear.',
    details: ['Soft Italian nappa cowhide', 'Concealed magnetic snap closure', 'Adjustable 5-hole shoulder strap', 'Cotton twill lining with zip pocket'],
    images: [img(13), img(14), img(12)],
    colors: [{ name: 'Caramel', hex: '#C68E17' }, { name: 'Noir', hex: '#0B0B0B' }, { name: 'Bone', hex: '#E3DAC9' }],
    sizes: ['One Size (24cm x 18cm x 7cm)'],
  },
  {
    slug: 'oversized-cashmere-scarf',
    name: 'Brushed Cashmere Blanket Scarf',
    category: 'accessories',
    price: 185,
    stock: 40,
    description: 'Woven from pure Mongolian cashmere and gently brushed with dried teasel heads for an ultra-soft ripple finish. Generous 200cm length.',
    details: ['100% pure cashmere', 'Hand-twisted 8cm fringe trim', 'Teasel brushed ripple finish', 'Dry clean only'],
    images: [img(14), img(12), img(13)],
    colors: [{ name: 'Oatmeal Heather', hex: '#E3DAC9' }, { name: 'Camel', hex: '#C19A6B' }, { name: 'Charcoal', hex: '#363636' }],
    sizes: ['200cm x 70cm'],
  },
  {
    slug: 'brass-buckle-leather-belt',
    name: 'Saddle Leather Dress Belt 30mm',
    category: 'accessories',
    price: 85,
    stock: 60,
    description: 'Cut from 3.5mm thick English bridle leather with hand-beveled and burnished edges. Custom sand-cast solid brass buckle.',
    details: ['3.5mm English bridle leather', 'Sand-cast solid brass hardware', 'Beveled edges waxed by hand', 'Made in England'],
    images: [img(12), img(14), img(13)],
    colors: [{ name: 'Havana Brown', hex: '#5A3825' }, { name: 'Black', hex: '#111111' }],
    sizes: ['80cm', '85cm', '90cm', '95cm', '100cm'],
  },
  {
    slug: 'acetate-sunglasses-frame',
    name: 'Architectural Acetate Sunglasses',
    category: 'accessories',
    price: 190,
    compareAtPrice: 230,
    newArrival: true,
    stock: 30,
    description: 'Chunky 8mm Mazzucchelli acetate frame cut with geometric beveled angles. Fitted with Category 3 CR-39 lenses offering 100% UVA/UVB protection.',
    details: ['Italian Mazzucchelli cellulose acetate', '7-barrel German engineered hinges', '100% UVA/UVB Category 3 optical lenses', 'Includes hard leather case and microfiber cloth'],
    images: [img(34), img(12), img(14)],
    colors: [{ name: 'Vintage Tortoise', hex: '#4B3621' }, { name: 'Solid Black', hex: '#0A0A0A' }, { name: 'Honey Amber', hex: '#D4A373' }],
    sizes: ['One Size (48-22-145)'],
  },
  {
    slug: 'canvas-weekender-duffle',
    name: 'Waxed Canvas & Leather Weekender',
    category: 'accessories',
    price: 340,
    stock: 18,
    description: 'Heavyweight 18oz Scottish waxed cotton canvas paired with bridle leather straps and solid brass rivets. Accommodates 3 to 4 days of clothing with ease.',
    details: ['18oz Halley Stevensons waxed canvas', 'Bridle leather handles and base reinforcement', 'Heavy-duty brass two-way zipper', 'Cabin luggage compliant'],
    images: [img(13), img(12), img(34)],
    colors: [{ name: 'Army Olive', hex: '#4B5320' }, { name: 'Dark Navy', hex: '#1A2438' }],
    sizes: ['One Size (52cm x 30cm x 26cm)'],
  },
  {
    slug: 'ribbed-merino-beanie',
    name: 'Folded Cuff Merino Watch Cap',
    category: 'accessories',
    price: 65,
    stock: 70,
    description: 'Knit seamlessly in Japan from high-twist merino wool yarn. Holds its shape firmly and provides itch-free warmth all winter.',
    details: ['100% extrafine merino wool', 'Seamless 3D circular knit construction', 'Adjustable double-layer turn-up cuff', 'Hand wash cold'],
    images: [img(14), img(34), img(12)],
    colors: [{ name: 'Safety Orange', hex: '#FF5F1F' }, { name: 'Navy', hex: '#0B1D3A' }, { name: 'Charcoal', hex: '#2F2F2F' }],
    sizes: ['One Size'],
  },
  {
    slug: 'minimalist-leather-card-holder',
    name: 'Folded Leather Card Wallet',
    category: 'accessories',
    price: 75,
    stock: 55,
    description: 'Folded origami-style from a single piece of full-grain French calfskin with no stitching to fray or tear over time.',
    details: ['French chèvre goat leather', 'Single-piece origami fold construction', 'Holds up to 10 cards and folded notes', 'Hand-stamped serial number'],
    images: [img(12), img(13), img(14)],
    colors: [{ name: 'Tan', hex: '#D2B48C' }, { name: 'Forest Green', hex: '#1E3F20' }],
    sizes: ['One Size (10cm x 6.5cm)'],
  },

  // --- DENIM (49-54) ---
  {
    slug: 'selvedge-straight-leg-jeans',
    name: '14oz Japanese Selvedge Straight Jean',
    category: 'denim',
    price: 210,
    compareAtPrice: 250,
    newArrival: true,
    stock: 35,
    description: 'Woven on vintage Toyoda shuttle looms in Kojima, Okayama. 14oz rope-dyed indigo selvedge with a pink ID ticker line. Cut with a timeless mid-rise and straight leg.',
    details: ['14oz 100% cotton Kurabo selvedge denim', 'Solid copper punch-through rivets', 'Custom button fly with doughnut buttons', 'Deerskin leather waistband patch'],
    images: [img(43), img(44), img(42)],
    colors: [{ name: 'Raw Indigo', hex: '#152238' }, { name: 'Vintage Stone Wash', hex: '#5D7692' }],
    sizes: ['29', '30', '31', '32', '33', '34', '36'],
  },
  {
    slug: 'loose-fit-wide-jeans',
    name: 'Relaxed Wide-Leg 90s Denim',
    category: 'denim',
    price: 185,
    stock: 40,
    description: 'Loose slouchy fit inspired by early 90s skate and architectural denim. Heavy stone-washed cotton with natural soft fading at the thighs and knees.',
    details: ['100% organic cotton 13oz denim', 'Soft washed hand-feel', '5-pocket classic construction', 'Machine wash cold inside out'],
    images: [img(44), img(42), img(43)],
    colors: [{ name: 'Washed Ice Blue', hex: '#A3BFD9' }, { name: 'Faded Black', hex: '#2B2B2B' }],
    sizes: ['28', '30', '32', '34', '36'],
  },
  {
    slug: 'oversized-denim-trucker-jacket',
    name: 'Type-II Selvedge Denim Jacket',
    category: 'denim',
    price: 260,
    compareAtPrice: 310,
    newArrival: true,
    stock: 22,
    description: 'Iconic Type-II work jacket reimagined with an oversized boxy drop-shoulder cut. Features front double knife pleats and interior selvedge edge detail along the front placket.',
    details: ['13.5oz ring-spun Japanese selvedge denim', 'Boxy oversized silhouette', 'Pleated front with bar-tack anchors', 'Waist adjustment tabs'],
    images: [img(42), img(43), img(44)],
    colors: [{ name: 'Raw Indigo', hex: '#162238' }, { name: 'Washed Black', hex: '#2E2E2E' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'high-rise-ecru-denim-trouser',
    name: 'Natural Ecru Denim Sailor Pant',
    category: 'denim',
    price: 190,
    stock: 28,
    description: 'Unbleached natural cotton denim flecked with raw cottonseed particles. High rise with a wide straight leg that pairs harmoniously with knitwear.',
    details: ['100% unbleached natural cotton denim', 'Exposed button fly', 'Deep sailor front patch pockets', 'Pre-shrunk'],
    images: [img(43), img(42), img(44)],
    colors: [{ name: 'Raw Ecru', hex: '#FDFBF7' }],
    sizes: ['25', '26', '27', '28', '29', '30'],
  },
  {
    slug: 'denim-chore-coat',
    name: 'French Workwear Denim Chore Coat',
    category: 'denim',
    price: 225,
    stock: 30,
    description: 'Traditional French blue collar worker coat updated in rinsed 12oz denim. Triple-needle chainstitching along high stress seams for lifelong endurance.',
    details: ['12oz rinsed indigo denim', 'Three exterior patch pockets + interior chest pocket', 'Triple-stitch chainstitch construction', 'Corozo nut buttons'],
    images: [img(42), img(44), img(43)],
    colors: [{ name: 'Rinse Blue', hex: '#1C3144' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'black-selvedge-tapered-jean',
    name: 'Stay-Black Sulfur Selvedge Jean',
    category: 'denim',
    price: 200,
    stock: 25,
    description: 'Double sulfur dyed yarn to ensure deep saturated black that resists fading over 50+ wash cycles. Subtle taper below the knee.',
    details: ['13.5oz double black selvedge denim', 'Tonal black hardware and rivets', 'Black leather waistband patch', 'Chainstitch hem'],
    images: [img(44), img(43), img(42)],
    colors: [{ name: 'Deep Black', hex: '#050505' }],
    sizes: ['30', '31', '32', '33', '34'],
  },

  // --- LOUNGEWEAR (55-62) ---
  {
    slug: 'heavyweight-french-terry-hoodie',
    name: '500gsm Loopback Terry Hoodie',
    category: 'loungewear',
    price: 145,
    compareAtPrice: 175,
    newArrival: true,
    stock: 45,
    description: 'Constructed from custom knit 500gsm organic loopback French terry. Double-layered hood that stands up effortlessly, ribbed side gussets, and seamless pouch pocket.',
    details: ['500gsm 100% combed organic cotton', 'Cross-grain cut to prevent vertical shrinkage', 'Ribbed side expansion gussets', 'Flatlock stitching throughout'],
    images: [img(47), img(48), img(49)],
    colors: [{ name: 'Washed Ash', hex: '#B2BEB5' }, { name: 'Pitch Black', hex: '#121212' }, { name: 'Earthy Brown', hex: '#594A3C' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    slug: 'relaxed-terry-sweatpant',
    name: 'Wide-Leg Loopback Sweatpant',
    category: 'loungewear',
    price: 130,
    stock: 40,
    description: 'Matching sweatpants crafted from our 500gsm loopback terry. Elasticated waistband with an elongated cotton drawcord and hidden zip pockets.',
    details: ['500gsm 100% organic cotton', 'Heavy gauge drawcord with metal aglets', 'Concealed YKK zippered side pockets', 'Clean open hem'],
    images: [img(48), img(49), img(47)],
    colors: [{ name: 'Washed Ash', hex: '#B2BEB5' }, { name: 'Pitch Black', hex: '#121212' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'supima-cotton-tee',
    name: 'Heavyweight Supima Cotton T-Shirt',
    category: 'loungewear',
    price: 65,
    stock: 80,
    description: 'Spun from American-grown extra-long staple Supima cotton in a substantial 240gsm jersey. Blind-stitched hem and thick 1-inch bound collar that will never bacon.',
    details: ['100% American extra-long staple Supima cotton', '240gsm heavyweight jersey', 'Pre-shrunk garment dye', 'Bound ribbed collar'],
    images: [img(49), img(47), img(48)],
    colors: [{ name: 'Optic White', hex: '#FFFFFF' }, { name: 'Washed Black', hex: '#262626' }, { name: 'Sage Gray', hex: '#8F9779' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    slug: 'organic-cotton-thermal-waffle-crew',
    name: 'Thermal Waffle Long Sleeve Crew',
    category: 'loungewear',
    price: 95,
    stock: 50,
    description: 'Thick vintage thermal honeycomb knit that traps body heat. Flatlock seam construction prevents chafing whether lounging at home or base-layering in snow.',
    details: ['100% organic cotton thermal knit', 'Elongated ribbed cuffs for heat retention', 'Reinforced neck tape', 'Machine wash warm'],
    images: [img(47), img(49), img(48)],
    colors: [{ name: 'Natural Oatmeal', hex: '#E6DFC8' }, { name: 'Heather Charcoal', hex: '#373737' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'fleece-oversized-sweatshirt',
    name: 'Brushed Fleece Crewneck Sweatshirt',
    category: 'loungewear',
    price: 120,
    compareAtPrice: 145,
    newArrival: false,
    stock: 35,
    description: 'Classic collegiate sweatshirt silhouette modernized with dropped shoulders and a dense brushed fleece interior.',
    details: ['80% organic cotton, 20% recycled poly for structure', 'Deep brushed fleece interior', 'V-insert collar detail', 'Machine wash cold'],
    images: [img(48), img(47), img(49)],
    colors: [{ name: 'Navy Blue', hex: '#1B2A4A' }, { name: 'Heather Gray', hex: '#A8A9AD' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'linen-relaxed-lounge-short',
    name: 'Washed Linen Easy Summer Short',
    category: 'loungewear',
    price: 90,
    stock: 45,
    description: 'Breezy washed linen shorts with an elastic drawstring waist and relaxed leg opening. The definitive warm-weather staple for home and beach.',
    details: ['100% European linen', 'Elasticated waist with natural braided cord', 'Deep slant pockets and single back pocket', '6-inch inseam'],
    images: [img(49), img(48), img(47)],
    colors: [{ name: 'Sand', hex: '#D2B48C' }, { name: 'Navy', hex: '#0B1D3A' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'cashmere-lounge-socks',
    name: 'Ribbed Cashmere House Socks',
    category: 'loungewear',
    price: 55,
    stock: 60,
    description: 'Knit from thick 4-ply cashmere with a hint of nylon for stretch retention. The ultimate indoor luxury for cold mornings and lazy weekends.',
    details: ['90% Mongolian cashmere, 10% nylon', 'Thick gauge ribbing', 'Seamless hand-linked toe', 'Hand wash cold'],
    images: [img(47), img(14), img(49)],
    colors: [{ name: 'Charcoal', hex: '#333333' }, { name: 'Camel', hex: '#C19A6B' }],
    sizes: ['M (38-41)', 'L (42-45)'],
  },
  {
    slug: 'cotton-modal-boxer-2pack',
    name: 'Luxury Cotton-Modal Boxer Brief (2-Pack)',
    category: 'loungewear',
    price: 60,
    stock: 75,
    description: 'Ultra-soft blend of Supima cotton and Lenzing MicroModal. Ergonomic pouch and no-roll brushed microfiber waistband.',
    details: ['50% Supima cotton, 45% MicroModal, 5% elastane', 'Pack of two pairs', 'Tagless comfort label', 'Stay-put leg bands'],
    images: [img(48), img(47), img(49)],
    colors: [{ name: 'Black / Heather', hex: '#1C1C1C' }],
    sizes: ['S', 'M', 'L', 'XL'],
  }
];

const ARTICLES = [
  {
    title: 'The Art of Winter Layering: A Masterclass in Proportions and Textures',
    slug: 'the-art-of-winter-layering',
    summary: 'How to combine wool, cashmere, and technical outerwear to create warmth without excess bulk.',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&h=800&q=85',
    category: 'Style & Guides',
    readTime: '5 min read',
    author: 'Clara Chen, Fashion Director',
    publishedAt: new Date('2026-09-18T10:00:00Z'),
    tags: ['Layering', 'Outerwear', 'Knitwear', 'Styling Tips'],
    content: `
## Why Layering is More Than Keeping Warm

Layering is the cornerstone of considered dressing. When done with intention, it creates depth, contrast, and versatile adaptability as you move from brisk morning commutes into heated indoor studios.

### 1. Base Layer: Breathability and Contact
Never underestimate the piece that touches your skin. A **fine-gauge merino turtleneck** or a **240gsm Supima cotton tee** regulates body temperature naturally without trapping moisture. Avoid synthetic polyesters against the skin, which can cause overheating and static cling.

### 2. Mid Layer: Volume and Thermal Insulation
Here is where texture enters the conversation. Pair a chunky **5-gauge baby alpaca cardigan** or a **cashmere crewneck** over your base layer. The contrasting knit textures catch the light and add visual interest when your coat is unbuttoned.

### 3. Outer Layer: Architecture and Silhouette
Your coat is the frame. A structured **double-faced wool overcoat** or an **unstructured trench** gives clean lines to soft interior layers. Look for dropped shoulders and generous armhole cuts so your movement remains effortless.

> "A great outfit should look as deliberate with the coat taken off as it does when bundled up on the street."
    `,
  },
  {
    title: 'The 10-Piece Capsule Wardrobe: 30 Outfits for Contemporary Living',
    slug: 'the-10-piece-capsule-wardrobe',
    summary: 'Curating a focused collection of versatile essentials that eliminate decision fatigue and elevate daily dressing.',
    coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=800&q=85',
    category: 'Wardrobe Philosophy',
    readTime: '6 min read',
    author: 'Marcus Vance, Head of Design',
    publishedAt: new Date('2026-09-14T08:30:00Z'),
    tags: ['Capsule Wardrobe', 'Minimalism', 'Daily Rotation', 'Essentials'],
    content: `
## The Philosophy of Less, But Better

The modern wardrobe is often cluttered with impulse purchases that only work with one specific piece. The MAISON capsule framework is built around **10 anchor pieces** that interact seamlessly:

1. **The Double-Faced Overcoat** in Camel or Charcoal
2. **The Structured Blazer** with soft tailoring
3. **The Pleated Wide-Leg Trouser** in neutral wool
4. **The Selvedge Straight Jean** in raw indigo
5. **The Two-Ply Cashmere Crewneck** in Ivory
6. **The Crisp Poplin Boy Shirt** in White
7. **The Mulberry Silk Slip Dress** in Champagne
8. **The Commando Lug Loafer** in black calfskin
9. **The Minimalist Court Sneaker** in monochrome white
10. **The Structured Leather Tote** in natural cognac

With these 10 garments, you unlock over 30 distinct combinations covering work presentations, gallery openings, casual weekend errands, and evening dining.
    `,
  },
  {
    title: 'Cashmere & Mulberry Silk: The Longevity and Care Manifesto',
    slug: 'cashmere-and-mulberry-silk-care-guide',
    summary: 'Essential rituals to wash, store, and preserve natural luxury fibers so they improve with age.',
    coverImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&h=800&q=85',
    category: 'Material Care',
    readTime: '4 min read',
    author: 'Elena Rostova, Textile Conservator',
    publishedAt: new Date('2026-09-10T14:15:00Z'),
    tags: ['Cashmere Care', 'Silk Preservation', 'Sustainability'],
    content: `
## Caring for Natural Protein Fibers

Cashmere and silk are living fibers that possess natural elasticity and resilience. Dry cleaning every wear damages the delicate lanolin and sericin coats that keep these fibers soft.

### Washing Cashmere at Home
- Use tepid water (under 30°C) with a pH-neutral wool wash or baby shampoo.
- Submerge the sweater and gently squeeze soapy water through the fibers for 3 minutes. Never wring or twist.
- Roll the sweater inside a clean terry towel like a sleeping bag and press firmly to extract excess water.
- Reshape and dry completely flat away from direct sunlight and heat registers.

### Cedar and Summer Storage
Store your knits folded in breathable unbleached cotton bags. Never hang cashmere on a hanger, which distorts shoulder lines. Natural red cedar blocks repel moths naturally without the chemical odor of mothballs.
    `,
  },
  {
    title: 'Behind the Seams: Inside Our Heritage Italian Weaving Mill in Biella',
    slug: 'inside-our-heritage-italian-weaving-mill',
    summary: 'A journey through Piedmont, where spring glacier water and four generations of master weavers craft our signature wool.',
    coverImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&h=800&q=85',
    category: 'Craftsmanship',
    readTime: '7 min read',
    author: 'MAISON Editorial Studio',
    publishedAt: new Date('2026-09-02T11:00:00Z'),
    tags: ['Italian Wool', 'Craftsmanship', 'Biella', 'Sustainability'],
    content: `
## In the Foothills of the Italian Alps

Biella, a quiet province at the foot of the Pennine Alps, has been Italy's wool capital since the 13th century. What makes Biella wool incomparable worldwide is an invisible ingredient: **the water**.

Glacier meltwater filtering through granitic mountain rocks has almost zero calcium or mineral hardness. When raw fleece is washed and finished in this ultra-soft water, the natural scales of the wool fiber relax completely, producing a bloom of softness impossible to replicate artificially.

We partner exclusively with fourth-generation family mills who utilize closed-loop water treatment facilities, ensuring that the water returned to the river is as pure as when it was drawn from the mountain springs.
    `,
  },
  {
    title: 'Architectural Silhouettes: Why Form Defies Seasonal Trends',
    slug: 'architectural-silhouettes-why-form-defies-trends',
    summary: 'Exploring the intersection of brutalist architecture, modern sculpture, and contemporary unisex tailoring.',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&h=800&q=85',
    category: 'Design Notes',
    readTime: '5 min read',
    author: 'Julian Thorne, Architecture Critic',
    publishedAt: new Date('2026-08-25T16:45:00Z'),
    tags: ['Design Philosophy', 'Architecture', 'Unisex Tailoring'],
    content: `
## Garments as Habitable Structures

Fashion often obsesses over ornament: embroidery, logos, micro-trends that expire within twelve weeks. At MAISON, pattern-making begins with spatial logic rather than decoration.

When looking at a mid-century building by Marcel Breuer or Lina Bo Bardi, what resonates is the honesty of materials and the proportion of cantilevered weight. We approach our double-breasted blazers and wide-leg trousers with that same spatial geometry:

- **The Clean Horizontal:** A squared, canvassed shoulder that frames the neck with clarity.
- **The Flowing Drape:** A straight vertical drop that allows air to circulate between garment and body.
- **The Restrained Palette:** Raw stone, charcoal graphite, unbleached wool, and deep midnight indigo.

Clothing should not wear you; it should provide a calm, confident architecture within which your own life unfolds.
    `,
  },
];

async function main() {
  const uri = resolveUri();
  console.log(`[Seed] Connecting to MongoDB at: ${uri}`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    console.log('[Seed] Connected successfully.');

    const categoriesCol = db.collection('categories');
    const productsCol = db.collection('products');
    const articlesCol = db.collection('articles');

    // 1. Seed Categories
    console.log(`[Seed] Upserting ${CATEGORIES.length} categories...`);
    const categoryMap = new Map();
    for (const cat of CATEGORIES) {
      const res = await categoriesCol.findOneAndUpdate(
        { slug: cat.slug },
        { $set: { title: cat.title, slug: cat.slug, description: cat.description } },
        { upsert: true, returnDocument: 'after' }
      );
      categoryMap.set(cat.slug, res?._id || (await categoriesCol.findOne({ slug: cat.slug }))?._id);
    }
    console.log(`[Seed] Categories seeded.`);

    // 2. Seed Products
    console.log(`[Seed] Upserting ${RAW_PRODUCTS.length} rich products...`);
    let prodCount = 0;
    for (const item of RAW_PRODUCTS) {
      const categoryId = categoryMap.get(item.category);
      const doc = {
        name: item.name,
        slug: item.slug,
        categoryId: categoryId || null,
        price: item.price,
        compareAtPrice: item.compareAtPrice || null,
        newArrival: !!item.newArrival,
        stock: item.stock || 20,
        description: item.description,
        details: item.details,
        images: item.images,
        colors: item.colors,
        sizes: item.sizes,
        updatedAt: new Date(),
      };

      await productsCol.updateOne(
        { slug: item.slug },
        {
          $set: doc,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      prodCount++;
    }
    console.log(`[Seed] Successfully seeded ${prodCount} products.`);

    // 3. Seed Articles
    console.log(`[Seed] Upserting ${ARTICLES.length} journal articles...`);
    let articleCount = 0;
    for (const art of ARTICLES) {
      await articlesCol.updateOne(
        { slug: art.slug },
        {
          $set: {
            title: art.title,
            slug: art.slug,
            summary: art.summary,
            content: art.content.trim(),
            coverImage: art.coverImage,
            category: art.category,
            readTime: art.readTime,
            author: art.author,
            publishedAt: art.publishedAt,
            tags: art.tags,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      articleCount++;
    }
    console.log(`[Seed] Successfully seeded ${articleCount} articles.`);

    console.log('\n========================================');
    console.log('✓ Store data enriched with 62 products and 5 editorial articles!');
    console.log('========================================\n');
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();

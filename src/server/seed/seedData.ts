import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { BrandModel } from '../models/Brand';
import { CouponModel, CMSModel } from '../models/Extras';

export const SEED_BRANDS = [
  { _id: 'b1', name: 'Livora Artisan', slug: 'livora-artisan', description: 'Handcrafted solid wood and architectural silhouettes' },
  { _id: 'b2', name: 'Avela Living', slug: 'avela-living', description: 'Contemporary organic linen and upholstered comfort' },
  { _id: 'b3', name: 'Nordic Calm', slug: 'nordic-calm', description: 'Minimalist Scandinavian light fixtures and ceramics' },
  { _id: 'b4', name: 'Serene Home', slug: 'serene-home', description: 'Sustainable botanical planters and organic linens' },
];

export const SEED_CATEGORIES = [
  { _id: 'c1', name: 'Furniture', nameBn: 'আসবাবপত্র', slug: 'furniture', description: 'Sofas, solid wood beds, dining tables & accent seating' },
  { _id: 'c2', name: 'Home Decor', nameBn: 'গৃহসজ্জা', slug: 'home-decor', description: 'Ceramic vases, planters, mirrors, scented candles' },
  { _id: 'c3', name: 'Lighting', nameBn: 'বাতি ও আলোকসজ্জা', slug: 'lighting', description: 'Table lamps, minimalist floor lamps & warm pendants' },
  { _id: 'c4', name: 'Bedding', nameBn: 'বেডিং ও কমফোর্টার', slug: 'bedding', description: 'Breathable linen sheets, knitted throws & memory pillows' },
  { _id: 'c5', name: 'Storage', nameBn: 'স্টোরেজ ও ক্যাবিনেট', slug: 'storage', description: 'Wooden sideboards, consoles & wardrobes' },
  { _id: 'c6', name: 'Rugs', nameBn: 'কার্পেট ও শতরঞ্জি', slug: 'rugs', description: 'Hand-woven jute and wool textured rugs' },
  { _id: 'c7', name: 'Kitchen', nameBn: 'রান্নাঘর ও ডাইনিং', slug: 'kitchen', description: 'Artisanal cookware, ceramics and dinnerware' },
  { _id: 'c8', name: 'Bath', nameBn: 'বাথরুম সামগ্রী', slug: 'bath', description: 'Organic waffle towels and luxury bath accessories' },
  { _id: 'c9', name: 'Outdoor', nameBn: 'আউটডোর ও ব্যালকনি', slug: 'outdoor', description: 'Weatherproof teak chairs and balcony planters' },
  { _id: 'c10', name: 'Books & Mind', nameBn: 'বই ও সাহিত্য', slug: 'books', description: 'Inspirational, lifestyle and self-development books' },
];

export const SEED_CMS = {
  announcementBar: {
    enabled: true,
    text: '✨ Free Shipping on Orders Over ৳5,000 | Stylish Homes. Happier Lives.',
    linkText: 'Track Order',
    linkUrl: '/account/orders',
  },
  heroCampaign: {
    tagline: 'SPACES THAT FEEL LIKE YOU',
    title: 'Beautiful Homes Brighter Lives',
    subtitle: 'Timeless furniture and home essentials for every story.',
    ctaText: 'Shop the Collection',
    ctaLink: '/products',
    secondaryNote: 'A more beautiful tomorrow',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=85',
  },
  splitBanners: {
    left: {
      title: 'Make Every Corner Special',
      subtitle: 'Up to 40% Off Home Decor',
      ctaText: 'Shop Decor',
      ctaLink: '/products?category=home-decor',
      imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=700&q=80',
    },
    right: {
      title: 'Comfort Lives Here',
      subtitle: 'Premium Bedding Collection Up to 30% Off',
      ctaText: 'Shop Bedding',
      ctaLink: '/products?category=bedding',
      imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
    },
  },
  promotionalAd: {
    enabled: true,
    title: 'Artisan Heritage Collection — Handcrafted Teak & Brass',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    destinationUrl: '/products?category=furniture',
    altText: 'Artisan Teakwood Promo Banner',
    badgeText: 'SEASONAL SHOWCASE',
  },
  curatedCollections: [
    { title: 'Modern Minimalist', slug: 'furniture', imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80' },
    { title: 'Cozy Living', slug: 'bedding', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' },
    { title: 'Outdoor Retreat', slug: 'outdoor', imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80' },
    { title: 'Small Space Solutions', slug: 'storage', imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80' },
  ],
  trustStats: {
    customersCount: '100k+',
    satisfactionRate: '99.4%',
    deliveryPromise: '24-48 Hours Inside Dhaka',
  },
};

export const SEED_PRODUCTS: any[] = [
  {
    _id: '670c10000000000000000001',
    name: 'Avela 3-Seater Sofa',
    nameBn: 'আভেলা ৩-সিটার সোফা',
    slug: 'avela-3-seater-sofa',
    sku: 'LIV-SOFA-001',
    brand: 'Avela Living',
    category: 'furniture',
    description: 'Impeccably tailored 3-seater sofa draped in premium Belgian textured linen. Features kiln-dried solid mahogany frame and plush high-resilience foam cushions for unparalleled lounging.',
    features: ['Belgian organic linen fabric', 'Kiln-dried solid wood inner frame', 'High-density pocket spring cushioning', 'Removable and washable cushion covers'],
    basePrice: 75000,
    salePrice: 69900,
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { sku: 'LIV-SOFA-001-OAT', name: 'Oatmeal Beige', options: { Color: 'Oatmeal Beige' }, price: 69900, stock: 5 },
      { sku: 'LIV-SOFA-001-OLV', name: 'Olive Green', options: { Color: 'Olive Green' }, price: 71900, stock: 3 },
    ],
    categoryAttributes: { Dimensions: '88" W x 38" D x 34" H', SeatingCapacity: 3, Material: 'Solid Mahogany & Linen' },
    badges: ['New', 'Best Seller'],
    status: 'active',
    rating: 4.9,
    numReviews: 124,
  },
  {
    _id: '670c10000000000000000002',
    name: 'Noor Wooden Bed',
    nameBn: 'নূর সলিড উডেন বেড',
    slug: 'noor-wooden-bed',
    sku: 'LIV-BED-002',
    brand: 'Livora Artisan',
    category: 'furniture',
    description: 'Architectural platform bed constructed from sustainably harvested solid teakwood. Minimalist floating frame profile with ergonomic headboard slant.',
    features: ['100% Solid Teakwood construction', 'Natural beeswax hand-buffed finish', 'Heavy-duty interlocking slat system', 'Zero-creak engineered joints'],
    basePrice: 58000,
    salePrice: 54900,
    stock: 6,
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { sku: 'LIV-BED-002-KNG', name: 'King Size (6ft x 7ft)', options: { Size: 'King (6x7 ft)' }, price: 54900, stock: 4 },
      { sku: 'LIV-BED-002-QUN', name: 'Queen Size (5ft x 7ft)', options: { Size: 'Queen (5x7 ft)' }, price: 49900, stock: 2 },
    ],
    categoryAttributes: { Size: 'King Size', WoodType: 'Chittagong Teak' },
    badges: ['New'],
    status: 'active',
    rating: 4.8,
    numReviews: 98,
  },
  {
    _id: '670c10000000000000000003',
    name: 'Lume Dining Table',
    nameBn: 'লুমে ডাইনিং টেবিল',
    slug: 'lume-dining-table',
    sku: 'LIV-TAB-003',
    brand: 'Livora Artisan',
    category: 'furniture',
    description: 'Refined 6-seater dining table with tapered cylindrical legs and organic soft-curved chamfered edge tabletop.',
    features: ['Seats 6 adults comfortably', 'Solid American oak veneer on solid core', 'Scratch and water-resistant matte PU coat'],
    basePrice: 44000,
    salePrice: 39900,
    stock: 5,
    images: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    categoryAttributes: { SeatingCapacity: 6, Dimensions: '72" L x 36" W x 30" H' },
    badges: ['New'],
    status: 'active',
    rating: 4.8,
    numReviews: 76,
  },
  {
    _id: '670c10000000000000000004',
    name: 'Orbi Table Lamp',
    nameBn: 'অরবি সিরামিক টেবিল বাতি',
    slug: 'orbi-table-lamp',
    sku: 'LIV-LMP-004',
    brand: 'Nordic Calm',
    category: 'lighting',
    description: 'Artisanal ceramic base finished in matte textured sand with hand-pleated linen lampshade emitting a warm 2700K ambient glow.',
    features: ['Textured ceramic base', 'Linen shade', 'Rotary brass dimmer switch', 'Warm LED bulb included'],
    basePrice: 9900,
    salePrice: 8900,
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['New', 'Popular'],
    status: 'active',
    rating: 4.9,
    numReviews: 213,
  },
  {
    _id: '670c10000000000000000005',
    name: 'Serene Planter',
    nameBn: 'সেরিন সেরামিক প্ল্যান্টার',
    slug: 'serene-planter',
    sku: 'LIV-PLN-005',
    brand: 'Serene Home',
    category: 'home-decor',
    description: 'Hand-thrown terracotta planter with internal drainage tray, finished in matte unglazed natural off-white glaze.',
    features: ['Built-in drainage saucer', 'Hand-thrown terracotta clay', 'Frost and weather proof'],
    basePrice: 4900,
    salePrice: 4500,
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['New', 'Sustainable'],
    status: 'active',
    rating: 4.9,
    numReviews: 164,
  },
  {
    _id: '670c10000000000000000006',
    name: 'Nova Accent Chair',
    nameBn: 'নোভা অ্যাকসেন্ট চেয়ার',
    slug: 'nova-accent-chair',
    sku: 'LIV-CHR-006',
    brand: 'Avela Living',
    category: 'furniture',
    description: 'Deep-seat reading lounge armchair with curved barrel backrest and solid walnut exposed dowel legs.',
    features: ['Textured boucle fabric', 'Solid walnut legs', 'High resilience molded foam'],
    basePrice: 32000,
    salePrice: 29900,
    stock: 7,
    images: [
      'https://images.unsplash.com/photo-1580481077195-c328ad4f4f74?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['Best Seller'],
    status: 'active',
    rating: 4.9,
    numReviews: 342,
  },
  {
    _id: '670c10000000000000000007',
    name: 'Sol Wooden Cabinet',
    nameBn: 'সল সলিড উডেন ক্যাবিনেট',
    slug: 'sol-wooden-cabinet',
    sku: 'LIV-CAB-007',
    brand: 'Livora Artisan',
    category: 'storage',
    description: '2-door credenza with vertical fluted tambour wooden door panels and brushed brass minimal pulls.',
    features: ['Vertical fluted front', 'Soft close European hinges', 'Adjustable internal shelving'],
    basePrice: 28000,
    salePrice: 24900,
    stock: 4,
    images: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['Best Seller'],
    status: 'active',
    rating: 4.8,
    numReviews: 287,
  },
  {
    _id: '670c10000000000000000008',
    name: 'Eden Rug',
    nameBn: 'ইডেন জুট ও উল কার্পেট',
    slug: 'eden-rug',
    sku: 'LIV-RUG-008',
    brand: 'Nordic Calm',
    category: 'rugs',
    description: 'Circular hand-braided rug crafted from 100% natural organic golden jute and unbleached New Zealand wool.',
    features: ['Natural jute & wool blend', 'Hand-woven by master weavers', 'Naturally dirt-repellent'],
    basePrice: 19900,
    salePrice: 17900,
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['Best Seller'],
    status: 'active',
    rating: 4.9,
    numReviews: 199,
  },
  {
    _id: '670c10000000000000000009',
    name: 'Astra Floor Lamp',
    nameBn: 'অ্যাস্ট্রা ফ্লোর বাতি',
    slug: 'astra-floor-lamp',
    sku: 'LIV-LMP-009',
    brand: 'Nordic Calm',
    category: 'lighting',
    description: 'Slender architectural floor reading lamp with solid travertine marble weighted cylinder base and warm linen shade.',
    features: ['Solid travertine stone base', 'Brushed antique brass rod', 'Step foot-switch'],
    basePrice: 14500,
    salePrice: 12900,
    stock: 9,
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['Best Seller'],
    status: 'active',
    rating: 4.8,
    numReviews: 276,
  },
  {
    _id: '670c10000000000000000010',
    name: 'Mira Wall Art',
    nameBn: 'মিরা ক্যানভাস আর্ট ফ্রেম',
    slug: 'mira-wall-art',
    sku: 'LIV-ART-010',
    brand: 'Serene Home',
    category: 'home-decor',
    description: 'Botanical minimal geometric art print mounted in gallery-grade solid oak floating frame.',
    features: ['Archival cotton canvas print', 'UV protective non-reflective glass', 'Solid oak frame'],
    basePrice: 11000,
    salePrice: 9900,
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['Best Seller'],
    status: 'active',
    rating: 4.8,
    numReviews: 188,
  },
  {
    _id: '670c10000000000000000011',
    name: 'Ceramic Vase',
    nameBn: 'সিরামিক ফুলদানি',
    slug: 'ceramic-vase',
    sku: 'LIV-DEC-011',
    brand: 'Serene Home',
    category: 'home-decor',
    description: 'Earthy textured ceramic decorative vase with organic pinched handles. Perfect for dried pampas or fresh stems.',
    features: ['Waterproof interior', 'Hand-textured surface', 'Tactile stone-like feel'],
    basePrice: 5500,
    salePrice: 4900,
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'active',
    rating: 4.9,
    numReviews: 84,
  },
  {
    _id: '670c10000000000000000012',
    name: 'Knitted Throw Blanket',
    nameBn: 'নিটেড থ্রো কম্বল',
    slug: 'knitted-throw-blanket',
    sku: 'LIV-THW-012',
    brand: 'Avela Living',
    category: 'bedding',
    description: 'Chunky waffle-knit throw blanket made from 100% certified organic long-staple cotton.',
    features: ['Pre-washed for cloud-like softness', 'Breathable knit pattern', 'Machine washable'],
    basePrice: 7900,
    salePrice: 6900,
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'active',
    rating: 4.8,
    numReviews: 142,
  },
  {
    _id: '670c10000000000000000013',
    name: 'Scented Candle - Cedar & Amber',
    nameBn: 'সিডার ও অ্যাম্বার মোমবাতি',
    slug: 'scented-candle',
    sku: 'LIV-CND-013',
    brand: 'Nordic Calm',
    category: 'home-decor',
    description: '100% pure soy wax candle infused with natural essential oils of Himalayan cedarwood, smoked amber and bergamot.',
    features: ['55 hours clean burn time', 'Wooden crackling wick', 'Hand-poured ceramic jar reusable as cup'],
    basePrice: 3200,
    salePrice: 2900,
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'active',
    rating: 4.9,
    numReviews: 95,
  },
  {
    _id: '670c10000000000000000014',
    name: 'Decorative Cushions (Set of 2)',
    nameBn: 'কুশন সেট (২টি)',
    slug: 'decorative-cushions',
    sku: 'LIV-CSH-014',
    brand: 'Avela Living',
    category: 'home-decor',
    description: 'Pair of textured olive green and warm sand linen cushion covers with feather-down inserts.',
    features: ['Concealed YKK zippers', 'Fluffy duck-down insert included', 'Heavyweight rustic linen weave'],
    basePrice: 4500,
    salePrice: 3900,
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'active',
    rating: 4.7,
    numReviews: 61,
  },
  {
    _id: '670c10000000000000000015',
    name: 'Think and Grow Rich (মোটিভেশনাল বই - বাংলা সংস্করণ)',
    nameBn: 'থিঙ্ক অ্যান্ড গ্রো রিচ (মোটিভেশনাল বই)',
    slug: 'think-and-grow-rich-bangla',
    sku: 'NOV-BOK-015',
    brand: 'Livora Publications',
    category: 'books',
    description: 'নেপোলিয়ন হিলের জগদ্বিখ্যাত অনুপ্রেরণামূলক ক্লাসিক বইটির প্রমিত বাংলা অনুবাদ। আর্থিক সচ্ছলতা ও মানসিক শক্তির অন্যতম সেরা মোটিভেশনাল বই।',
    features: ['হার্ডকভার প্রিমিয়াম সংস্করণ', 'উন্নত মানের ৮০ জিএসএম ক্রিম পেপার', 'প্রমিত প্রাঞ্জল অনুবাদ'],
    basePrice: 850,
    salePrice: 650,
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ],
    badges: ['Best Seller'],
    status: 'active',
    rating: 5.0,
    numReviews: 48,
  },
];

export async function seedDatabaseIfEmpty() {
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('📦 [DATABASE SEED] Automatic demo data seeding is disabled in production.');
      return;
    }

    const productCount = await ProductModel.countDocuments();
    if (productCount > 0) {
      console.log('📦 [DATABASE SEED] Existing catalog found. Skipping initial seeding.');
      return;
    }

    console.log('🌱 [DATABASE SEED] Seeding initial NOVARA / LIVORA catalog data to MongoDB Atlas...');

    // 1. Seed Brands
    await BrandModel.insertMany(SEED_BRANDS.map(({ _id, ...b }) => b));

    // 2. Seed Categories
    await CategoryModel.insertMany(SEED_CATEGORIES.map(({ _id, ...c }) => c));

    // 3. Seed Products directly matching Reference Image
    await ProductModel.insertMany(SEED_PRODUCTS.map(({ _id, ...p }) => p));

    // 4. Seed Coupons
    await CouponModel.insertMany([
      {
        code: 'NOVARA10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 2000,
        validTo: new Date('2027-12-31'),
        usageLimit: 1000,
        isActive: true,
      },
      {
        code: 'LIVORA500',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 5000,
        validTo: new Date('2027-12-31'),
        usageLimit: 500,
        isActive: true,
      },
    ]);

    // 6. Seed CMS
    await CMSModel.create(SEED_CMS);

    console.log('✅ [DATABASE SEED] Initial data seeded successfully.');
  } catch (e: any) {
    console.error('Seed error:', e.message);
  }
}

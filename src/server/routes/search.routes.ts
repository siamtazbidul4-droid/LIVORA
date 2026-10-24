import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { isDbConnected } from '../config/db';
import { SEED_PRODUCTS } from '../seed/seedData';

const router = Router();

// Bilingual synonym & transliteration dictionary for English <-> Bangla discovery
const BANGLA_SYNONYMS: Record<string, string[]> = {
  'বই': ['book', 'publications', 'rich', 'motivational', 'বই'],
  'মোটিভেশনাল': ['motivational', 'inspire', 'mind', 'book', 'rich'],
  'মোটিভেশনাল বই': ['motivational', 'book', 'think and grow rich', 'publications'],
  'সোফা': ['sofa', 'seating', 'avela', 'couch'],
  'চেয়ার': ['chair', 'accent', 'seating', 'nova'],
  'টেবিল': ['table', 'dining', 'lume', 'desk'],
  'বেড': ['bed', 'wooden', 'noor', 'mattress'],
  'বিছানা': ['bed', 'bedding', 'linens'],
  'বাতি': ['lamp', 'lighting', 'light', 'orbi', 'astra'],
  'ল্যাম্প': ['lamp', 'lighting'],
  'আলো': ['lighting', 'lamp'],
  'ক্যাবিনেট': ['cabinet', 'storage', 'sol', 'credenza'],
  'আলমারি': ['cabinet', 'storage'],
  'কার্পেট': ['rug', 'rugs', 'carpet', 'eden'],
  'শতরঞ্জি': ['rug', 'jute'],
  'ফুলদানি': ['vase', 'ceramic', 'decor'],
  'প্ল্যান্টার': ['planter', 'plant', 'serene', 'pot'],
  'টব': ['planter', 'plant'],
  'মোমবাতি': ['candle', 'scented'],
  'কুশন': ['cushion', 'cushions', 'pillow'],
  'কম্বল': ['blanket', 'throw', 'knitted'],
  'চাদর': ['bedding', 'linen', 'sheet'],
  'আসবাবপত্র': ['furniture', 'wood', 'teak'],
  'গৃহসজ্জা': ['decor', 'art', 'wall'],
};

// Expand search keywords across language boundaries
function expandSearchTerms(term: string): string[] {
  const normalized = term.trim().toLowerCase();
  const tokens = normalized.split(/\s+/);
  const searchSet = new Set<string>([normalized, ...tokens]);

  // Check exact phrase matches in synonym dictionary
  if (BANGLA_SYNONYMS[normalized]) {
    BANGLA_SYNONYMS[normalized].forEach((s) => searchSet.add(s));
  }

  // Check token level matches
  tokens.forEach((token) => {
    if (BANGLA_SYNONYMS[token]) {
      BANGLA_SYNONYMS[token].forEach((s) => searchSet.add(s));
    }
  });

  return Array.from(searchSet);
}

// 1. Autocomplete Suggestions Endpoint (Bounded dropdown with thumbnail, name, price)
router.get('/suggest', async (req: Request, res: Response): Promise<any> => {
  try {
    const q = (req.query.q as string || '').trim();
    const limit = Math.min(8, Number(req.query.limit) || 8);

    if (!q || q.length < 2) {
      return res.json({ products: [] });
    }

    const terms = expandSearchTerms(q);

    if (!isDbConnected()) {
      const matched = SEED_PRODUCTS.filter((p) => {
        return terms.some((t) => {
          const rx = new RegExp(t, 'i');
          return rx.test(p.name) || rx.test(p.nameBn || '') || rx.test(p.category) || rx.test(p.sku);
        });
      }).slice(0, limit);
      return res.json({ products: matched });
    }

    const orConditions = terms.map((term) => ({
      $or: [
        { name: new RegExp(term, 'i') },
        { nameBn: new RegExp(term, 'i') },
        { category: new RegExp(term, 'i') },
        { brand: new RegExp(term, 'i') },
        { sku: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') },
      ],
    }));

    const products = await ProductModel.find({
      status: 'active',
      $or: orConditions.flatMap((c) => c.$or),
    })
      .select('name nameBn slug sku basePrice salePrice images rating numReviews brand')
      .limit(limit);

    return res.json({ products });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error executing search suggest' });
  }
});

// 2. Full Search Query Endpoint
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const q = (req.query.q as string || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(24, Number(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    if (!q) {
      const products = await ProductModel.find({ status: 'active' }).skip(skip).limit(limit);
      const total = await ProductModel.countDocuments({ status: 'active' });
      return res.json({ products, total, page, pages: Math.ceil(total / limit) });
    }

    const terms = expandSearchTerms(q);
    const orConditions = terms.map((term) => ({
      $or: [
        { name: new RegExp(term, 'i') },
        { nameBn: new RegExp(term, 'i') },
        { category: new RegExp(term, 'i') },
        { brand: new RegExp(term, 'i') },
        { sku: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') },
      ],
    }));

    const query = {
      status: 'active',
      $or: orConditions.flatMap((c) => c.$or),
    };

    const [products, total] = await Promise.all([
      ProductModel.find(query).skip(skip).limit(limit),
      ProductModel.countDocuments(query),
    ]);

    return res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
      matchedTerms: terms,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error performing full search' });
  }
});

export default router;

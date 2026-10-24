import { Router, Request, Response } from 'express';
import { InteractionModel, InteractionEventType } from '../models/Interaction';
import { ProductModel } from '../models/Product';
import { isDbConnected } from '../config/db';
import { SEED_PRODUCTS } from '../seed/seedData';
import { AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();

// In-memory buffer for interaction events when database is pending Atlas connection
const IN_MEMORY_INTERACTIONS: Array<{
  userId?: string;
  sessionId: string;
  productId: string;
  productName: string;
  category: string;
  brand?: string;
  eventType: InteractionEventType;
  source?: string;
  timestamp: Date;
}> = [];

// Base interaction weights as defined in Phase 7.2
const EVENT_WEIGHTS: Record<InteractionEventType, number> = {
  detail_view: 1,
  click: 2,
  search_click: 3,
  wishlist_add: 4,
  add_to_cart: 5,
  review: 4,
  purchase: 8,
  impression: 0.5,
};

// 1. Track User Interaction Event
router.post('/track', optionalAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { productId, productName, category, brand, eventType, sessionId, source } = req.body;
    const userId = req.user?._id;

    if (!productId || !eventType || (!userId && !sessionId)) {
      return res.status(400).json({ error: 'productId, eventType, and user/session identifier required.' });
    }

    const now = new Date();

    // Deduplication window: within 30 seconds for the same product and event type
    const thirtySecondsAgo = new Date(now.getTime() - 30000);

    if (isDbConnected()) {
      const recent = await InteractionModel.findOne({
        productId,
        eventType,
        $or: [{ userId }, { sessionId }],
        timestamp: { $gte: thirtySecondsAgo },
      });

      if (!recent) {
        await InteractionModel.create({
          userId,
          sessionId: sessionId || 'anon',
          productId,
          productName: productName || 'Product',
          category: category || 'general',
          brand,
          eventType,
          source: source || 'browse',
          timestamp: now,
        });
      }
    } else {
      const isDuplicate = IN_MEMORY_INTERACTIONS.some(
        (i) =>
          i.productId === productId &&
          i.eventType === eventType &&
          ((userId && i.userId === userId.toString()) || i.sessionId === sessionId) &&
          now.getTime() - i.timestamp.getTime() < 30000
      );

      if (!isDuplicate) {
        IN_MEMORY_INTERACTIONS.unshift({
          userId: userId?.toString(),
          sessionId: sessionId || 'anon',
          productId,
          productName: productName || 'Product',
          category: category || 'general',
          brand,
          eventType,
          source: source || 'browse',
          timestamp: now,
        });
      }
    }

    return res.status(202).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error tracking interaction' });
  }
});

// 2. Personalized Product Recommendations
router.get('/personalized', optionalAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?._id?.toString();
    const sessionId = (req.query.sessionId as string) || '';
    const limit = Math.min(20, Math.max(4, Number(req.query.limit) || 8));

    // Get all candidate active products
    let catalog: any[] = [];
    if (isDbConnected()) {
      catalog = await ProductModel.find({ status: 'active', stock: { $gt: 0 } });
    } else {
      catalog = SEED_PRODUCTS.filter((p) => p.status === 'active' && p.stock > 0);
    }

    if (catalog.length === 0) {
      return res.json({ products: [], mode: 'empty_catalog' });
    }

    // Retrieve interaction events for this user/session
    let events: any[] = [];
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30-day window

    if (isDbConnected()) {
      const orClauses: any[] = [];
      if (userId) orClauses.push({ userId });
      if (sessionId) orClauses.push({ sessionId });

      if (orClauses.length > 0) {
        events = await InteractionModel.find({
          $or: orClauses,
          timestamp: { $gte: cutoffDate },
        }).sort({ timestamp: -1 });
      }
    } else {
      events = IN_MEMORY_INTERACTIONS.filter((i) => {
        const matchesUser = (userId && i.userId === userId) || (sessionId && i.sessionId === sessionId);
        return matchesUser && i.timestamp >= cutoffDate;
      });
    }

    // Check Cold Start
    if (events.length === 0) {
      // Diverse cold start: select top rated items ensuring category diversity
      const categoryMap = new Map<string, any[]>();
      catalog.forEach((p) => {
        if (!categoryMap.has(p.category)) categoryMap.set(p.category, []);
        categoryMap.get(p.category)!.push(p);
      });

      const coldStartPicks: any[] = [];
      const categories = Array.from(categoryMap.keys());
      let catIndex = 0;

      while (coldStartPicks.length < limit && categoryMap.size > 0) {
        const cat = categories[catIndex % categories.length];
        const items = categoryMap.get(cat);
        if (items && items.length > 0) {
          // Sort items in this category by rating/popularity
          items.sort((a, b) => b.rating * b.numReviews - a.rating * a.numReviews);
          coldStartPicks.push(items.shift());
        }
        catIndex++;
        if (categories.every((c) => (categoryMap.get(c)?.length || 0) === 0)) break;
      }

      return res.json({
        products: coldStartPicks.slice(0, limit),
        mode: 'cold_start_diverse',
        interactionCount: 0,
      });
    }

    // Calculate Category & Brand Affinity with Time Decay (Half-life = 7 days)
    const categoryScores: Record<string, number> = {};
    const brandScores: Record<string, number> = {};
    const productInteractions: Record<string, number> = {};
    const purchasedProductIds = new Set<string>();

    const nowMs = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    events.forEach((evt) => {
      const baseWeight = EVENT_WEIGHTS[evt.eventType as InteractionEventType] || 1;
      const ageMs = Math.max(0, nowMs - new Date(evt.timestamp).getTime());
      const decay = Math.pow(0.5, ageMs / SEVEN_DAYS_MS); // exponential time decay
      const finalWeight = baseWeight * decay;

      // Category affinity
      if (evt.category) {
        categoryScores[evt.category] = (categoryScores[evt.category] || 0) + finalWeight;
      }
      // Brand affinity
      if (evt.brand) {
        brandScores[evt.brand] = (brandScores[evt.brand] || 0) + finalWeight;
      }
      // Direct product interaction
      const pId = evt.productId?.toString();
      if (pId) {
        productInteractions[pId] = (productInteractions[pId] || 0) + finalWeight;
      }
      if (evt.eventType === 'purchase') {
        purchasedProductIds.add(pId);
      }
    });

    // Score all catalog products
    const scoredProducts = catalog.map((product) => {
      const pId = product._id?.toString();
      const catScore = categoryScores[product.category] || 0;
      const bScore = brandScores[product.brand] || 0;
      const directScore = productInteractions[pId] || 0;
      const isPurchased = purchasedProductIds.has(pId);

      // Score formula
      const score =
        catScore * 3.0 +
        bScore * 2.0 +
        directScore * 2.5 +
        product.rating * 0.8 +
        (product.numReviews > 10 ? 1.0 : 0.2) -
        (isPurchased ? 6.0 : 0); // Repetition penalty for already purchased item

      return { product, score };
    });

    // Sort descending by score
    scoredProducts.sort((a, b) => b.score - a.score);

    // Apply Category Diversity Policy (Phase 7.4):
    // Max 50% concentration from any single dominant category
    const maxPerCategory = Math.max(2, Math.floor(limit * 0.5));
    const categoryCounts: Record<string, number> = {};
    const diverseResults: any[] = [];
    const deferredList: any[] = [];

    for (const item of scoredProducts) {
      const cat = item.product.category;
      const currentCount = categoryCounts[cat] || 0;

      if (currentCount < maxPerCategory) {
        diverseResults.push(item.product);
        categoryCounts[cat] = currentCount + 1;
      } else {
        deferredList.push(item.product);
      }

      if (diverseResults.length >= limit) break;
    }

    // Fill remaining slots if needed
    if (diverseResults.length < limit && deferredList.length > 0) {
      for (const item of deferredList) {
        if (!diverseResults.some((p) => p._id.toString() === item._id.toString())) {
          diverseResults.push(item);
        }
        if (diverseResults.length >= limit) break;
      }
    }

    return res.json({
      products: diverseResults.slice(0, limit),
      mode: 'personalized_scored',
      interactionCount: events.length,
      topCategories: Object.entries(categoryScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error generating recommendations' });
  }
});

// 3. Similar Products (Content-Based)
router.get('/similar/:productId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId } = req.params;
    const limit = Math.min(10, Math.max(2, Number(req.query.limit) || 4));

    let target: any = null;
    let catalog: any[] = [];

    if (isDbConnected()) {
      target = await ProductModel.findById(productId);
      if (target) {
        catalog = await ProductModel.find({
          _id: { $ne: target._id },
          category: target.category,
          status: 'active',
        }).limit(limit);
      }
    } else {
      target = SEED_PRODUCTS.find((p) => p._id === productId || p.slug === productId);
      if (target) {
        catalog = SEED_PRODUCTS.filter((p) => p._id !== target._id && p.category === target.category && p.status === 'active').slice(0, limit);
      }
    }

    return res.json({ products: catalog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching similar products' });
  }
});

export default router;

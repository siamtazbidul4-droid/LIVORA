import { Router, Request, Response } from 'express';
import { CartModel, ICartItem } from '../models/Cart';
import { ProductModel } from '../models/Product';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isDbConnected } from '../config/db';
import { SEED_PRODUCTS } from '../seed/seedData';
import { resolveProductReference } from './order.routes';

const router = Router();

// 1. Sync guest cart items with server persistent cart upon login or cart change
router.post('/sync', optionalAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const userId = (req as any).user?._id?.toString();

    // Validate and sanitize each item against trusted catalog data
    const validatedItems: ICartItem[] = [];

    for (const item of items) {
      if (!item.productId) continue;

      const product = await resolveProductReference(item.productId);
      if (!product) continue;

      // Determine real price and stock from backend source of truth
      let itemPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.basePrice;
      let maxStock = product.stock || 99;

      if (item.variantSku && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v: any) => v.sku === item.variantSku);
        if (variant) {
          if (variant.price) itemPrice = variant.price;
          if (variant.stock !== undefined) maxStock = variant.stock;
        }
      }

      const safeQuantity = Math.max(1, Math.min(Number(item.quantity) || 1, maxStock));

      validatedItems.push({
        productId: product._id.toString(),
        variantSku: item.variantSku || '',
        name: product.name,
        price: itemPrice,
        originalPrice: product.salePrice ? product.basePrice : undefined,
        image: (product.images && product.images[0]) || item.image || '',
        quantity: safeQuantity,
        selectedOptions: item.selectedOptions || {},
        maxStock,
      });
    }

    // If authenticated user, persist to MongoDB
    if (userId && isDbConnected()) {
      let userCart = await CartModel.findOne({ userId });
      if (!userCart) {
        userCart = new CartModel({ userId, items: validatedItems });
      } else {
        // Merge strategy: update quantities of existing items, append new ones
        const mergedMap = new Map<string, ICartItem>();
        for (const existing of userCart.items) {
          const key = `${existing.productId}_${existing.variantSku || ''}`;
          mergedMap.set(key, existing);
        }
        for (const incoming of validatedItems) {
          const key = `${incoming.productId}_${incoming.variantSku || ''}`;
          if (mergedMap.has(key)) {
            const current = mergedMap.get(key)!;
            current.quantity = Math.min(current.quantity + incoming.quantity, incoming.maxStock);
          } else {
            mergedMap.set(key, incoming);
          }
        }
        userCart.items = Array.from(mergedMap.values());
      }
      await userCart.save();
      return res.json({
        message: 'Cart synchronized with database',
        items: userCart.items,
        uniqueCount: userCart.items.length,
      });
    }

    return res.json({
      message: 'Cart validated successfully',
      items: validatedItems,
      uniqueCount: validatedItems.length,
    });
  } catch (error: any) {
    console.error('Cart sync error:', error);
    return res.status(500).json({ error: error.message || 'Error synchronizing cart' });
  }
});

// 2. Fetch authenticated customer's persistent cart
router.get('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user._id.toString();

    if (!isDbConnected()) {
      return res.json({ items: [], uniqueCount: 0 });
    }

    const cart = await CartModel.findOne({ userId });
    return res.json({
      items: cart ? cart.items : [],
      uniqueCount: cart ? cart.items.length : 0,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error fetching cart' });
  }
});

// 3. Clear user's persistent cart
router.delete('/clear', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user._id.toString();
    if (isDbConnected()) {
      await CartModel.deleteOne({ userId });
    }
    return res.json({ message: 'Cart cleared successfully', items: [], uniqueCount: 0 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error clearing cart' });
  }
});

export default router;

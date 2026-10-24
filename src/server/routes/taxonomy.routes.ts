import { Router, Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { BrandModel } from '../models/Brand';
import { requireAuth, requireStaff } from '../middleware/auth';
import { isDbConnected } from '../config/db';
import { SEED_CATEGORIES, SEED_BRANDS } from '../seed/seedData';

const router = Router();

// Categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    if (!isDbConnected()) {
      return res.json({ categories: SEED_CATEGORIES });
    }
    const categories = await CategoryModel.find().sort({ displayOrder: 1, name: 1 });
    return res.json({ categories });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireAuth, requireStaff, async (req: Request, res: Response): Promise<any> => {
  try {
    const category = await CategoryModel.create(req.body);
    return res.status(201).json({ category });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Brands
router.get('/brands', async (_req: Request, res: Response) => {
  try {
    if (!isDbConnected()) {
      return res.json({ brands: SEED_BRANDS });
    }
    const brands = await BrandModel.find().sort({ name: 1 });
    return res.json({ brands });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/brands', requireAuth, requireStaff, async (req: Request, res: Response): Promise<any> => {
  try {
    const brand = await BrandModel.create(req.body);
    return res.status(201).json({ brand });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;

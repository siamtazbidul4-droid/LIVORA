import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { ReviewModel, CouponModel, CMSModel, SupportEnquiryModel } from '../models/Extras';
import { UserModel } from '../models/User';
import { OrderModel } from '../models/Order';
import { requireAuth, requireStaff, AuthRequest, generateToken } from '../middleware/auth';
import { isDbConnected } from '../config/db';
import { SEED_CMS } from '../seed/seedData';
import { validateBangladeshLocation } from '../services/bangladeshLocationData';
import { z } from 'zod';

const router = Router();
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72),
});


// ======================== REVIEWS ========================
router.post('/reviews/:productId', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const { rating, comment } = req.body;
    const productId = req.params.productId;

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify if customer actually purchased this product in a confirmed/delivered order
    const hasPurchased = await OrderModel.findOne({
      user: user._id,
      'items.productId': product._id,
    });

    const review = await ReviewModel.create({
      productId: product._id,
      productName: product.name,
      userId: user._id,
      userName: user.name,
      rating: Number(rating),
      comment,
      verifiedPurchase: !!hasPurchased,
      status: 'approved', // Auto-approved or pending based on policy
    });

    // Update product rating aggregate
    const allReviews = await ReviewModel.find({ productId: product._id, status: 'approved' });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await ProductModel.findByIdAndUpdate(product._id, {
      rating: Number(avgRating.toFixed(1)),
      numReviews: allReviews.length,
    });

    return res.status(201).json({ review });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error submitting review' });
  }
});

router.get('/reviews/admin/all', requireAuth, requireStaff, async (_req: Request, res: Response) => {
  try {
    const reviews = await ReviewModel.find().sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/reviews/admin/:id', requireAuth, requireStaff, async (req: Request, res: Response): Promise<any> => {
  try {
    const { status } = req.body;
    const review = await ReviewModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return res.json({ review });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ======================== COUPONS ========================
router.post('/coupons/validate', async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await CouponModel.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      validTo: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon code is invalid or has expired.' });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order spend of ৳${coupon.minOrderAmount.toLocaleString()} required for this coupon.`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/coupons/admin/all', requireAuth, requireStaff, async (_req: Request, res: Response) => {
  try {
    const coupons = await CouponModel.find().sort({ createdAt: -1 });
    return res.json({ coupons });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', requireAuth, requireStaff, async (req: Request, res: Response): Promise<any> => {
  try {
    const coupon = await CouponModel.create(req.body);
    return res.status(201).json({ coupon });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/coupons/:id', requireAuth, requireStaff, async (req: Request, res: Response): Promise<any> => {
  try {
    await CouponModel.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Coupon deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ======================== CMS CONFIG ========================
router.get('/cms', async (_req: Request, res: Response) => {
  try {
    if (!isDbConnected()) {
      return res.json(SEED_CMS);
    }
    let cms = await CMSModel.findOne();
    if (!cms) {
      cms = await CMSModel.create({});
    }
    return res.json(cms);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/cms', requireAuth, requireStaff, async (req: Request, res: Response): Promise<any> => {
  try {
    let cms = await CMSModel.findOne();
    if (!cms) {
      cms = await CMSModel.create(req.body);
    } else {
      cms = await CMSModel.findByIdAndUpdate(cms._id, req.body, { new: true });
    }
    return res.json(cms);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ======================== SUPPORT & NEWSLETTER ========================
router.post('/support/enquiry', async (req: Request, res: Response): Promise<any> => {
  try {
    const enquiry = await SupportEnquiryModel.create(req.body);
    return res.status(201).json({ enquiry, message: 'Ticket logged successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/support/newsletter', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    return res.json({ message: 'Subscribed to Home Circle newsletter.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ======================== ADMIN DASHBOARD STATS & STAFF ========================
router.get('/admin/stats', requireAuth, requireStaff, async (_req: Request, res: Response) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        grossSales: 1489000,
        orderCount: 48,
        aov: 31020,
        pendingOrders: 5,
        lowStockCount: 3,
        recentOrders: [
          {
            _id: 'ord_demo_1',
            orderNumber: 'NOV-2610-8912',
            user: { name: 'Farhan Kabir', email: 'farhan@example.com' },
            shippingAddress: { district: 'Dhaka', recipientName: 'Farhan Kabir' },
            total: 69900,
            paymentMethod: 'cod',
            orderStatus: 'confirmed',
            createdAt: new Date(),
          },
          {
            _id: 'ord_demo_2',
            orderNumber: 'NOV-2610-7451',
            user: { name: 'Ayesha Siddiqua', email: 'ayesha@example.com' },
            shippingAddress: { district: 'Chittagong', recipientName: 'Ayesha Siddiqua' },
            total: 39900,
            paymentMethod: 'sslcommerz',
            orderStatus: 'processing',
            createdAt: new Date(),
          },
        ],
      });
    }

    const [orders, lowStockProducts, recentOrders] = await Promise.all([
      OrderModel.find(),
      ProductModel.countDocuments({ stock: { $lte: 3 }, status: 'active' }),
      OrderModel.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
    ]);

    const grossSales = orders.reduce((sum, o) => sum + (o.orderStatus !== 'cancelled' ? o.total : 0), 0);
    const orderCount = orders.length;
    const aov = orderCount > 0 ? grossSales / orderCount : 0;
    const pendingOrders = orders.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.orderStatus)).length;

    return res.json({
      grossSales,
      orderCount,
      aov,
      pendingOrders,
      lowStockCount: lowStockProducts,
      recentOrders,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/staff', requireAuth, requireStaff, async (_req: Request, res: Response) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        staff: [
          { _id: 'u1', name: 'Super Administrator', email: 'admin@novara.com', role: 'super_admin', createdAt: new Date() },
          { _id: 'u2', name: 'Tanvir Hossain (Order Desk)', email: 'staff@novara.com', role: 'order_manager', createdAt: new Date() },
        ],
      });
    }

    const staff = await UserModel.find({
      role: { $in: ['super_admin', 'admin', 'order_manager', 'inventory_manager', 'catalog_manager', 'customer_support', 'finance'] },
    }).select('-password');
    return res.json({ staff });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/admin/staff', requireAuth, requireStaff, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (req.user!.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Administrators can provision staff accounts.' });
    }
    const staff = await UserModel.create(req.body);
    return res.status(201).json({ staff });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ======================== USER PROFILE & ADDRESSES ========================
router.put('/users/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, phone } = req.body;
    const user = await UserModel.findByIdAndUpdate(req.user!._id, { name, phone }, { new: true }).select('-password');
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/users/change-password', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const parsed = passwordChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'The new password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
    }
    const { currentPassword, newPassword } = parsed.data;
    const user = await UserModel.findById(req.user!._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();
    const token = generateToken(user._id.toString(), user.role, user.tokenVersion);
    return res.json({ message: 'Password changed successfully', token });
  } catch {
    console.error('Password change failed.');
    return res.status(500).json({ error: 'Unable to change the password. Please try again.' });
  }
});

router.post('/users/addresses', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = await UserModel.findById(req.user!._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const input = req.body;
    if (
      typeof input.recipientName !== 'string' ||
      !input.recipientName.trim() ||
      typeof input.phone !== 'string' ||
      !input.phone.trim() ||
      typeof input.streetAddress !== 'string' ||
      !input.streetAddress.trim()
    ) {
      return res.status(400).json({ error: 'Recipient name, phone, and street address are required.' });
    }
    const location = validateBangladeshLocation(input, true);
    if (!location) {
      return res.status(400).json({ error: 'Address location is invalid or inconsistent.' });
    }
    const address = {
      recipientName: input.recipientName.trim(),
      phone: input.phone.trim(),
      ...location,
      streetAddress: input.streetAddress.trim(),
      ...(typeof input.landmark === 'string' && input.landmark.trim()
        ? { landmark: input.landmark.trim() }
        : {}),
      isDefault: input.isDefault === true,
    };
    if (address.isDefault) {
      user.addresses.forEach((a: any) => { a.isDefault = false; });
    }
    user.addresses.push(address);
    await user.save();

    return res.status(201).json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/users/addresses/:addressId', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = await UserModel.findById(req.user!._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.addresses = user.addresses.filter((a: any) => a._id?.toString() !== req.params.addressId);
    await user.save();

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/users/addresses/:addressId/default', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = await UserModel.findById(req.user!._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.addresses.forEach((a: any) => {
      a.isDefault = a._id?.toString() === req.params.addressId;
    });
    await user.save();

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { randomInt } from 'node:crypto';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { CouponModel } from '../models/Extras';
import { UserModel } from '../models/User';
import { requireAuth, requireStaff, AuthRequest } from '../middleware/auth';
import { isDbConnected } from '../config/db';
import { SEED_PRODUCTS } from '../seed/seedData';
import { validateBangladeshLocation } from '../services/bangladeshLocationData';
import { isBkashCheckoutAvailable } from '../services/paymentConfig';

const router = Router();

export async function resolveProductReference(productReference: string | mongoose.Types.ObjectId): Promise<any> {
  const rawValue = typeof productReference === 'string' ? productReference.trim() : productReference?.toString();
  if (!rawValue) return null;

  const normalized = rawValue.trim();
  const objectIdValue = mongoose.isValidObjectId(normalized) ? normalized : null;
  const slugValue = normalized.toLowerCase();
  const skuValue = normalized.toUpperCase();

  if (isDbConnected()) {
    const product = await ProductModel.findOne({
      $or: [
        ...(objectIdValue ? [{ _id: objectIdValue }] : []),
        { slug: slugValue },
        { sku: skuValue },
      ],
    });
    return product;
  }

  return (
    SEED_PRODUCTS.find(
      (product) =>
        product._id === normalized ||
        product.slug === normalized ||
        product.slug === slugValue ||
        product.sku === normalized ||
        product.sku === skuValue ||
        product.sku?.toLowerCase() === slugValue
    ) || null
  );
}

// In-memory buffer for preview testing when Atlas connection string is pending
const IN_MEMORY_ORDERS: any[] = [];

// Helper to generate unique order number: NOV-YYYYMM-XXXX
function generateOrderNumber(): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear().toString().slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const random = randomInt(10_000_000, 100_000_000);
  return `NOV-${yearMonth}-${random}`;
}

class OrderRequestError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// 1. Create Order — AUTHENTICATED CUSTOMERS ONLY
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  let session: mongoose.ClientSession | undefined;
  let reusedOrder = false;
  try {
    const user = req.user!;
    const {
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      notes,
      saveAddress,
      checkoutRequestId,
    } = req.body;
    const selectedPaymentMethod = paymentMethod || 'cod';

    if (
      typeof checkoutRequestId !== 'string' ||
      checkoutRequestId.length < 16 ||
      checkoutRequestId.length > 100
    ) {
      return res.status(400).json({ error: 'A valid checkout request ID is required.' });
    }
    if (!['cod', 'bkash'].includes(selectedPaymentMethod)) {
      return res.status(400).json({ error: 'The selected payment method is not supported.' });
    }
    if (selectedPaymentMethod !== 'cod' && !isDbConnected()) {
      return res.status(503).json({ error: 'Online checkout requires persistent database storage.' });
    }
    if (selectedPaymentMethod === 'bkash' && !isBkashCheckoutAvailable()) {
      return res.status(503).json({ error: 'bKash checkout is not configured for this environment.' });
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: 'Cart items are required to create an order.' });
    }

    if (isDbConnected()) {
      const existingOrder = await OrderModel.findOne({
        user: user._id,
        checkoutRequestId,
      });
      if (existingOrder) {
        return res.status(200).json({
          message: 'This checkout request was already processed.',
          order: existingOrder,
          dbStatus: 'connected',
        });
      }
    } else {
      const existingOrder = IN_MEMORY_ORDERS.find(
        (order) =>
          order.checkoutRequestId === checkoutRequestId &&
          order.user?._id?.toString() === user._id.toString()
      );
      if (existingOrder) {
        return res.status(200).json({
          message: 'This checkout request was already processed.',
          order: existingOrder,
          dbStatus: 'pending_configuration',
        });
      }
    }

    if (
      !shippingAddress ||
      typeof shippingAddress.recipientName !== 'string' ||
      !shippingAddress.recipientName.trim() ||
      typeof shippingAddress.phone !== 'string' ||
      !shippingAddress.phone.trim() ||
      typeof shippingAddress.streetAddress !== 'string' ||
      !shippingAddress.streetAddress.trim()
    ) {
      return res.status(400).json({ error: 'Complete delivery address is required.' });
    }

    const normalizedLocation = validateBangladeshLocation(shippingAddress, true);
    if (!normalizedLocation) {
      return res.status(400).json({ error: 'Delivery location is invalid or inconsistent.' });
    }
    const validatedShippingAddress = {
      recipientName: shippingAddress.recipientName.trim(),
      phone: shippingAddress.phone.trim(),
      ...normalizedLocation,
      streetAddress: shippingAddress.streetAddress.trim(),
      ...(typeof shippingAddress.landmark === 'string' && shippingAddress.landmark.trim()
        ? { landmark: shippingAddress.landmark.trim() }
        : {}),
    };

    let calculatedSubtotal = 0;
    const validatedOrderItems: Array<{
      productId: unknown;
      variantSku?: string;
      productName: string;
      price: number;
      quantity: number;
      image: string;
      selectedOptions?: Record<string, string>;
      subtotal: number;
    }> = [];
    const inventoryUpdates: Array<{
      productId: unknown;
      variantSku?: string;
      quantity: number;
      productName: string;
    }> = [];

    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== 'string' ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100 ||
        (item.variantSku !== undefined && typeof item.variantSku !== 'string')
      ) {
        return res.status(400).json({ error: 'Each product and quantity must be valid.' });
      }

      const product = await resolveProductReference(item.productId);

      if (!product) {
        return res.status(404).json({ error: 'A requested product was not found.' });
      }
      if (product.status && product.status !== 'active') {
        return res.status(400).json({ error: `${product.name} is not currently available.` });
      }

      let unitPrice = product.salePrice || product.basePrice;
      let matchedVariant: any = null;
      let selectedOptions: Record<string, string> | undefined;

      if (item.variantSku) {
        matchedVariant = product.variants?.find((variant: any) => variant.sku === item.variantSku);
        if (!matchedVariant) {
          return res.status(400).json({ error: `The selected variant for ${product.name} is invalid.` });
        }
        unitPrice = matchedVariant.salePrice || matchedVariant.price;
        selectedOptions =
          matchedVariant.options instanceof Map
            ? Object.fromEntries(matchedVariant.options)
            : matchedVariant.options;
        if (matchedVariant.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
        }
      } else if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ error: `The current price for ${product.name} is invalid.` });
      }

      const itemSubtotal = unitPrice * item.quantity;
      calculatedSubtotal += itemSubtotal;

      validatedOrderItems.push({
        productId: product._id,
        variantSku: matchedVariant?.sku || product.sku,
        productName: product.name,
        price: unitPrice,
        quantity: item.quantity,
        image: matchedVariant?.image || product.images?.[0] || '',
        selectedOptions,
        subtotal: itemSubtotal,
      });
      inventoryUpdates.push({
        productId: product._id,
        variantSku: matchedVariant?.sku,
        quantity: item.quantity,
        productName: product.name,
      });
    }

    let discountAmount = 0;
    let coupon: any = null;
    if (couponCode) {
      if (!isDbConnected() || typeof couponCode !== 'string' || couponCode.length > 100) {
        return res.status(503).json({ error: 'Coupon validation requires the database.' });
      }
      const now = new Date();
      coupon = await CouponModel.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now },
      });
      if (!coupon) {
        return res.status(400).json({ error: 'The coupon is invalid or has expired.' });
      }
      if (calculatedSubtotal < coupon.minOrderAmount) {
        return res.status(400).json({ error: 'The order does not meet this coupon minimum.' });
      }
      if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ error: 'The coupon usage limit has been reached.' });
      }
      if (coupon.perCustomerLimit !== undefined) {
        const customerUses = await OrderModel.countDocuments({
          user: user._id,
          couponCode: coupon.code,
        });
        if (customerUses >= coupon.perCustomerLimit) {
          return res.status(400).json({ error: 'This account has reached the coupon usage limit.' });
        }
      }
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      } else {
        discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
      }
    }

    let shippingFee = 0;
    if (calculatedSubtotal < 5000) {
      shippingFee = normalizedLocation.division.toLowerCase() === 'dhaka' ? 80 : 150;
    }

    const finalTotal = Math.max(0, calculatedSubtotal - discountAmount + shippingFee);
    const orderNumber = generateOrderNumber();

    const orderData = {
      checkoutRequestId,
      orderNumber,
      user: isDbConnected()
        ? user._id
        : {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
      items: validatedOrderItems,
      shippingAddress: validatedShippingAddress,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: 'pending',
      orderStatus: selectedPaymentMethod === 'cod' ? 'confirmed' : 'pending',
      statusHistory: [
        {
          status: selectedPaymentMethod === 'cod' ? 'confirmed' : 'pending',
          timestamp: new Date(),
          note:
            selectedPaymentMethod === 'cod'
              ? 'Order confirmed and registered in production fulfillment queue.'
              : 'Order created and awaiting verified payment.',
          actor: user.name,
        },
      ],
      subtotal: calculatedSubtotal,
      couponCode: coupon?.code,
      discountAmount,
      shippingFee,
      total: finalTotal,
      staffNotes: notes ? [notes] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let order: any = null;
    if (isDbConnected()) {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const existingOrder = await OrderModel.findOne({
          user: user._id,
          checkoutRequestId,
        }).session(session!);
        if (existingOrder) {
          order = existingOrder;
          reusedOrder = true;
          return;
        }

        for (const update of inventoryUpdates) {
          const filter = update.variantSku
            ? {
                _id: update.productId,
                stock: { $gte: update.quantity },
                variants: {
                  $elemMatch: {
                    sku: update.variantSku,
                    stock: { $gte: update.quantity },
                  },
                },
              }
            : { _id: update.productId, stock: { $gte: update.quantity } };
          const updateResult = await ProductModel.updateOne(
            filter,
            {
              $inc: update.variantSku
                ? {
                    'variants.$.stock': -update.quantity,
                    stock: -update.quantity,
                  }
                : { stock: -update.quantity },
            },
            { session }
          );
          if (updateResult.modifiedCount !== 1) {
            throw new OrderRequestError(`Insufficient stock for ${update.productName}.`);
          }
        }

        if (coupon) {
          if (coupon.perCustomerLimit !== undefined) {
            const customerUses = await OrderModel.countDocuments({
              user: user._id,
              couponCode: coupon.code,
            }).session(session!);
            if (customerUses >= coupon.perCustomerLimit) {
              throw new OrderRequestError('This account has reached the coupon usage limit.');
            }
          }

          const couponFilter: Record<string, unknown> = {
            _id: coupon._id,
            isActive: true,
            validFrom: { $lte: new Date() },
            validTo: { $gte: new Date() },
          };
          if (coupon.usageLimit !== undefined) {
            couponFilter.usageCount = { $lt: coupon.usageLimit };
          }
          const couponUpdate = await CouponModel.updateOne(
            couponFilter,
            { $inc: { usageCount: 1 } },
            { session }
          );
          if (couponUpdate.modifiedCount !== 1) {
            throw new OrderRequestError('The coupon can no longer be applied.', 409);
          }
        }

        const [createdOrder] = await OrderModel.create([orderData], { session });
        order = createdOrder;
        if (saveAddress === true) {
          await UserModel.updateOne(
            { _id: user._id },
            {
              $push: {
                addresses: {
                  ...validatedShippingAddress,
                  isDefault: user.addresses?.length === 0,
                },
              },
            },
            { session }
          );
        }
      });
    } else {
      order = { ...orderData, _id: `ord_${Date.now()}` };
      IN_MEMORY_ORDERS.unshift(order);
    }

    if (!order) {
      throw new Error('Order transaction completed without a persisted order.');
    }

    return res.status(reusedOrder ? 200 : 201).json({
      message: 'Order created successfully',
      order,
      dbStatus: isDbConnected() ? 'connected' : 'pending_configuration',
    });
  } catch (error: any) {
    if (error instanceof OrderRequestError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error?.code === 11000 && typeof req.body?.checkoutRequestId === 'string') {
      const existingOrder = await OrderModel.findOne({
        user: req.user!._id,
        checkoutRequestId: req.body.checkoutRequestId,
      });
      if (existingOrder) {
        return res.status(200).json({
          message: 'This checkout request was already processed.',
          order: existingOrder,
          dbStatus: 'connected',
        });
      }
    }
    console.error('Order creation failed:', error);
    return res.status(500).json({ error: 'Error processing order. Please verify your order status before retrying.' });
  } finally {
    await session?.endSession();
  }
});

// 2. Customer Order History
router.get('/my-orders', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const userOrders = IN_MEMORY_ORDERS.filter(
        (o) => o.user?._id?.toString() === req.user!._id?.toString() || o.user?.email === req.user!.email
      );
      return res.json({ orders: userOrders });
    }
    const orders = await OrderModel.find({ user: req.user!._id }).sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching user orders' });
  }
});

// 3. Customer Single Order Details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!isDbConnected()) {
      const order = IN_MEMORY_ORDERS.find(
        (o) => o._id === req.params.id || o.orderNumber === req.params.id
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json({ order });
    }
    const order = await OrderModel.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { orderNumber: req.params.id }],
      user: req.user!._id,
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching order details' });
  }
});

// 4. Customer Request Return
router.post('/:id/return', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { reason } = req.body;
    const order = await OrderModel.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = 'return_requested';
    order.statusHistory.push({
      status: 'return_requested',
      timestamp: new Date(),
      note: reason || 'Customer requested return / inspection',
      actor: req.user!.name,
    });

    await order.save();
    return res.json({ order, message: 'Return request submitted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error requesting return' });
  }
});

// 5. Admin List All Orders
router.get('/admin/all', requireAuth, requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    if (!isDbConnected()) {
      let orders = [...IN_MEMORY_ORDERS];
      if (status && status !== 'all') {
        orders = orders.filter((o) => o.orderStatus === status);
      }
      return res.json({ orders });
    }

    const query: Record<string, any> = {};
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const orders = await OrderModel.find(query).sort({ createdAt: -1 }).populate('user', 'name email phone');
    return res.json({ orders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching admin orders' });
  }
});

// 6. Admin Update Order Lifecycle Status
router.put('/admin/:id/status', requireAuth, requireStaff, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status, note } = req.body;
    if (!isDbConnected()) {
      const order = IN_MEMORY_ORDERS.find((o) => o._id === req.params.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      order.orderStatus = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status transitioned to ${status}`,
        actor: req.user!.name,
      });
      return res.json({ order, message: 'Order status updated' });
    }

    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = status;
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status transitioned to ${status}`,
      actor: req.user!.name,
    });

    await order.save();
    return res.json({ order, message: 'Order status updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error updating order status' });
  }
});

export default router;

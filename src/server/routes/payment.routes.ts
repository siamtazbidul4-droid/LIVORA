import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Router, Request, Response } from 'express';
import { PaymentModel } from '../models/Payment';
import { OrderModel } from '../models/Order';
import { bkashService } from '../services/bkashService';
import {
  getAvailablePaymentMethods,
  getPublicApiUrl,
  getPublicAppUrl,
  isBkashCheckoutAvailable,
} from '../services/paymentConfig';
import { requireAuth, requireStaff, AuthRequest } from '../middleware/auth';
import { isDbConnected } from '../config/db';
import { recordOrderPurchase } from '../services/purchaseTracking';

const router = Router();

router.get('/methods', (_req: Request, res: Response) => {
  const methods = getAvailablePaymentMethods();
  return res.json({
    methods: { ...methods, bkash: methods.bkash && isDbConnected() },
  });
});

async function findOrder(orderRef: string, userAuthId: string) {
  const query: Record<string, unknown> = {
    user: userAuthId,
    $or: [{ orderNumber: orderRef }],
  };
  if (/^[0-9a-fA-F]{24}$/.test(orderRef)) {
    (query.$or as Array<Record<string, string>>).push({ _id: orderRef });
  }
  return OrderModel.findOne(query);
}

function redirectToCheckout(
  res: Response,
  status: 'success' | 'failed' | 'cancel' | 'pending',
  paymentId?: string
) {
  const appUrl = getPublicAppUrl();
  if (!appUrl) return res.status(503).send('Payment return URL is not configured.');

  const redirect = new URL(`${appUrl}/checkout`);
  redirect.searchParams.set('status', status);
  if (paymentId) redirect.searchParams.set('paymentId', paymentId);
  return res.redirect(303, redirect.toString());
}

function matchesVerifiedPayment(
  result: {
    paymentID: string;
    trxID: string;
    transactionStatus: string;
    amount: string;
    currency: string;
    intent: string;
    merchantInvoiceNumber: string;
    statusCode: string;
  },
  payment: {
    gatewayPaymentReference?: string;
    orderNumber: string;
    amount: number;
    currency: string;
  }
): boolean {
  return (
    result.statusCode === '0000' &&
    result.transactionStatus === 'Completed' &&
    Boolean(result.trxID) &&
    result.paymentID === payment.gatewayPaymentReference &&
    result.merchantInvoiceNumber === payment.orderNumber &&
    result.currency === payment.currency &&
    result.intent === 'sale' &&
    Number.isFinite(Number(result.amount)) &&
    Number(result.amount).toFixed(2) === payment.amount.toFixed(2)
  );
}

async function settleVerifiedPayment(paymentId: mongoose.Types.ObjectId, trxId: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const payment = await PaymentModel.findById(paymentId).session(session);
      if (!payment) throw new Error('Payment attempt no longer exists.');
      if (payment.status === 'paid') return;
      if (!['initiated', 'awaiting_verification'].includes(payment.status)) {
        throw new Error('Payment attempt is not in a settleable state.');
      }

      const order = await OrderModel.findOne({
        _id: payment.orderId,
        user: payment.userId,
        paymentMethod: 'bkash',
      }).session(session);
      if (!order) throw new Error('The associated order could not be verified.');

      const alreadyPaid = order.paymentStatus === 'paid';
      if (!alreadyPaid) {
        const orderUpdate = await OrderModel.updateOne(
          { _id: order._id, paymentStatus: { $ne: 'paid' } },
          {
            $set: {
              paymentStatus: 'paid',
              paymentTransactionId: trxId,
              orderStatus: 'confirmed',
            },
            $push: {
              statusHistory: {
                status: 'confirmed',
                timestamp: new Date(),
                note: 'bKash payment verified by the provider.',
                actor: 'bKash Gateway',
              },
            },
          },
          { session }
        );
        if (orderUpdate.modifiedCount !== 1) {
          throw new Error('Order payment state changed while settling.');
        }
        await recordOrderPurchase(order, session);
      }

      payment.status = 'paid';
      payment.gatewayTransactionId = trxId;
      payment.verifiedAt = new Date();
      payment.requiresReconciliation = alreadyPaid;
      payment.statusHistory.push({
        status: 'paid',
        timestamp: new Date(),
        note: alreadyPaid
          ? 'Provider verified an additional successful charge for an already-paid order; reconciliation is required.'
          : 'Payment verified by the provider.',
      });
      await payment.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

async function updateAttemptStatus(
  paymentId: mongoose.Types.ObjectId,
  status: 'failed' | 'cancelled' | 'expired' | 'awaiting_verification',
  note: string
) {
  const payment = await PaymentModel.findOneAndUpdate(
    {
      _id: paymentId,
      status: { $in: ['pending', 'initiated', 'awaiting_verification'] },
    },
    {
      $set: { status },
      $push: { statusHistory: { status, timestamp: new Date(), note } },
    },
    { new: true }
  );
  if (payment) {
    await OrderModel.updateOne(
      { _id: payment.orderId, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: status } }
    );
  }
  return payment;
}

router.post('/bkash/initiate', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Payment requires a connected database.' });
  }
  if (!isBkashCheckoutAvailable()) {
    return res.status(503).json({ error: 'bKash checkout is not configured for this environment.' });
  }

  try {
    const orderRef =
      typeof req.body?.orderNumber === 'string'
        ? req.body.orderNumber
        : typeof req.body?.orderId === 'string'
          ? req.body.orderId
          : '';
    if (!orderRef || orderRef.length > 100) {
      return res.status(400).json({ error: 'A valid order reference is required.' });
    }

    const user = req.user!;
    const order = await findOrder(orderRef, user._id.toString());
    if (!order) return res.status(404).json({ error: 'Order not found for this account.' });
    if (order.paymentMethod !== 'bkash' || order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This order is not eligible for bKash payment.' });
    }

    const existingAttempt = await PaymentModel.findOne({
      orderId: order._id,
      gateway: 'bkash',
      status: { $in: ['pending', 'initiated', 'awaiting_verification'] },
    });
    if (existingAttempt) {
      if (existingAttempt.gatewayRedirectUrl && existingAttempt.gatewayPaymentReference) {
        return res.json({
          success: true,
          paymentId: existingAttempt.paymentId,
          redirectUrl: existingAttempt.gatewayRedirectUrl,
          status: existingAttempt.status,
        });
      }
      return res.status(409).json({
        error: 'A prior payment attempt is still being reconciled. Do not start another payment.',
      });
    }

    const paymentId = randomUUID();
    const payment = await PaymentModel.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: user._id,
      customerEmail: user.email,
      customerPhone: user.phone,
      gateway: 'bkash',
      paymentId,
      amount: order.total,
      currency: 'BDT',
      status: 'pending',
      idempotencyKey: paymentId,
      statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Payment attempt created.' }],
    });

    const orderStarted = await OrderModel.updateOne(
      {
        _id: order._id,
        user: user._id,
        paymentMethod: 'bkash',
        paymentStatus: { $in: ['pending', 'failed', 'cancelled', 'expired'] },
      },
      { $set: { paymentStatus: 'initiated' } }
    );
    if (orderStarted.modifiedCount !== 1) {
      await updateAttemptStatus(payment._id, 'failed', 'Order was no longer eligible for payment.');
      return res.status(409).json({ error: 'Order payment state changed. Refresh and try again.' });
    }

    const apiUrl = getPublicApiUrl()!;
    try {
      const initiated = await bkashService.createPayment({
        amount: order.total,
        orderNumber: order.orderNumber,
        callbackUrl: `${apiUrl}/api/payments/bkash/callback`,
        payerReference: user.phone || user.email,
      });

      if (
        initiated.merchantInvoiceNumber !== order.orderNumber ||
        initiated.currency !== 'BDT' ||
        Number(initiated.amount).toFixed(2) !== order.total.toFixed(2)
      ) {
        await updateAttemptStatus(
          payment._id,
          'awaiting_verification',
          'bKash initiation response did not match the order; manual reconciliation is required.'
        );
        return res.status(502).json({ error: 'Provider response requires reconciliation; do not retry yet.' });
      }

      payment.gatewayPaymentReference = initiated.paymentID;
      payment.gatewayRedirectUrl = initiated.bkashURL;
      payment.status = 'initiated';
      payment.statusHistory.push({
        status: 'initiated',
        timestamp: new Date(),
        note: 'bKash checkout initiated.',
      });
      await payment.save();
      return res.json({
        success: true,
        paymentId: payment.paymentId,
        redirectUrl: initiated.bkashURL,
        status: payment.status,
      });
    } catch (error) {
      console.error('bKash initiation could not be confirmed:', error);
      await updateAttemptStatus(
        payment._id,
        'awaiting_verification',
        'The provider initiation result is uncertain; manual reconciliation is required.'
      );
      return res.status(502).json({
        error: 'Payment initiation status is uncertain. Do not retry; contact support to reconcile the attempt.',
      });
    }
  } catch (error) {
    console.error('bKash payment initiation failed:', error);
    return res.status(500).json({ error: 'Unable to initiate bKash payment.' });
  }
});

router.all('/bkash/callback', async (req: Request, res: Response): Promise<any> => {
  if (!isDbConnected()) return res.status(503).send('Payment verification is unavailable.');

  const gatewayPaymentId = req.query.paymentID || req.body?.paymentID;
  if (typeof gatewayPaymentId !== 'string' || gatewayPaymentId.length > 200) {
    return redirectToCheckout(res, 'failed');
  }

  try {
    const payment = await PaymentModel.findOne({
      gateway: 'bkash',
      gatewayPaymentReference: gatewayPaymentId,
    });
    if (!payment) return redirectToCheckout(res, 'failed');
    if (payment.status === 'paid') {
      return redirectToCheckout(res, 'success', payment.paymentId);
    }
    if (!['initiated', 'awaiting_verification'].includes(payment.status)) {
      return redirectToCheckout(res, 'failed', payment.paymentId);
    }

    const callbackStatus = String(req.query.status || req.body?.status || '').toLowerCase();
    let verification;
    if (callbackStatus === 'success') {
      try {
        verification = await bkashService.executePayment(gatewayPaymentId);
      } catch (executeError) {
        console.warn('bKash execution response unavailable; querying provider status.');
        verification = await bkashService.queryPayment(gatewayPaymentId);
      }
    } else {
      verification = await bkashService.queryPayment(gatewayPaymentId);
    }

    if (matchesVerifiedPayment(verification, payment)) {
      await settleVerifiedPayment(payment._id, verification.trxID);
      const updatedPayment = await PaymentModel.findById(payment._id);
      if (updatedPayment?.requiresReconciliation) {
        console.error(
          `Duplicate successful charge requires reconciliation for order ${payment.orderNumber}.`
        );
      }
      return redirectToCheckout(res, 'success', payment.paymentId);
    }

    if (verification.paymentID === gatewayPaymentId && verification.transactionStatus === 'Initiated') {
      const status = callbackStatus === 'cancel' ? 'cancelled' : 'failed';
      await updateAttemptStatus(payment._id, status, `bKash reported ${status} after server-side status query.`);
      return redirectToCheckout(res, status === 'cancelled' ? 'cancel' : 'failed', payment.paymentId);
    }

    await updateAttemptStatus(
      payment._id,
      'awaiting_verification',
      'Provider status is not final or did not match the order; reconciliation is required.'
    );
    return redirectToCheckout(res, 'pending', payment.paymentId);
  } catch (error) {
    console.error('bKash callback verification requires reconciliation:', error);
    return redirectToCheckout(res, 'pending');
  }
});

router.post('/nagad/initiate', requireAuth, (_req: AuthRequest, res: Response) =>
  res.status(503).json({
    error: 'Nagad checkout is disabled until its official merchant protocol can be verified and implemented.',
  })
);

router.all('/nagad/callback', (_req: Request, res: Response) =>
  res.status(410).send('Nagad payment callbacks are not enabled.')
);

router.get('/:paymentId/status', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const payment = await PaymentModel.findOne({ paymentId: req.params.paymentId });
    if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

    const isOwner = payment.userId?.toString() === req.user!._id.toString();
    const staffRoles = ['super_admin', 'admin', 'order_manager', 'finance'];
    if (!isOwner && !staffRoles.includes(req.user!.role)) {
      return res.status(403).json({ error: 'Access forbidden.' });
    }

    return res.json({
      payment: {
        paymentId: payment.paymentId,
        orderNumber: payment.orderNumber,
        gateway: payment.gateway,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gatewayTransactionId: payment.gatewayTransactionId,
        requiresReconciliation: payment.requiresReconciliation,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Payment status lookup failed:', error);
    return res.status(500).json({ error: 'Unable to check payment status.' });
  }
});

router.get('/admin/all', requireAuth, requireStaff, async (_req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Payment records are unavailable.' });
    const payments = await PaymentModel.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ payments });
  } catch (error) {
    console.error('Admin payment lookup failed:', error);
    return res.status(500).json({ error: 'Unable to fetch payment records.' });
  }
});

export default router;

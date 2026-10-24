import mongoose, { Schema, Document } from 'mongoose';

export type PaymentGatewayType = 'bkash' | 'nagad' | 'cod' | 'card' | 'sslcommerz';
export type PaymentStatusType =
  | 'pending'
  | 'initiated'
  | 'awaiting_verification'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_pending'
  | 'refunded';

export interface IPayment extends Document {
  orderId: any;
  orderNumber: string;
  userId: any;
  customerEmail: string;
  customerPhone?: string;
  gateway: PaymentGatewayType;
  paymentId: string; // Unique internal reference
  gatewayPaymentReference?: string; // Gateway's internal reference ID (e.g. bKash paymentID, Nagad paymentRefId)
  gatewayRedirectUrl?: string;
  gatewayTransactionId?: string; // Merchant trxID
  amount: number;
  currency: string;
  status: PaymentStatusType;
  idempotencyKey?: string;
  statusHistory: Array<{
    status: PaymentStatusType;
    timestamp: Date;
    note?: string;
  }>;
  rawGatewayResponse?: Record<string, any>;
  verifiedAt?: Date;
  refundAmount?: number;
  refundTransactionId?: string;
  requiresReconciliation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String },
    gateway: {
      type: String,
      enum: ['bkash', 'nagad', 'cod', 'card', 'sslcommerz'],
      required: true,
    },
    paymentId: { type: String, required: true, unique: true },
    gatewayPaymentReference: { type: String },
    gatewayRedirectUrl: { type: String },
    gatewayTransactionId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    status: {
      type: String,
      enum: [
        'pending',
        'initiated',
        'awaiting_verification',
        'paid',
        'failed',
        'cancelled',
        'expired',
        'refund_pending',
        'refunded',
      ],
      default: 'pending',
    },
    idempotencyKey: { type: String, unique: true, sparse: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    rawGatewayResponse: { type: Schema.Types.Mixed },
    verifiedAt: { type: Date },
    refundAmount: { type: Number, default: 0 },
    refundTransactionId: { type: String },
    requiresReconciliation: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ gatewayTransactionId: 1 }, { sparse: true });
PaymentSchema.index(
  { gateway: 1, gatewayPaymentReference: 1 },
  { unique: true, partialFilterExpression: { gatewayPaymentReference: { $type: 'string' } } }
);
PaymentSchema.index({ status: 1 });

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

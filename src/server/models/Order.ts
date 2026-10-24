import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  checkoutRequestId?: string;
  user: any;
  items: Array<{
    productId: any;
    variantSku?: string;
    productName: string;
    price: number;
    quantity: number;
    image: string;
    selectedOptions?: Record<string, string>;
    subtotal: number;
  }>;
  shippingAddress: {
    recipientName: string;
    phone: string;
    divisionId?: number;
    districtId?: number;
    upazilaId?: number;
    unionId?: number;
    division: string;
    district: string;
    upazila: string;
    union?: string;
    streetAddress: string;
    landmark?: string;
  };
  paymentMethod: 'cod' | 'sslcommerz' | 'bkash' | 'nagad' | 'card';
  paymentStatus: 'pending' | 'initiated' | 'awaiting_verification' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refund_pending' | 'refunded';
  paymentTransactionId?: string;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned' | 'refunded';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
    actor?: string;
  }>;
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  shippingFee: number;
  total: number;
  staffNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantSku: { type: String },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  selectedOptions: { type: Map, of: String },
  subtotal: { type: Number, required: true },
});

const OrderStatusHistorySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  actor: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true },
    checkoutRequestId: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    shippingAddress: {
      recipientName: { type: String, required: true },
      phone: { type: String, required: true },
      divisionId: { type: Number },
      districtId: { type: Number },
      upazilaId: { type: Number },
      unionId: { type: Number },
      division: { type: String, required: true },
      district: { type: String, required: true },
      upazila: { type: String, required: true },
      union: { type: String },
      streetAddress: { type: String, required: true },
      landmark: { type: String },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'sslcommerz', 'bkash', 'nagad', 'card'],
      default: 'cod',
    },
    paymentStatus: {
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
    paymentTransactionId: { type: String },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'],
      default: 'pending',
    },
    statusHistory: [OrderStatusHistorySchema],
    subtotal: { type: Number, required: true },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    staffNotes: [{ type: String }],
  },
  { timestamps: true }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index(
  { user: 1, checkoutRequestId: 1 },
  { unique: true, partialFilterExpression: { checkoutRequestId: { $type: 'string' } } }
);

export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: string;
  variantSku?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
  maxStock: number;
}

export interface ICart extends Document {
  userId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    variantSku: { type: String, default: '' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedOptions: { type: Map, of: String },
    maxStock: { type: Number, default: 99 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export const CartModel =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

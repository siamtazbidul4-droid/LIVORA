import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  nameBn?: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  categoryName?: string;
  description: string;
  features: string[];
  basePrice: number;
  salePrice?: number;
  stock: number;
  reservedStock?: number;
  images: string[];
  variants: Array<{
    sku: string;
    name: string;
    options: Record<string, string>;
    price: number;
    salePrice?: number;
    stock: number;
    reservedStock?: number;
    image?: string;
  }>;
  categoryAttributes?: Record<string, any>;
  warranty?: string;
  badges?: string[];
  status: 'active' | 'draft' | 'archived';
  rating: number;
  numReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  options: { type: Map, of: String },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  stock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  image: { type: String },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    brand: { type: String, required: true, default: 'Livora' },
    category: { type: String, required: true },
    categoryName: { type: String },
    description: { type: String, required: true },
    features: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    variants: [ProductVariantSchema],
    categoryAttributes: { type: Map, of: Schema.Types.Mixed },
    warranty: { type: String, default: '1 Year Structural Warranty' },
    badges: [{ type: String }],
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    rating: { type: Number, default: 5.0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Search indexing for English & Bangla keywords
ProductSchema.index({ name: 'text', nameBn: 'text', description: 'text', brand: 'text', sku: 'text' });
ProductSchema.index({ category: 1, basePrice: 1, rating: -1 });

export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

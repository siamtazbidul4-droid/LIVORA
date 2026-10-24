import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  nameBn?: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  image?: string;
  displayOrder?: number;
  featured?: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    description: { type: String },
    image: { type: String },
    displayOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export const BrandModel = mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);

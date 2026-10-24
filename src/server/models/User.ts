import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'customer' | 'super_admin' | 'admin' | 'order_manager' | 'inventory_manager' | 'catalog_manager' | 'customer_support' | 'finance';
  avatar?: string;
  authProvider?: 'local' | 'google' | 'facebook';
  googleId?: string;
  facebookId?: string;
  emailVerified?: boolean;
  tokenVersion: number;
  addresses: Array<{
    _id?: any;
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
    isDefault?: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const AddressSchema = new Schema({
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
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ['customer', 'super_admin', 'admin', 'order_manager', 'inventory_manager', 'catalog_manager', 'customer_support', 'finance'],
      default: 'customer',
    },
    avatar: { type: String },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    googleId: { type: String },
    facebookId: { type: String },
    emailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0, min: 0 },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
UserSchema.index({ facebookId: 1 }, { unique: true, sparse: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

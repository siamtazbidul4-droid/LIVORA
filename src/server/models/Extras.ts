import mongoose, { Schema, Document } from 'mongoose';

// 1. Review Model
export interface IReview extends Document {
  productId: any;
  productName?: string;
  userId: any;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    moderationReason: { type: String },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, status: 1 });
export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

// 2. Coupon Model
export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  perCustomerLimit?: number;
  usageCount: number;
  isActive: boolean;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, required: true, default: 0 },
    maxDiscountAmount: { type: Number },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date, required: true },
    usageLimit: { type: Number },
    perCustomerLimit: { type: Number, default: 1 },
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

// 3. CMS Model
export interface ICMS extends Document {
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
  };
  heroCampaign: {
    tagline: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    secondaryNote: string;
    imageUrl: string;
  };
  splitBanners: {
    left: {
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      imageUrl: string;
    };
    right: {
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      imageUrl: string;
    };
  };
  promotionalAd: {
    enabled: boolean;
    title: string;
    imageUrl: string;
    destinationUrl: string;
    altText?: string;
    badgeText?: string;
  };
}

const CMSSchema = new Schema<ICMS>(
  {
    announcementBar: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: 'Free Shipping on Orders Over ৳5,000 | Stylish Homes. Happier Lives.' },
      linkText: { type: String },
      linkUrl: { type: String },
    },
    heroCampaign: {
      tagline: { type: String, default: 'SPACES THAT FEEL LIKE YOU' },
      title: { type: String, default: 'Beautiful Homes Brighter Lives' },
      subtitle: { type: String, default: 'Timeless furniture and home essentials for every story.' },
      ctaText: { type: String, default: 'Shop the Collection' },
      ctaLink: { type: String, default: '/products' },
      secondaryNote: { type: String, default: 'A more beautiful tomorrow' },
      imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=85' },
    },
    splitBanners: {
      left: {
        title: { type: String, default: 'Make Every Corner Special' },
        subtitle: { type: String, default: 'Up to 40% Off Home Decor' },
        ctaText: { type: String, default: 'Shop Decor' },
        ctaLink: { type: String, default: '/products?category=home-decor' },
        imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=700&q=80' },
      },
      right: {
        title: { type: String, default: 'Comfort Lives Here' },
        subtitle: { type: String, default: 'Premium Bedding Collection Up to 30% Off' },
        ctaText: { type: String, default: 'Shop Bedding' },
        ctaLink: { type: String, default: '/products?category=bedding' },
        imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80' },
      },
    },
    promotionalAd: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: 'Exclusive Artisan Showcase' },
      imageUrl: { type: String, default: '' },
      destinationUrl: { type: String, default: '' },
      altText: { type: String },
      badgeText: { type: String, default: 'LIMITED PROMO' },
    },
  },
  { timestamps: true }
);

export const CMSModel = mongoose.models.CMS || mongoose.model<ICMS>('CMS', CMSSchema);

// 4. Support Enquiry Model
export interface ISupportEnquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  internalNotes?: string;
  createdAt: Date;
}

const SupportEnquirySchema = new Schema<ISupportEnquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new' },
    internalNotes: { type: String },
  },
  { timestamps: true }
);

export const SupportEnquiryModel = mongoose.models.SupportEnquiry || mongoose.model<ISupportEnquiry>('SupportEnquiry', SupportEnquirySchema);

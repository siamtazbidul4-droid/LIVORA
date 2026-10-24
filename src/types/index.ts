// Application-wide Type Definitions

export type UserRole = 
  | 'customer'
  | 'super_admin'
  | 'admin'
  | 'order_manager'
  | 'inventory_manager'
  | 'catalog_manager'
  | 'customer_support'
  | 'finance';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  authProvider?: 'local' | 'google' | 'facebook';
  googleId?: string;
  facebookId?: string;
  emailVerified?: boolean;
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id?: string;
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
}

export interface Category {
  _id: string;
  name: string;
  nameBn?: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  image?: string;
  displayOrder?: number;
  featured?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

export interface ProductVariant {
  sku: string;
  name: string;
  options: Record<string, string>; // e.g. { Color: 'Warm Walnut', Size: 'King' }
  price: number;
  salePrice?: number;
  stock: number;
  reservedStock?: number;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  nameBn?: string;
  slug: string;
  sku: string;
  brand: string;
  category: string; // Category Slug or ID
  categoryName?: string;
  description: string;
  features: string[];
  basePrice: number;
  salePrice?: number;
  stock: number;
  reservedStock?: number;
  images: string[];
  variants?: ProductVariant[];
  categoryAttributes?: Record<string, string | number>;
  warranty?: string;
  badges?: string[]; // e.g. ['New', 'Best Seller', 'Sustainable']
  status: 'active' | 'draft' | 'archived';
  rating: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
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

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card' | 'sslcommerz';
export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'awaiting_verification'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_pending'
  | 'refunded';

export interface PaymentRecord {
  _id: string;
  orderId: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerPhone?: string;
  gateway: PaymentMethod;
  paymentId: string;
  gatewayPaymentReference?: string;
  gatewayTransactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusHistory: Array<{
    status: PaymentStatus;
    timestamp: string;
    note?: string;
  }>;
  verifiedAt?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  variantSku?: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions?: Record<string, string>;
  subtotal: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  actor?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  shippingFee: number;
  total: number;
  staffNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface CMSConfig {
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
      bgColor?: string;
    };
    right: {
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      imageUrl: string;
      bgColor?: string;
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
  curatedCollections: Array<{
    title: string;
    slug: string;
    imageUrl: string;
    itemCount?: number;
  }>;
  trustStats: {
    customersCount: string;
    satisfactionRate: string;
    deliveryPromise: string;
  };
}

export interface SupportEnquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  internalNotes?: string;
  createdAt: string;
}

import mongoose, { Schema, Document } from 'mongoose';

export type InteractionEventType =
  | 'impression'
  | 'detail_view'
  | 'click'
  | 'search_click'
  | 'add_to_cart'
  | 'wishlist_add'
  | 'purchase'
  | 'review';

export interface IInteraction extends Document {
  userId?: any;
  sessionId: string;
  productId: any;
  productName: string;
  category: string;
  brand?: string;
  eventType: InteractionEventType;
  source?: string; // 'search' | 'home_hero' | 'related' | 'category_grid'
  timestamp: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String },
    eventType: {
      type: String,
      enum: [
        'impression',
        'detail_view',
        'click',
        'search_click',
        'add_to_cart',
        'wishlist_add',
        'purchase',
        'review',
      ],
      required: true,
    },
    source: { type: String, default: 'browse' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

InteractionSchema.index({ userId: 1, timestamp: -1 });
InteractionSchema.index({ sessionId: 1, timestamp: -1 });
InteractionSchema.index({ productId: 1, eventType: 1 });
InteractionSchema.index({ category: 1, eventType: 1 });

export const InteractionModel =
  mongoose.models.Interaction ||
  mongoose.model<IInteraction>('Interaction', InteractionSchema);

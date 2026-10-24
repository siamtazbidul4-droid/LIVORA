import type { ClientSession } from 'mongoose';
import { InteractionModel } from '../models/Interaction';
import type { IOrder } from '../models/Order';

export async function recordOrderPurchase(order: IOrder, session: ClientSession): Promise<void> {
  if (order.items.length === 0) return;

  await InteractionModel.insertMany(
    order.items.map((item) => ({
      userId: order.user,
      sessionId: `order:${order.orderNumber}`,
      productId: item.productId,
      productName: item.productName,
      category: 'general',
      eventType: 'purchase',
      source: 'verified_order',
      timestamp: new Date(),
    })),
    { session }
  );
}

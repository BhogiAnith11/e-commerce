import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  imageUrl: string;
  price: number;
  qty: number;
}

export interface IShippingAddress {
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  buyerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'created' | 'paid' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  shippingAddress: IShippingAddress;
  paymentMethod?: string;
  upiId?: string;
  stripePaymentIntentId?: string;
  estimatedDeliveryDate?: Date;
  courierName?: string;
  trackingNumber?: string;
  deliveryOtp?: string;
  deliveryNotes?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        title: String,
        imageUrl: String,
        price: Number,
        qty: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'paid',
    },
    shippingAddress: {
      name: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: { type: String, default: 'Paytm / UPI' },
    upiId: { type: String },
    stripePaymentIntentId: { type: String },
    estimatedDeliveryDate: { type: Date },
    courierName: { type: String, default: 'ShopEZ Express' },
    trackingNumber: { type: String },
    deliveryOtp: { type: String, default: '4829' },
    deliveryNotes: { type: String },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;

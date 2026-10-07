import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema(
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

const Order =
  mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;

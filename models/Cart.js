import mongoose, { Schema } from 'mongoose';

const CartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
});

const CartSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

// Synchronize indexes to remove obsolete indexes like 'user_1'
Cart.syncIndexes().catch(() => {
  Cart.collection.dropIndex('user_1').catch(() => {});
});

export default Cart;


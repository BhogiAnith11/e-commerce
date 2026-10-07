import mongoose, { Schema } from 'mongoose';

const ProductReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProductSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    imageUrl: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    reviews: [ProductReviewSchema],
    status: { type: String, enum: ['draft', 'published', 'delisted'], default: 'draft' },
    mediaId: { type: String },
    draftId: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ status: 1, category: 1 });

const Product =
  mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;

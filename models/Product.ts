import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductReview {
  userId: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  stock: number;
  imageUrl: string;
  rating: number;
  numReviews: number;
  reviews?: IProductReview[];
  status: 'draft' | 'published' | 'delisted';
  mediaId?: string;
  draftId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductReviewSchema = new Schema<IProductReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
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

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;

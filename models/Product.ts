import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  stock: number;
  imageUrl: string;
  status: 'draft' | 'published' | 'delisted';
  mediaId?: string;
  draftId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

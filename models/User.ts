import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface IUser extends Document {
  email: string;
  name: string;
  role: 'seller' | 'buyer' | 'admin' | 'delivery';
  passwordHash: string;
  image?: string;
  phone?: string;
  storeName?: string;
  vehicleNumber?: string;
  deliveryHub?: string;
  address?: IUserAddress;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['seller', 'buyer', 'admin', 'delivery'], required: true },
    passwordHash: { type: String, required: true },
    image: { type: String },
    phone: { type: String },
    storeName: { type: String },
    vehicleNumber: { type: String },
    deliveryHub: { type: String, default: 'Bengaluru Central Hub KA-01' },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;

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
  role: 'seller' | 'buyer' | 'admin';
  passwordHash: string;
  image?: string;
  phone?: string;
  storeName?: string;
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
    role: { type: String, enum: ['seller', 'buyer', 'admin'], required: true },
    passwordHash: { type: String, required: true },
    image: { type: String },
    phone: { type: String },
    storeName: { type: String },
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

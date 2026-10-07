import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;

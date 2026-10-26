import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'superadmin' | 'admin';

export interface IUser extends Document {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  branchId?: string | null;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    branchId: { type: String, default: null, trim: true },
    phone: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  id: string;
  name: string;
  code: string;
  location?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const BranchModel = mongoose.model<IBranch>('Branch', BranchSchema);

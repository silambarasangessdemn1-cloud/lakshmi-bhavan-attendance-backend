import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  id: string;
  name: string;
  designation: string;
  phone: string;
  wage: number;
  otRate: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  loanStart: number;
  monthlyLoanDeduction?: number;
  autoLoanDeduct?: boolean;
  photo?: string;
  branchId?: string;
  notes?: string;
  joiningDate?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    branchId: { type: String, default: '', index: true, trim: true },
    designation: { type: String, required: true, default: 'Staff', trim: true },
    phone: { type: String, default: '', trim: true },
    wage: { type: Number, required: true, default: 0, min: 0 },
    otRate: { type: Number, required: true, default: 0, min: 0 },
    bankName: { type: String, default: '', trim: true },
    accountHolder: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    ifsc: { type: String, default: '', trim: true },
    loanStart: { type: Number, default: 0, min: 0 },
    monthlyLoanDeduction: { type: Number, default: 0, min: 0 },
    autoLoanDeduct: { type: Boolean, default: true },
    photo: { type: String, default: '' },
    notes: { type: String, default: '', trim: true },
    joiningDate: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const StaffModel = mongoose.model<IStaff>('Staff', StaffSchema);

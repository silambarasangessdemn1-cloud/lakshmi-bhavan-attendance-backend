import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'UPI' | 'Cheque';

export interface IPayment extends Document {
  id: string;
  date: string;
  month: string;
  staffId: string;
  staffName: string;
  dailyWage: number;
  daysPresent: number;
  otHours: number;
  otRate: number;
  otEarnings: number;
  gross: number;
  advance: number;
  loanDeduct: number;
  loanAdded?: number;
  net: number;
  status: 'Paid' | 'Pending';
  paymentMethod: PaymentMethod;
  notes: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    month: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    staffName: { type: String, required: true },
    dailyWage: { type: Number, default: 0 },
    daysPresent: { type: Number, default: 0 },
    otHours: { type: Number, default: 0 },
    otRate: { type: Number, default: 0 },
    otEarnings: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    loanDeduct: { type: Number, default: 0 },
    loanAdded: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cash', 'UPI', 'Cheque'],
      default: 'Bank Transfer',
    },
    notes: { type: String, default: '' },
    timestamp: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

PaymentSchema.index({ staffId: 1, month: 1 }, { unique: true });

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);

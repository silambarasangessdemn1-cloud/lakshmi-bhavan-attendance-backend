import mongoose, { Schema, Document } from 'mongoose';

export type LoanAdvanceType = 'advance' | 'loan_issue' | 'loan_repay';

export interface ILoanAdvance extends Document {
  id: string;
  staffId: string;
  type: LoanAdvanceType;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  notes: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoanAdvanceSchema = new Schema<ILoanAdvance>(
  {
    id: { type: String, required: true, unique: true },
    staffId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['advance', 'loan_issue', 'loan_repay'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
    month: { type: String, required: true, index: true },
    notes: { type: String, default: '' },
    timestamp: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

export const LoanAdvanceModel = mongoose.model<ILoanAdvance>('LoanAdvance', LoanAdvanceSchema);

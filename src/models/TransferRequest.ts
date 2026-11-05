import mongoose, { Schema, Document } from 'mongoose';

export type TransferRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ITransferRequest extends Document {
  id: string;
  staffId: string;
  staffName: string;
  fromBranchId: string;
  fromBranchName?: string;
  toBranchId: string;
  toBranchName?: string;
  reason?: string;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserRole: string;
  status: TransferRequestStatus;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewNotes?: string;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransferRequestSchema = new Schema<ITransferRequest>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    staffId: { type: String, required: true, index: true, trim: true },
    staffName: { type: String, required: true, trim: true },
    fromBranchId: { type: String, required: true, index: true, trim: true },
    fromBranchName: { type: String, default: '', trim: true },
    toBranchId: { type: String, required: true, index: true, trim: true },
    toBranchName: { type: String, default: '', trim: true },
    reason: { type: String, default: '', trim: true },
    requestedByUserId: { type: String, required: true, trim: true },
    requestedByUserName: { type: String, required: true, trim: true },
    requestedByUserRole: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reviewedByUserId: { type: String, default: null },
    reviewedByUserName: { type: String, default: null },
    reviewNotes: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const TransferRequestModel = mongoose.model<ITransferRequest>(
  'TransferRequest',
  TransferRequestSchema
);


import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'present' | 'half' | 'absent' | 'leave';

export interface IAttendance extends Document {
  id: string;
  staffId: string;
  branchId?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  ot: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    id: { type: String, required: true, unique: true },
    staffId: { type: String, required: true, index: true },
    branchId: { type: String, default: '', index: true },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'half', 'absent', 'leave'],
      required: true,
      default: 'present',
    },
    inTime: { type: String, default: '09:00' },
    outTime: { type: String, default: '18:00' },
    ot: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export const AttendanceModel = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

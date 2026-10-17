import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  currency: string;
  currencySymbol: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, required: true, default: 'Shree Lakshmi Bhavan' },
    tagline: { type: String, default: 'Staff Salary & Attendance Manager' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);

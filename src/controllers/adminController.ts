import { Request, Response } from 'express';
import { StaffModel } from '../models/Staff.js';
import { AttendanceModel } from '../models/Attendance.js';
import { LoanAdvanceModel } from '../models/LoanAdvance.js';
import { PaymentModel } from '../models/Payment.js';
import { SettingsModel } from '../models/Settings.js';
import { isUsingFallback, isMongoDBConnected, fallbackStore, saveFallbackToDisk } from '../config/db.js';
import { defaultSettings } from './settingsController.js';

export const getHealth = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Shree Lakshmi Bhavan Attendance & Payroll API',
    database: {
      type: isMongoDBConnected() ? 'MongoDB' : 'Local Fallback Storage',
      connected: isMongoDBConnected(),
      fallbackActive: isUsingFallback(),
    },
  });
};

export const resetAllData = async (_req: Request, res: Response) => {
  try {
    if (isUsingFallback()) {
      fallbackStore.staff = [];
      fallbackStore.attendance = [];
      fallbackStore.loanAdvances = [];
      fallbackStore.payments = [];
      fallbackStore.settings = { ...defaultSettings };
      saveFallbackToDisk();
      return res.json({ success: true, message: 'All database records wiped clean for fresh start.' });
    }

    await Promise.all([
      StaffModel.deleteMany({}),
      AttendanceModel.deleteMany({}),
      LoanAdvanceModel.deleteMany({}),
      PaymentModel.deleteMany({}),
      SettingsModel.deleteMany({}),
    ]);
    await SettingsModel.create(defaultSettings);

    res.json({ success: true, message: 'All database records wiped clean for fresh start.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportAllData = async (_req: Request, res: Response) => {
  try {
    if (isUsingFallback()) {
      return res.json({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: fallbackStore,
      });
    }

    const [staff, attendance, loanAdvances, payments, settings] = await Promise.all([
      StaffModel.find().lean(),
      AttendanceModel.find().lean(),
      LoanAdvanceModel.find().lean(),
      PaymentModel.find().lean(),
      SettingsModel.findOne().lean(),
    ]);

    res.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        staff,
        attendance,
        loanAdvances,
        payments,
        settings: settings || defaultSettings,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importAllData = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Payload data is required for import.' });
    }

    const safeStaff = Array.isArray(data.staff) ? data.staff : [];
    const safeAttendance = Array.isArray(data.attendance) ? data.attendance : [];
    const safeLoanAdvances = Array.isArray(data.loanAdvances) ? data.loanAdvances : [];
    const safePayments = Array.isArray(data.payments) ? data.payments : [];
    const safeSettings = data.settings || defaultSettings;

    if (isUsingFallback()) {
      fallbackStore.staff = safeStaff;
      fallbackStore.attendance = safeAttendance;
      fallbackStore.loanAdvances = safeLoanAdvances;
      fallbackStore.payments = safePayments;
      fallbackStore.settings = safeSettings;
      saveFallbackToDisk();
      return res.json({
        success: true,
        message: 'Data successfully restored from backup.',
        stats: {
          staff: safeStaff.length,
          attendance: safeAttendance.length,
          loanAdvances: safeLoanAdvances.length,
          payments: safePayments.length,
        },
      });
    }

    await Promise.all([
      StaffModel.deleteMany({}),
      AttendanceModel.deleteMany({}),
      LoanAdvanceModel.deleteMany({}),
      PaymentModel.deleteMany({}),
      SettingsModel.deleteMany({}),
    ]);

    if (safeStaff.length > 0) await StaffModel.insertMany(safeStaff);
    if (safeAttendance.length > 0) await AttendanceModel.insertMany(safeAttendance);
    if (safeLoanAdvances.length > 0) await LoanAdvanceModel.insertMany(safeLoanAdvances);
    if (safePayments.length > 0) await PaymentModel.insertMany(safePayments);
    await SettingsModel.create(safeSettings);

    res.json({
      success: true,
      message: 'Data successfully restored from backup.',
      stats: {
        staff: safeStaff.length,
        attendance: safeAttendance.length,
        loanAdvances: safeLoanAdvances.length,
        payments: safePayments.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

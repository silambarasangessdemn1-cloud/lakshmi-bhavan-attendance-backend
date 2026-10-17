"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importAllData = exports.exportAllData = exports.resetAllData = exports.getHealth = void 0;
const Staff_js_1 = require("../models/Staff.js");
const Attendance_js_1 = require("../models/Attendance.js");
const LoanAdvance_js_1 = require("../models/LoanAdvance.js");
const Payment_js_1 = require("../models/Payment.js");
const Settings_js_1 = require("../models/Settings.js");
const db_js_1 = require("../config/db.js");
const settingsController_js_1 = require("./settingsController.js");
const getHealth = (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Shree Lakshmi Bhavan Attendance & Payroll API',
        database: {
            type: (0, db_js_1.isMongoDBConnected)() ? 'MongoDB' : 'Local Fallback Storage',
            connected: (0, db_js_1.isMongoDBConnected)(),
            fallbackActive: (0, db_js_1.isUsingFallback)(),
        },
    });
};
exports.getHealth = getHealth;
const resetAllData = async (_req, res) => {
    try {
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.staff = [];
            db_js_1.fallbackStore.attendance = [];
            db_js_1.fallbackStore.loanAdvances = [];
            db_js_1.fallbackStore.payments = [];
            db_js_1.fallbackStore.settings = { ...settingsController_js_1.defaultSettings };
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: 'All database records wiped clean for fresh start.' });
        }
        await Promise.all([
            Staff_js_1.StaffModel.deleteMany({}),
            Attendance_js_1.AttendanceModel.deleteMany({}),
            LoanAdvance_js_1.LoanAdvanceModel.deleteMany({}),
            Payment_js_1.PaymentModel.deleteMany({}),
            Settings_js_1.SettingsModel.deleteMany({}),
        ]);
        await Settings_js_1.SettingsModel.create(settingsController_js_1.defaultSettings);
        res.json({ success: true, message: 'All database records wiped clean for fresh start.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.resetAllData = resetAllData;
const exportAllData = async (_req, res) => {
    try {
        if ((0, db_js_1.isUsingFallback)()) {
            return res.json({
                version: '1.0',
                exportedAt: new Date().toISOString(),
                data: db_js_1.fallbackStore,
            });
        }
        const [staff, attendance, loanAdvances, payments, settings] = await Promise.all([
            Staff_js_1.StaffModel.find().lean(),
            Attendance_js_1.AttendanceModel.find().lean(),
            LoanAdvance_js_1.LoanAdvanceModel.find().lean(),
            Payment_js_1.PaymentModel.find().lean(),
            Settings_js_1.SettingsModel.findOne().lean(),
        ]);
        res.json({
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: {
                staff,
                attendance,
                loanAdvances,
                payments,
                settings: settings || settingsController_js_1.defaultSettings,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.exportAllData = exportAllData;
const importAllData = async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ success: false, message: 'Payload data is required for import.' });
        }
        const safeStaff = Array.isArray(data.staff) ? data.staff : [];
        const safeAttendance = Array.isArray(data.attendance) ? data.attendance : [];
        const safeLoanAdvances = Array.isArray(data.loanAdvances) ? data.loanAdvances : [];
        const safePayments = Array.isArray(data.payments) ? data.payments : [];
        const safeSettings = data.settings || settingsController_js_1.defaultSettings;
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.staff = safeStaff;
            db_js_1.fallbackStore.attendance = safeAttendance;
            db_js_1.fallbackStore.loanAdvances = safeLoanAdvances;
            db_js_1.fallbackStore.payments = safePayments;
            db_js_1.fallbackStore.settings = safeSettings;
            (0, db_js_1.saveFallbackToDisk)();
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
            Staff_js_1.StaffModel.deleteMany({}),
            Attendance_js_1.AttendanceModel.deleteMany({}),
            LoanAdvance_js_1.LoanAdvanceModel.deleteMany({}),
            Payment_js_1.PaymentModel.deleteMany({}),
            Settings_js_1.SettingsModel.deleteMany({}),
        ]);
        if (safeStaff.length > 0)
            await Staff_js_1.StaffModel.insertMany(safeStaff);
        if (safeAttendance.length > 0)
            await Attendance_js_1.AttendanceModel.insertMany(safeAttendance);
        if (safeLoanAdvances.length > 0)
            await LoanAdvance_js_1.LoanAdvanceModel.insertMany(safeLoanAdvances);
        if (safePayments.length > 0)
            await Payment_js_1.PaymentModel.insertMany(safePayments);
        await Settings_js_1.SettingsModel.create(safeSettings);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.importAllData = importAllData;

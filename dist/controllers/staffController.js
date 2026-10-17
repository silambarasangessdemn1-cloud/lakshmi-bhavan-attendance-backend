"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaff = exports.updateStaff = exports.createStaff = exports.getStaffById = exports.getStaff = void 0;
const Staff_js_1 = require("../models/Staff.js");
const Attendance_js_1 = require("../models/Attendance.js");
const Payment_js_1 = require("../models/Payment.js");
const LoanAdvance_js_1 = require("../models/LoanAdvance.js");
const db_js_1 = require("../config/db.js");
const getStaff = async (_req, res) => {
    try {
        if ((0, db_js_1.isUsingFallback)()) {
            return res.json({ success: true, count: db_js_1.fallbackStore.staff.length, data: db_js_1.fallbackStore.staff });
        }
        const staff = await Staff_js_1.StaffModel.find().sort({ createdAt: -1 });
        res.json({ success: true, count: staff.length, data: staff });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStaff = getStaff;
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            const found = db_js_1.fallbackStore.staff.find((s) => s.id === id);
            if (!found)
                return res.status(404).json({ success: false, message: 'Staff member not found' });
            return res.json({ success: true, data: found });
        }
        const staff = await Staff_js_1.StaffModel.findOne({ id });
        if (!staff)
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        res.json({ success: true, data: staff });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStaffById = getStaffById;
const createStaff = async (req, res) => {
    try {
        const body = req.body;
        const trimmedId = (body.id || '').trim();
        const trimmedName = (body.name || '').trim();
        if (!trimmedId || !trimmedName) {
            return res.status(400).json({ success: false, message: 'Staff ID and Name are required.' });
        }
        const payload = {
            ...body,
            id: trimmedId,
            name: trimmedName,
            wage: Number(body.wage) || 0,
            otRate: Number(body.otRate) || 0,
            loanStart: Math.max(0, Number(body.loanStart) || 0),
            status: body.status || 'active',
            joiningDate: body.joiningDate || new Date().toISOString().slice(0, 10),
        };
        if ((0, db_js_1.isUsingFallback)()) {
            if (db_js_1.fallbackStore.staff.some((s) => s.id.toLowerCase() === trimmedId.toLowerCase())) {
                return res.status(409).json({ success: false, message: `Staff ID "${trimmedId}" already exists.` });
            }
            db_js_1.fallbackStore.staff.push(payload);
            (0, db_js_1.saveFallbackToDisk)();
            return res.status(201).json({ success: true, data: payload });
        }
        const existing = await Staff_js_1.StaffModel.findOne({ id: trimmedId });
        if (existing) {
            return res.status(409).json({ success: false, message: `Staff ID "${trimmedId}" already exists.` });
        }
        const created = await Staff_js_1.StaffModel.create(payload);
        res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createStaff = createStaff;
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const newId = updates.id ? updates.id.trim() : id;
        if ((0, db_js_1.isUsingFallback)()) {
            const idx = db_js_1.fallbackStore.staff.findIndex((s) => s.id === id);
            if (idx === -1)
                return res.status(404).json({ success: false, message: 'Staff member not found.' });
            if (newId !== id && db_js_1.fallbackStore.staff.some((s) => s.id.toLowerCase() === newId.toLowerCase())) {
                return res.status(409).json({ success: false, message: `Staff ID "${newId}" already in use.` });
            }
            db_js_1.fallbackStore.staff[idx] = { ...db_js_1.fallbackStore.staff[idx], ...updates, id: newId };
            if (newId !== id) {
                db_js_1.fallbackStore.attendance = db_js_1.fallbackStore.attendance.map((a) => a.staffId === id ? { ...a, staffId: newId, id: `att-${newId}-${a.date}` } : a);
                db_js_1.fallbackStore.payments = db_js_1.fallbackStore.payments.map((p) => p.staffId === id ? { ...p, staffId: newId, staffName: updates.name || p.staffName } : p);
                db_js_1.fallbackStore.loanAdvances = db_js_1.fallbackStore.loanAdvances.map((l) => l.staffId === id ? { ...l, staffId: newId } : l);
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, data: db_js_1.fallbackStore.staff[idx] });
        }
        if (newId !== id) {
            const conflict = await Staff_js_1.StaffModel.findOne({ id: newId });
            if (conflict) {
                return res.status(409).json({ success: false, message: `Staff ID "${newId}" already in use.` });
            }
        }
        const updated = await Staff_js_1.StaffModel.findOneAndUpdate({ id }, { ...updates, id: newId }, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        if (newId !== id) {
            await Attendance_js_1.AttendanceModel.updateMany({ staffId: id }, { staffId: newId });
            await Payment_js_1.PaymentModel.updateMany({ staffId: id }, { staffId: newId, staffName: updates.name || updated.name });
            await LoanAdvance_js_1.LoanAdvanceModel.updateMany({ staffId: id }, { staffId: newId });
        }
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateStaff = updateStaff;
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.staff = db_js_1.fallbackStore.staff.filter((s) => s.id !== id);
            db_js_1.fallbackStore.attendance = db_js_1.fallbackStore.attendance.filter((a) => a.staffId !== id);
            db_js_1.fallbackStore.payments = db_js_1.fallbackStore.payments.filter((p) => p.staffId !== id);
            db_js_1.fallbackStore.loanAdvances = db_js_1.fallbackStore.loanAdvances.filter((l) => l.staffId !== id);
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: `Staff member ${id} and associated records deleted.` });
        }
        await Staff_js_1.StaffModel.findOneAndDelete({ id });
        await Attendance_js_1.AttendanceModel.deleteMany({ staffId: id });
        await Payment_js_1.PaymentModel.deleteMany({ staffId: id });
        await LoanAdvance_js_1.LoanAdvanceModel.deleteMany({ staffId: id });
        res.json({ success: true, message: `Staff member ${id} and associated records deleted.` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteStaff = deleteStaff;

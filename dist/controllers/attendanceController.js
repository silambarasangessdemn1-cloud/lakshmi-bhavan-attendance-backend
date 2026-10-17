"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttendance = exports.markAllPresentForDate = exports.replaceDateAttendance = exports.saveBulkAttendance = exports.saveAttendanceRecord = exports.getAttendance = void 0;
const Attendance_js_1 = require("../models/Attendance.js");
const Staff_js_1 = require("../models/Staff.js");
const db_js_1 = require("../config/db.js");
const getAttendance = async (req, res) => {
    try {
        const { date, month, staffId } = req.query;
        if ((0, db_js_1.isUsingFallback)()) {
            let filtered = [...db_js_1.fallbackStore.attendance];
            if (date)
                filtered = filtered.filter((a) => a.date === date);
            if (month)
                filtered = filtered.filter((a) => a.date.startsWith(month));
            if (staffId)
                filtered = filtered.filter((a) => a.staffId === staffId);
            return res.json({ success: true, count: filtered.length, data: filtered });
        }
        const query = {};
        if (date)
            query.date = date;
        if (month)
            query.date = { $regex: `^${month}` };
        if (staffId)
            query.staffId = staffId;
        const records = await Attendance_js_1.AttendanceModel.find(query).sort({ date: 1 });
        res.json({ success: true, count: records.length, data: records });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAttendance = getAttendance;
const saveAttendanceRecord = async (req, res) => {
    try {
        const body = req.body;
        const { staffId, date, status, inTime, outTime, ot, notes } = body;
        if (!staffId || !date || !status) {
            return res.status(400).json({ success: false, message: 'staffId, date, and status are required.' });
        }
        const id = body.id || `att-${staffId}-${date}`;
        const payload = {
            id,
            staffId,
            date,
            status,
            inTime: inTime || (status === 'present' || status === 'half' ? '09:00' : undefined),
            outTime: outTime || (status === 'present' ? '18:00' : status === 'half' ? '13:30' : undefined),
            ot: Number(ot) || 0,
            notes: notes || '',
        };
        if ((0, db_js_1.isUsingFallback)()) {
            const idx = db_js_1.fallbackStore.attendance.findIndex((a) => a.staffId === staffId && a.date === date);
            if (idx >= 0) {
                db_js_1.fallbackStore.attendance[idx] = { ...db_js_1.fallbackStore.attendance[idx], ...payload };
            }
            else {
                db_js_1.fallbackStore.attendance.push(payload);
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, data: payload });
        }
        const record = await Attendance_js_1.AttendanceModel.findOneAndUpdate({ staffId, date }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.json({ success: true, data: record });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.saveAttendanceRecord = saveAttendanceRecord;
const saveBulkAttendance = async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'Array of records is required.' });
        }
        if ((0, db_js_1.isUsingFallback)()) {
            const map = new Map();
            db_js_1.fallbackStore.attendance.forEach((r) => map.set(`${r.staffId}_${r.date}`, r));
            records.forEach((r) => {
                const id = r.id || `att-${r.staffId}-${r.date}`;
                map.set(`${r.staffId}_${r.date}`, { ...r, id });
            });
            db_js_1.fallbackStore.attendance = Array.from(map.values());
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: `Processed ${records.length} records.` });
        }
        const ops = records.map((r) => ({
            updateOne: {
                filter: { staffId: r.staffId, date: r.date },
                update: { $set: { ...r, id: r.id || `att-${r.staffId}-${r.date}` } },
                upsert: true,
            },
        }));
        await Attendance_js_1.AttendanceModel.bulkWrite(ops);
        res.json({ success: true, message: `Bulk updated ${records.length} attendance records.` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.saveBulkAttendance = saveBulkAttendance;
const replaceDateAttendance = async (req, res) => {
    try {
        const { date, records } = req.body;
        if (!date)
            return res.status(400).json({ success: false, message: 'Date is required.' });
        const safeRecords = Array.isArray(records) ? records : [];
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.attendance = db_js_1.fallbackStore.attendance.filter((a) => a.date !== date);
            safeRecords.forEach((r) => {
                db_js_1.fallbackStore.attendance.push({
                    ...r,
                    id: r.id || `att-${r.staffId}-${date}`,
                    date,
                });
            });
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: `Replaced attendance for ${date}.`, count: safeRecords.length });
        }
        await Attendance_js_1.AttendanceModel.deleteMany({ date });
        if (safeRecords.length > 0) {
            const formatted = safeRecords.map((r) => ({
                ...r,
                id: r.id || `att-${r.staffId}-${date}`,
                date,
            }));
            await Attendance_js_1.AttendanceModel.insertMany(formatted);
        }
        res.json({ success: true, message: `Replaced attendance for ${date}.`, count: safeRecords.length });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.replaceDateAttendance = replaceDateAttendance;
const markAllPresentForDate = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date)
            return res.status(400).json({ success: false, message: 'Date is required.' });
        let activeStaff = [];
        if ((0, db_js_1.isUsingFallback)()) {
            activeStaff = db_js_1.fallbackStore.staff.filter((s) => s.status !== 'inactive');
        }
        else {
            activeStaff = await Staff_js_1.StaffModel.find({ status: { $ne: 'inactive' } });
        }
        const records = activeStaff.map((s) => ({
            id: `att-${s.id}-${date}`,
            staffId: s.id,
            date,
            status: 'present',
            inTime: '09:00',
            outTime: '18:00',
            ot: 0,
            notes: 'Marked present (All-in)',
        }));
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.attendance = db_js_1.fallbackStore.attendance.filter((a) => a.date !== date);
            db_js_1.fallbackStore.attendance.push(...records);
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, count: records.length, data: records });
        }
        await Attendance_js_1.AttendanceModel.deleteMany({ date });
        const inserted = await Attendance_js_1.AttendanceModel.insertMany(records);
        res.json({ success: true, count: inserted.length, data: inserted });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAllPresentForDate = markAllPresentForDate;
const deleteAttendance = async (req, res) => {
    try {
        const { staffId, date } = req.query;
        if (!staffId || !date) {
            return res.status(400).json({ success: false, message: 'staffId and date are required.' });
        }
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.attendance = db_js_1.fallbackStore.attendance.filter((a) => !(a.staffId === staffId && a.date === date));
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: `Deleted attendance for ${staffId} on ${date}.` });
        }
        await Attendance_js_1.AttendanceModel.deleteOne({ staffId, date });
        res.json({ success: true, message: `Deleted attendance for ${staffId} on ${date}.` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteAttendance = deleteAttendance;

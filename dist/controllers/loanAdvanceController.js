"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLoanAdvanceEntry = exports.createLoanAdvanceEntry = exports.getLoanAdvanceEntries = void 0;
const LoanAdvance_js_1 = require("../models/LoanAdvance.js");
const db_js_1 = require("../config/db.js");
const getLoanAdvanceEntries = async (req, res) => {
    try {
        const { staffId, month, type } = req.query;
        if ((0, db_js_1.isUsingFallback)()) {
            let filtered = [...db_js_1.fallbackStore.loanAdvances];
            if (staffId)
                filtered = filtered.filter((l) => l.staffId === staffId);
            if (month)
                filtered = filtered.filter((l) => l.month === month);
            if (type)
                filtered = filtered.filter((l) => l.type === type);
            filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return res.json({ success: true, count: filtered.length, data: filtered });
        }
        const query = {};
        if (staffId)
            query.staffId = staffId;
        if (month)
            query.month = month;
        if (type)
            query.type = type;
        const entries = await LoanAdvance_js_1.LoanAdvanceModel.find(query).sort({ timestamp: -1 });
        res.json({ success: true, count: entries.length, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLoanAdvanceEntries = getLoanAdvanceEntries;
const createLoanAdvanceEntry = async (req, res) => {
    try {
        const body = req.body;
        const { staffId, type, amount, date, month, notes } = body;
        if (!staffId || !type || amount === undefined || !date) {
            return res.status(400).json({ success: false, message: 'staffId, type, amount, and date are required.' });
        }
        const monthStr = month || date.slice(0, 7);
        const id = body.id || `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const timestamp = body.timestamp || Date.now();
        const payload = {
            id,
            staffId,
            type,
            amount: Number(amount) || 0,
            date,
            month: monthStr,
            notes: notes || '',
            timestamp,
        };
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.loanAdvances.unshift(payload);
            (0, db_js_1.saveFallbackToDisk)();
            return res.status(201).json({ success: true, data: payload });
        }
        const created = await LoanAdvance_js_1.LoanAdvanceModel.create(payload);
        res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createLoanAdvanceEntry = createLoanAdvanceEntry;
const deleteLoanAdvanceEntry = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.loanAdvances = db_js_1.fallbackStore.loanAdvances.filter((l) => l.id !== id);
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: `Deleted entry ${id}.` });
        }
        await LoanAdvance_js_1.LoanAdvanceModel.findOneAndDelete({ id });
        res.json({ success: true, message: `Deleted entry ${id}.` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteLoanAdvanceEntry = deleteLoanAdvanceEntry;

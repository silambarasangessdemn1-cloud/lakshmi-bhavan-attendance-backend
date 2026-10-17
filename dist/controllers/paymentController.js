"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.recordPayment = exports.getPayments = void 0;
const Payment_js_1 = require("../models/Payment.js");
const db_js_1 = require("../config/db.js");
const getPayments = async (req, res) => {
    try {
        const { staffId, month } = req.query;
        if ((0, db_js_1.isUsingFallback)()) {
            let filtered = [...db_js_1.fallbackStore.payments];
            if (staffId)
                filtered = filtered.filter((p) => p.staffId === staffId);
            if (month)
                filtered = filtered.filter((p) => p.month === month);
            filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return res.json({ success: true, count: filtered.length, data: filtered });
        }
        const query = {};
        if (staffId)
            query.staffId = staffId;
        if (month)
            query.month = month;
        const payments = await Payment_js_1.PaymentModel.find(query).sort({ timestamp: -1 });
        res.json({ success: true, count: payments.length, data: payments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPayments = getPayments;
const recordPayment = async (req, res) => {
    try {
        const body = req.body;
        const { staffId, month, staffName, gross, net } = body;
        if (!staffId || !month || !staffName) {
            return res.status(400).json({ success: false, message: 'staffId, month, and staffName are required.' });
        }
        const id = body.id || `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const timestamp = body.timestamp || Date.now();
        const payload = {
            ...body,
            id,
            timestamp,
            gross: Number(gross) || 0,
            net: Number(net) || 0,
            advance: Number(body.advance) || 0,
            loanDeduct: Number(body.loanDeduct) || 0,
            loanAdded: Number(body.loanAdded) || 0,
        };
        if ((0, db_js_1.isUsingFallback)()) {
            // Upsert: replace if existing payment for staffId and month exists to prevent duplicates!
            const existingIdx = db_js_1.fallbackStore.payments.findIndex((p) => p.staffId === staffId && p.month === month);
            if (existingIdx >= 0) {
                db_js_1.fallbackStore.payments[existingIdx] = {
                    ...db_js_1.fallbackStore.payments[existingIdx],
                    ...payload,
                    id: db_js_1.fallbackStore.payments[existingIdx].id || id,
                };
            }
            else {
                db_js_1.fallbackStore.payments.unshift(payload);
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.status(201).json({ success: true, data: payload });
        }
        // MongoDB Upsert on staffId + month to guarantee idempotency and avoid duplicate deductions
        const updated = await Payment_js_1.PaymentModel.findOneAndUpdate({ staffId, month }, { $set: payload }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.status(201).json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.recordPayment = recordPayment;
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.payments = db_js_1.fallbackStore.payments.filter((p) => p.id !== id);
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: `Payment ${id} deleted.` });
        }
        await Payment_js_1.PaymentModel.findOneAndDelete({ id });
        res.json({ success: true, message: `Payment ${id} deleted.` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deletePayment = deletePayment;

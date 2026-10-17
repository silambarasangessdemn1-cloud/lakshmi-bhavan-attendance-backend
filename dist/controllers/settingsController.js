"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSettings = exports.updateSettings = exports.getSettings = exports.defaultSettings = void 0;
const Settings_js_1 = require("../models/Settings.js");
const db_js_1 = require("../config/db.js");
exports.defaultSettings = {
    companyName: 'Shree Lakshmi Bhavan',
    tagline: 'Staff Salary & Attendance Manager',
    address: '',
    phone: '',
    currency: 'INR',
    currencySymbol: '₹',
};
const getSettings = async (_req, res) => {
    try {
        if ((0, db_js_1.isUsingFallback)()) {
            return res.json({ success: true, data: db_js_1.fallbackStore.settings || exports.defaultSettings });
        }
        let settings = await Settings_js_1.SettingsModel.findOne();
        if (!settings) {
            settings = await Settings_js_1.SettingsModel.create(exports.defaultSettings);
        }
        res.json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.settings = { ...db_js_1.fallbackStore.settings, ...updates };
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, data: db_js_1.fallbackStore.settings });
        }
        let settings = await Settings_js_1.SettingsModel.findOne();
        if (!settings) {
            settings = await Settings_js_1.SettingsModel.create({ ...exports.defaultSettings, ...updates });
        }
        else {
            Object.assign(settings, updates);
            await settings.save();
        }
        res.json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSettings = updateSettings;
const resetSettings = async (_req, res) => {
    try {
        if ((0, db_js_1.isUsingFallback)()) {
            db_js_1.fallbackStore.settings = { ...exports.defaultSettings };
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, data: db_js_1.fallbackStore.settings, message: 'Settings reset to Shree Lakshmi Bhavan defaults.' });
        }
        await Settings_js_1.SettingsModel.deleteMany({});
        const created = await Settings_js_1.SettingsModel.create(exports.defaultSettings);
        res.json({ success: true, data: created, message: 'Settings reset to Shree Lakshmi Bhavan defaults.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.resetSettings = resetSettings;

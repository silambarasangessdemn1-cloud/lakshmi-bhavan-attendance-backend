"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = seedInitialData;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Settings_js_1 = require("../models/Settings.js");
const Branch_js_1 = require("../models/Branch.js");
const User_js_1 = require("../models/User.js");
const db_js_1 = require("../config/db.js");
const settingsController_js_1 = require("../controllers/settingsController.js");
async function seedInitialData() {
    try {
        const hashedSuperPassword = bcryptjs_1.default.hashSync('admin123', 10);
        const defaultSuperAdmin = {
            id: 'usr-superadmin',
            username: 'superadmin',
            email: 'superadmin@lakshmibhavan.com',
            password: hashedSuperPassword,
            name: 'Super Administrator',
            role: 'superadmin',
            branchId: null,
            phone: '+91 90000 00001',
            status: 'active',
        };
        if ((0, db_js_1.isUsingFallback)()) {
            if (!db_js_1.fallbackStore.settings || !db_js_1.fallbackStore.settings.companyName) {
                db_js_1.fallbackStore.settings = { ...settingsController_js_1.defaultSettings };
            }
            // Remove any hardcoded default branch (e.g. branch-main)
            if (Array.isArray(db_js_1.fallbackStore.branches)) {
                db_js_1.fallbackStore.branches = db_js_1.fallbackStore.branches.filter((b) => b.id !== 'branch-main');
            }
            else {
                db_js_1.fallbackStore.branches = [];
            }
            // Remove any hardcoded branchadmin user
            if (Array.isArray(db_js_1.fallbackStore.users)) {
                db_js_1.fallbackStore.users = db_js_1.fallbackStore.users.filter((u) => u.username !== 'branchadmin' && u.branchId !== 'branch-main');
            }
            else {
                db_js_1.fallbackStore.users = [];
            }
            // Ensure master Super Admin exists
            const hasSuper = db_js_1.fallbackStore.users.some((u) => u.username === 'superadmin');
            if (!hasSuper) {
                db_js_1.fallbackStore.users.push({ ...defaultSuperAdmin, createdAt: new Date(), updatedAt: new Date() });
                console.log('[Seed] Initialized Master Super Admin into fallback store.');
            }
            (0, db_js_1.saveFallbackToDisk)();
            return;
        }
        // MongoDB initialization
        const settingsCount = await Settings_js_1.SettingsModel.countDocuments();
        if (settingsCount === 0) {
            await Settings_js_1.SettingsModel.create(settingsController_js_1.defaultSettings);
            console.log('[Seed] Seeded default company settings into MongoDB.');
        }
        // Remove any hardcoded default branch (branch-main)
        await Branch_js_1.BranchModel.deleteMany({ id: 'branch-main' });
        // Remove legacy default branchadmin if present
        await User_js_1.UserModel.deleteMany({
            $or: [{ username: 'branchadmin' }, { branchId: 'branch-main' }],
        });
        // Ensure master Super Admin exists
        const superAdminExists = await User_js_1.UserModel.findOne({ username: 'superadmin' });
        if (!superAdminExists) {
            await User_js_1.UserModel.create(defaultSuperAdmin);
            console.log('[Seed] Seeded master Super Admin (username: superadmin, pass: admin123).');
        }
    }
    catch (err) {
        console.warn('[Seed] Notice on data initialization:', err.message);
    }
}

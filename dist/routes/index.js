"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const branchRoutes_js_1 = __importDefault(require("./branchRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./userRoutes.js"));
const staffRoutes_js_1 = __importDefault(require("./staffRoutes.js"));
const attendanceRoutes_js_1 = __importDefault(require("./attendanceRoutes.js"));
const loanAdvanceRoutes_js_1 = __importDefault(require("./loanAdvanceRoutes.js"));
const paymentRoutes_js_1 = __importDefault(require("./paymentRoutes.js"));
const settingsRoutes_js_1 = __importDefault(require("./settingsRoutes.js"));
const adminRoutes_js_1 = __importDefault(require("./adminRoutes.js"));
const router = (0, express_1.Router)();
// Authentication and Multi-Branch Management
router.use('/auth', authRoutes_js_1.default);
router.use('/branches', branchRoutes_js_1.default);
router.use('/users', userRoutes_js_1.default);
// Core Modules
router.use('/staff', staffRoutes_js_1.default);
router.use('/attendance', attendanceRoutes_js_1.default);
router.use('/loans-advances', loanAdvanceRoutes_js_1.default);
router.use('/payments', paymentRoutes_js_1.default);
router.use('/settings', settingsRoutes_js_1.default);
router.use('/admin', adminRoutes_js_1.default);
exports.default = router;

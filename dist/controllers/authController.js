"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const Branch_js_1 = require("../models/Branch.js");
const db_js_1 = require("../config/db.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }
        const cleanUsername = username.trim().toLowerCase();
        let user = null;
        let branch = null;
        if ((0, db_js_1.isUsingFallback)()) {
            user = db_js_1.fallbackStore.users.find((u) => (u.username || '').toLowerCase() === cleanUsername && u.status !== 'inactive');
            if (user && user.branchId) {
                branch = db_js_1.fallbackStore.branches.find((b) => b.id === user.branchId) || null;
            }
        }
        else {
            user = await User_js_1.UserModel.findOne({ username: cleanUsername, status: 'active' }).lean();
            if (user && user.branchId) {
                branch = await Branch_js_1.BranchModel.findOne({ id: user.branchId }).lean();
            }
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
        const isMatch = bcryptjs_1.default.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
        const payload = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            branchId: user.branchId || null,
        };
        const token = jsonwebtoken_1.default.sign(payload, authMiddleware_js_1.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    branchId: user.branchId || null,
                    phone: user.phone || '',
                },
                branch: branch
                    ? {
                        id: branch.id,
                        name: branch.name,
                        code: branch.code,
                        location: branch.location || '',
                    }
                    : null,
            },
        });
    }
    catch (error) {
        console.error('[Auth Error] Login failure:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        let user = null;
        let branch = null;
        if ((0, db_js_1.isUsingFallback)()) {
            user = db_js_1.fallbackStore.users.find((u) => u.id === req.user?.id);
            if (user && user.branchId) {
                branch = db_js_1.fallbackStore.branches.find((b) => b.id === user.branchId) || null;
            }
        }
        else {
            user = await User_js_1.UserModel.findOne({ id: req.user.id }).lean();
            if (user && user.branchId) {
                branch = await Branch_js_1.BranchModel.findOne({ id: user.branchId }).lean();
            }
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    branchId: user.branchId || null,
                    phone: user.phone || '',
                },
                branch: branch
                    ? {
                        id: branch.id,
                        name: branch.name,
                        code: branch.code,
                        location: branch.location || '',
                    }
                    : null,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMe = getMe;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreUser = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_js_1 = require("../models/User.js");
const Branch_js_1 = require("../models/Branch.js");
const db_js_1 = require("../config/db.js");
function sanitizeUser(user, branches = []) {
    const branch = user.branchId ? branches.find((b) => b.id === user.branchId) : null;
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        branchId: user.branchId || null,
        branchName: branch ? branch.name : null,
        phone: user.phone || '',
        status: user.status || 'active',
        isDeleted: !!user.isDeleted,
        deletedAt: user.deletedAt || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
const getUsers = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const deletedOnly = req.query.deletedOnly === 'true';
        if ((0, db_js_1.isUsingFallback)()) {
            const branches = db_js_1.fallbackStore.branches || [];
            let list = db_js_1.fallbackStore.users || [];
            if (deletedOnly) {
                list = list.filter((u) => u.isDeleted === true);
            }
            else if (!includeDeleted) {
                list = list.filter((u) => !u.isDeleted);
            }
            const sanitized = list.map((u) => sanitizeUser(u, branches));
            return res.json({ success: true, count: sanitized.length, data: sanitized });
        }
        const filter = { username: { $exists: true, $nin: ['', null] } };
        if (deletedOnly) {
            filter.isDeleted = true;
        }
        else if (!includeDeleted) {
            filter.isDeleted = { $ne: true };
        }
        const [users, branches] = await Promise.all([
            User_js_1.UserModel.find(filter).sort({ createdAt: -1 }).lean(),
            Branch_js_1.BranchModel.find().lean(),
        ]);
        const sanitized = users.map((u) => sanitizeUser(u, branches));
        res.json({ success: true, count: sanitized.length, data: sanitized });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { username, password, name, role = 'admin', branchId, phone } = req.body;
        if (!username || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and full name are required.',
            });
        }
        const cleanUsername = username.trim().toLowerCase();
        const cleanRole = role === 'superadmin' ? 'superadmin' : 'admin';
        // If role is admin, require a valid branch
        if (cleanRole === 'admin' && !branchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch selection is required when creating a Branch Admin.',
            });
        }
        const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const newUser = {
            id,
            username: cleanUsername,
            email: (req.body.email || `${cleanUsername}@lakshmibhavan.com`).trim().toLowerCase(),
            password: hashedPassword,
            name: name.trim(),
            role: cleanRole,
            branchId: cleanRole === 'admin' ? branchId : null,
            phone: (phone || '').trim(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if ((0, db_js_1.isUsingFallback)()) {
            if (!db_js_1.fallbackStore.users)
                db_js_1.fallbackStore.users = [];
            const exists = db_js_1.fallbackStore.users.some((u) => (u.username || '').toLowerCase() === cleanUsername);
            if (exists) {
                return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
            }
            db_js_1.fallbackStore.users.push(newUser);
            (0, db_js_1.saveFallbackToDisk)();
            const branches = db_js_1.fallbackStore.branches || [];
            return res.status(201).json({
                success: true,
                message: 'User created successfully.',
                data: sanitizeUser(newUser, branches),
            });
        }
        const exists = await User_js_1.UserModel.findOne({ username: cleanUsername });
        if (exists) {
            return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
        }
        const created = await User_js_1.UserModel.create(newUser);
        const branches = await Branch_js_1.BranchModel.find().lean();
        res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data: sanitizeUser(created, branches),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, branchId, phone, status, password } = req.body;
        const updates = { updatedAt: new Date() };
        if (name)
            updates.name = name.trim();
        if (role)
            updates.role = role === 'superadmin' ? 'superadmin' : 'admin';
        if (branchId !== undefined)
            updates.branchId = branchId;
        if (phone !== undefined)
            updates.phone = phone.trim();
        if (status)
            updates.status = status;
        if (password && password.trim().length > 0) {
            updates.password = bcryptjs_1.default.hashSync(password.trim(), 10);
        }
        if ((0, db_js_1.isUsingFallback)()) {
            const idx = (db_js_1.fallbackStore.users || []).findIndex((u) => u.id === id);
            if (idx === -1)
                return res.status(404).json({ success: false, message: 'User not found.' });
            db_js_1.fallbackStore.users[idx] = { ...db_js_1.fallbackStore.users[idx], ...updates };
            (0, db_js_1.saveFallbackToDisk)();
            const branches = db_js_1.fallbackStore.branches || [];
            return res.json({
                success: true,
                message: 'User updated successfully.',
                data: sanitizeUser(db_js_1.fallbackStore.users[idx], branches),
            });
        }
        const updated = await User_js_1.UserModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
        if (!updated)
            return res.status(404).json({ success: false, message: 'User not found.' });
        const branches = await Branch_js_1.BranchModel.find().lean();
        res.json({
            success: true,
            message: 'User updated successfully.',
            data: sanitizeUser(updated, branches),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const permanent = req.query.permanent === 'true';
        if (req.user?.id === id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        }
        if ((0, db_js_1.isUsingFallback)()) {
            const target = (db_js_1.fallbackStore.users || []).find((u) => u.id === id);
            if (!target)
                return res.status(404).json({ success: false, message: 'User not found.' });
            if (target.role === 'superadmin') {
                const superCount = db_js_1.fallbackStore.users.filter((u) => u.role === 'superadmin' && !u.isDeleted).length;
                if (superCount <= 1) {
                    return res.status(400).json({ success: false, message: 'Cannot delete the only active Super Admin.' });
                }
            }
            if (permanent) {
                db_js_1.fallbackStore.users = db_js_1.fallbackStore.users.filter((u) => u.id !== id);
            }
            else {
                target.isDeleted = true;
                target.deletedAt = new Date();
                target.status = 'inactive';
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({
                success: true,
                message: permanent ? 'User account permanently removed.' : 'User moved to trash. Can be recovered anytime.',
            });
        }
        const target = await User_js_1.UserModel.findOne({ id });
        if (!target)
            return res.status(404).json({ success: false, message: 'User not found.' });
        if (target.role === 'superadmin') {
            const superCount = await User_js_1.UserModel.countDocuments({ role: 'superadmin', isDeleted: { $ne: true } });
            if (superCount <= 1) {
                return res.status(400).json({ success: false, message: 'Cannot delete the only active Super Admin.' });
            }
        }
        if (permanent) {
            await User_js_1.UserModel.deleteOne({ id });
        }
        else {
            await User_js_1.UserModel.updateOne({ id }, { isDeleted: true, deletedAt: new Date(), status: 'inactive' });
        }
        res.json({
            success: true,
            message: permanent ? 'User account permanently removed.' : 'User moved to trash. Can be recovered anytime.',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteUser = deleteUser;
const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            const target = (db_js_1.fallbackStore.users || []).find((u) => u.id === id);
            if (!target)
                return res.status(404).json({ success: false, message: 'User not found.' });
            target.isDeleted = false;
            target.deletedAt = null;
            target.status = 'active';
            (0, db_js_1.saveFallbackToDisk)();
            const branches = db_js_1.fallbackStore.branches || [];
            return res.json({
                success: true,
                message: `Admin ${target.name} restored successfully without any data loss.`,
                data: sanitizeUser(target, branches),
            });
        }
        const updated = await User_js_1.UserModel.findOneAndUpdate({ id }, { isDeleted: false, deletedAt: null, status: 'active' }, { new: true }).lean();
        if (!updated)
            return res.status(404).json({ success: false, message: 'User not found.' });
        const branches = await Branch_js_1.BranchModel.find().lean();
        res.json({
            success: true,
            message: `Admin ${updated.name} restored successfully without any data loss.`,
            data: sanitizeUser(updated, branches),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.restoreUser = restoreUser;

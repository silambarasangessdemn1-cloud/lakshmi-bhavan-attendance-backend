"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBranch = exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranchById = exports.getBranches = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Branch_js_1 = require("../models/Branch.js");
const Staff_js_1 = require("../models/Staff.js");
const User_js_1 = require("../models/User.js");
const db_js_1 = require("../config/db.js");
const getBranches = async (req, res) => {
    try {
        const user = req.user;
        const includeDeleted = req.query.includeDeleted === 'true';
        const deletedOnly = req.query.deletedOnly === 'true';
        const forTransfer = req.query.forTransfer === 'true';
        if ((0, db_js_1.isUsingFallback)()) {
            let branches = db_js_1.fallbackStore.branches || [];
            if (deletedOnly) {
                branches = branches.filter((b) => b.isDeleted === true);
            }
            else if (!includeDeleted) {
                branches = branches.filter((b) => !b.isDeleted);
            }
            // If not querying for transfers, branch admin sees only their branch
            if (!forTransfer && user && user.role !== 'superadmin' && user.branchId) {
                branches = branches.filter((b) => b.id === user.branchId);
            }
            return res.json({ success: true, count: branches.length, data: branches });
        }
        const query = {};
        if (deletedOnly) {
            query.isDeleted = true;
        }
        else if (!includeDeleted) {
            query.isDeleted = { $ne: true };
        }
        // If not querying for transfers, branch admin sees only their branch
        if (!forTransfer && user && user.role !== 'superadmin' && user.branchId) {
            query.id = user.branchId;
        }
        const branches = await Branch_js_1.BranchModel.find(query).sort({ createdAt: 1 });
        res.json({ success: true, count: branches.length, data: branches });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBranches = getBranches;
const getBranchById = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            const branch = (db_js_1.fallbackStore.branches || []).find((b) => b.id === id);
            if (!branch)
                return res.status(404).json({ success: false, message: 'Branch not found' });
            return res.json({ success: true, data: branch });
        }
        const branch = await Branch_js_1.BranchModel.findOne({ id });
        if (!branch)
            return res.status(404).json({ success: false, message: 'Branch not found' });
        res.json({ success: true, data: branch });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBranchById = getBranchById;
const createBranch = async (req, res) => {
    try {
        const { name, code, location, phone, address, username, password, pin, managerName } = req.body;
        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Branch Name and Code are required.' });
        }
        const cleanCode = code.trim().toUpperCase();
        const branchId = req.body.id || `br_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const newBranch = {
            id: branchId,
            name: name.trim(),
            code: cleanCode,
            location: (location || '').trim(),
            phone: (phone || '').trim(),
            address: (address || '').trim(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Branch Admin Credentials (password or pin)
        const adminPassword = (password || pin || '').trim();
        const cleanUsername = (username || `${cleanCode.toLowerCase()}_admin`).trim().toLowerCase();
        const adminDisplayName = (managerName || `${name.trim()} Manager`).trim();
        if ((0, db_js_1.isUsingFallback)()) {
            if (!db_js_1.fallbackStore.branches)
                db_js_1.fallbackStore.branches = [];
            const exists = db_js_1.fallbackStore.branches.some((b) => b.code.toUpperCase() === cleanCode || b.id === branchId);
            if (exists) {
                return res.status(409).json({ success: false, message: `Branch code "${cleanCode}" already exists.` });
            }
            // Check if username taken
            if (adminPassword && db_js_1.fallbackStore.users.some((u) => u.username === cleanUsername)) {
                return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
            }
            db_js_1.fallbackStore.branches.push(newBranch);
            if (adminPassword) {
                const newUser = {
                    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
                    username: cleanUsername,
                    email: `${cleanUsername}@lakshmibhavan.com`,
                    password: bcryptjs_1.default.hashSync(adminPassword, 10),
                    name: adminDisplayName,
                    role: 'admin',
                    branchId,
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                db_js_1.fallbackStore.users.push(newUser);
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.status(201).json({
                success: true,
                message: 'Branch and Admin Account created successfully.',
                data: newBranch,
                adminCreated: !!adminPassword,
                username: adminPassword ? cleanUsername : undefined,
            });
        }
        const codeExists = await Branch_js_1.BranchModel.findOne({ code: cleanCode });
        if (codeExists) {
            return res.status(409).json({ success: false, message: `Branch code "${cleanCode}" already exists.` });
        }
        if (adminPassword) {
            const userExists = await User_js_1.UserModel.findOne({ username: cleanUsername });
            if (userExists) {
                return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
            }
        }
        const createdBranch = await Branch_js_1.BranchModel.create(newBranch);
        if (adminPassword) {
            await User_js_1.UserModel.create({
                id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
                username: cleanUsername,
                email: `${cleanUsername}@lakshmibhavan.com`,
                password: bcryptjs_1.default.hashSync(adminPassword, 10),
                name: adminDisplayName,
                role: 'admin',
                branchId,
                status: 'active',
            });
        }
        res.status(201).json({
            success: true,
            message: 'Branch and Admin Account created successfully.',
            data: createdBranch,
            adminCreated: !!adminPassword,
            username: adminPassword ? cleanUsername : undefined,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createBranch = createBranch;
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, location, password, pin, username, managerName } = req.body;
        const branchUpdates = { updatedAt: new Date() };
        if (name)
            branchUpdates.name = name.trim();
        if (code)
            branchUpdates.code = code.trim().toUpperCase();
        if (location !== undefined)
            branchUpdates.location = location.trim();
        const newPassword = (password || pin || '').trim();
        if ((0, db_js_1.isUsingFallback)()) {
            const index = (db_js_1.fallbackStore.branches || []).findIndex((b) => b.id === id);
            if (index === -1)
                return res.status(404).json({ success: false, message: 'Branch not found' });
            db_js_1.fallbackStore.branches[index] = {
                ...db_js_1.fallbackStore.branches[index],
                ...branchUpdates,
            };
            // If updating password/pin or username for branch admin
            if (newPassword || username || managerName) {
                const userIdx = (db_js_1.fallbackStore.users || []).findIndex((u) => u.branchId === id);
                if (userIdx >= 0) {
                    if (newPassword)
                        db_js_1.fallbackStore.users[userIdx].password = bcryptjs_1.default.hashSync(newPassword, 10);
                    if (managerName)
                        db_js_1.fallbackStore.users[userIdx].name = managerName.trim();
                    if (username)
                        db_js_1.fallbackStore.users[userIdx].username = username.trim().toLowerCase();
                    db_js_1.fallbackStore.users[userIdx].updatedAt = new Date();
                }
                else if (newPassword) {
                    // Create admin if none existed
                    const cleanUser = (username || `${db_js_1.fallbackStore.branches[index].code.toLowerCase()}_admin`).trim().toLowerCase();
                    db_js_1.fallbackStore.users.push({
                        id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
                        username: cleanUser,
                        email: `${cleanUser}@lakshmibhavan.com`,
                        password: bcryptjs_1.default.hashSync(newPassword, 10),
                        name: managerName || `${db_js_1.fallbackStore.branches[index].name} Manager`,
                        role: 'admin',
                        branchId: id,
                        status: 'active',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({ success: true, message: 'Branch updated.', data: db_js_1.fallbackStore.branches[index] });
        }
        const updated = await Branch_js_1.BranchModel.findOneAndUpdate({ id }, branchUpdates, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Branch not found' });
        // Update or create associated admin password/pin if requested
        if (newPassword || username || managerName) {
            const existingUser = await User_js_1.UserModel.findOne({ branchId: id });
            if (existingUser) {
                const userUpdates = { updatedAt: new Date() };
                if (newPassword)
                    userUpdates.password = bcryptjs_1.default.hashSync(newPassword, 10);
                if (managerName)
                    userUpdates.name = managerName.trim();
                if (username)
                    userUpdates.username = username.trim().toLowerCase();
                await User_js_1.UserModel.updateOne({ _id: existingUser._id }, userUpdates);
            }
            else if (newPassword) {
                const cleanUser = (username || `${updated.code.toLowerCase()}_admin`).trim().toLowerCase();
                await User_js_1.UserModel.create({
                    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
                    username: cleanUser,
                    email: `${cleanUser}@lakshmibhavan.com`,
                    password: bcryptjs_1.default.hashSync(newPassword, 10),
                    name: managerName || `${updated.name} Manager`,
                    role: 'admin',
                    branchId: id,
                    status: 'active',
                });
            }
        }
        res.json({ success: true, message: 'Branch updated.', data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const permanent = req.query.permanent === 'true';
        // Check if staff belong to this branch (unless permanently deleting an already soft-deleted branch or checking active staff)
        let staffCount = 0;
        if ((0, db_js_1.isUsingFallback)()) {
            staffCount = (db_js_1.fallbackStore.staff || []).filter((s) => s.branchId === id).length;
        }
        else {
            staffCount = await Staff_js_1.StaffModel.countDocuments({ branchId: id });
        }
        if (staffCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete branch because it contains ${staffCount} staff member(s). Please reassign or remove them first.`,
            });
        }
        if ((0, db_js_1.isUsingFallback)()) {
            if (permanent) {
                db_js_1.fallbackStore.branches = (db_js_1.fallbackStore.branches || []).filter((b) => b.id !== id);
                db_js_1.fallbackStore.users = (db_js_1.fallbackStore.users || []).filter((u) => u.branchId !== id);
            }
            else {
                const branch = (db_js_1.fallbackStore.branches || []).find((b) => b.id === id);
                if (!branch) {
                    return res.status(404).json({ success: false, message: 'Branch not found.' });
                }
                branch.isDeleted = true;
                branch.deletedAt = new Date();
                branch.status = 'inactive';
                // Also soft-delete admin accounts belonging to this branch
                (db_js_1.fallbackStore.users || []).forEach((u) => {
                    if (u.branchId === id) {
                        u.isDeleted = true;
                        u.deletedAt = new Date();
                        u.status = 'inactive';
                    }
                });
            }
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({
                success: true,
                message: permanent ? 'Branch and associated admin accounts permanently deleted.' : 'Branch moved to trash. Can be recovered anytime.',
            });
        }
        if (permanent) {
            await Promise.all([
                Branch_js_1.BranchModel.deleteOne({ id }),
                User_js_1.UserModel.deleteMany({ branchId: id }),
            ]);
        }
        else {
            const now = new Date();
            await Promise.all([
                Branch_js_1.BranchModel.updateOne({ id }, { isDeleted: true, deletedAt: now, status: 'inactive' }),
                User_js_1.UserModel.updateMany({ branchId: id }, { isDeleted: true, deletedAt: now, status: 'inactive' }),
            ]);
        }
        res.json({
            success: true,
            message: permanent ? 'Branch and associated admin accounts permanently deleted.' : 'Branch moved to trash. Can be recovered anytime.',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteBranch = deleteBranch;
const restoreBranch = async (req, res) => {
    try {
        const { id } = req.params;
        if ((0, db_js_1.isUsingFallback)()) {
            const branch = (db_js_1.fallbackStore.branches || []).find((b) => b.id === id);
            if (!branch) {
                return res.status(404).json({ success: false, message: 'Branch not found in trash.' });
            }
            branch.isDeleted = false;
            branch.deletedAt = null;
            branch.status = 'active';
            // Restore associated admins
            (db_js_1.fallbackStore.users || []).forEach((u) => {
                if (u.branchId === id) {
                    u.isDeleted = false;
                    u.deletedAt = null;
                    u.status = 'active';
                }
            });
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({
                success: true,
                message: 'Branch and associated admin accounts recovered successfully.',
                data: branch,
            });
        }
        const branch = await Branch_js_1.BranchModel.findOne({ id });
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Branch not found in trash.' });
        }
        await Promise.all([
            Branch_js_1.BranchModel.updateOne({ id }, { isDeleted: false, deletedAt: null, status: 'active' }),
            User_js_1.UserModel.updateMany({ branchId: id }, { isDeleted: false, deletedAt: null, status: 'active' }),
        ]);
        const restored = await Branch_js_1.BranchModel.findOne({ id });
        res.json({
            success: true,
            message: 'Branch and associated admin accounts recovered successfully.',
            data: restored,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.restoreBranch = restoreBranch;

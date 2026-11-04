import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/User.js';
import { BranchModel } from '../models/Branch.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

function sanitizeUser(user: any, branches: any[] = []) {
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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const deletedOnly = req.query.deletedOnly === 'true';

    if (isUsingFallback()) {
      const branches = fallbackStore.branches || [];
      let list = fallbackStore.users || [];
      if (deletedOnly) {
        list = list.filter((u) => u.isDeleted === true);
      } else if (!includeDeleted) {
        list = list.filter((u) => !u.isDeleted);
      }
      const sanitized = list.map((u) => sanitizeUser(u, branches));
      return res.json({ success: true, count: sanitized.length, data: sanitized });
    }

    const filter: any = { username: { $exists: true, $nin: ['', null] } };
    if (deletedOnly) {
      filter.isDeleted = true;
    } else if (!includeDeleted) {
      filter.isDeleted = { $ne: true };
    }

    const [users, branches] = await Promise.all([
      UserModel.find(filter).sort({ createdAt: -1 }).lean(),
      BranchModel.find().lean(),
    ]);

    const sanitized = users.map((u) => sanitizeUser(u, branches));
    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
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
    const hashedPassword = bcrypt.hashSync(password, 10);

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

    if (isUsingFallback()) {
      if (!fallbackStore.users) fallbackStore.users = [];
      const exists = fallbackStore.users.some(
        (u) => (u.username || '').toLowerCase() === cleanUsername
      );
      if (exists) {
        return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
      }

      fallbackStore.users.push(newUser);
      saveFallbackToDisk();
      const branches = fallbackStore.branches || [];
      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: sanitizeUser(newUser, branches),
      });
    }

    const exists = await UserModel.findOne({ username: cleanUsername });
    if (exists) {
      return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
    }

    const created = await UserModel.create(newUser);
    const branches = await BranchModel.find().lean();
    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: sanitizeUser(created, branches),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, branchId, phone, status, password } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (name) updates.name = name.trim();
    if (role) updates.role = role === 'superadmin' ? 'superadmin' : 'admin';
    if (branchId !== undefined) updates.branchId = branchId;
    if (phone !== undefined) updates.phone = phone.trim();
    if (status) updates.status = status;
    if (password && password.trim().length > 0) {
      updates.password = bcrypt.hashSync(password.trim(), 10);
    }

    if (isUsingFallback()) {
      const idx = (fallbackStore.users || []).findIndex((u) => u.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });

      fallbackStore.users[idx] = { ...fallbackStore.users[idx], ...updates };
      saveFallbackToDisk();
      const branches = fallbackStore.branches || [];
      return res.json({
        success: true,
        message: 'User updated successfully.',
        data: sanitizeUser(fallbackStore.users[idx], branches),
      });
    }

    const updated = await UserModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });

    const branches = await BranchModel.find().lean();
    res.json({
      success: true,
      message: 'User updated successfully.',
      data: sanitizeUser(updated, branches),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    if (req.user?.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    if (isUsingFallback()) {
      const target = (fallbackStore.users || []).find((u) => u.id === id);
      if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

      if (target.role === 'superadmin') {
        const superCount = fallbackStore.users.filter((u) => u.role === 'superadmin' && !u.isDeleted).length;
        if (superCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot delete the only active Super Admin.' });
        }
      }

      if (permanent) {
        fallbackStore.users = fallbackStore.users.filter((u) => u.id !== id);
      } else {
        target.isDeleted = true;
        target.deletedAt = new Date();
        target.status = 'inactive';
      }
      saveFallbackToDisk();
      return res.json({
        success: true,
        message: permanent ? 'User account permanently removed.' : 'User moved to trash. Can be recovered anytime.',
      });
    }

    const target = await UserModel.findOne({ id });
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    if (target.role === 'superadmin') {
      const superCount = await UserModel.countDocuments({ role: 'superadmin', isDeleted: { $ne: true } });
      if (superCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the only active Super Admin.' });
      }
    }

    if (permanent) {
      await UserModel.deleteOne({ id });
    } else {
      await UserModel.updateOne(
        { id },
        { isDeleted: true, deletedAt: new Date(), status: 'inactive' }
      );
    }

    res.json({
      success: true,
      message: permanent ? 'User account permanently removed.' : 'User moved to trash. Can be recovered anytime.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isUsingFallback()) {
      const target = (fallbackStore.users || []).find((u) => u.id === id);
      if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

      target.isDeleted = false;
      target.deletedAt = null;
      target.status = 'active';
      saveFallbackToDisk();

      const branches = fallbackStore.branches || [];
      return res.json({
        success: true,
        message: `Admin ${target.name} restored successfully without any data loss.`,
        data: sanitizeUser(target, branches),
      });
    }

    const updated = await UserModel.findOneAndUpdate(
      { id },
      { isDeleted: false, deletedAt: null, status: 'active' },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });

    const branches = await BranchModel.find().lean();
    res.json({
      success: true,
      message: `Admin ${updated.name} restored successfully without any data loss.`,
      data: sanitizeUser(updated, branches),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

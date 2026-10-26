import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { BranchModel } from '../models/Branch.js';
import { StaffModel } from '../models/Staff.js';
import { UserModel } from '../models/User.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

export const getBranches = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (isUsingFallback()) {
      let branches = fallbackStore.branches || [];
      if (user && user.role !== 'superadmin' && user.branchId) {
        branches = branches.filter((b) => b.id === user.branchId);
      }
      return res.json({ success: true, count: branches.length, data: branches });
    }

    const query: any = {};
    if (user && user.role !== 'superadmin' && user.branchId) {
      query.id = user.branchId;
    }

    const branches = await BranchModel.find(query).sort({ createdAt: 1 });
    res.json({ success: true, count: branches.length, data: branches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isUsingFallback()) {
      const branch = (fallbackStore.branches || []).find((b) => b.id === id);
      if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
      return res.json({ success: true, data: branch });
    }

    const branch = await BranchModel.findOne({ id });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBranch = async (req: Request, res: Response) => {
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

    if (isUsingFallback()) {
      if (!fallbackStore.branches) fallbackStore.branches = [];
      const exists = fallbackStore.branches.some(
        (b) => b.code.toUpperCase() === cleanCode || b.id === branchId
      );
      if (exists) {
        return res.status(409).json({ success: false, message: `Branch code "${cleanCode}" already exists.` });
      }

      // Check if username taken
      if (adminPassword && fallbackStore.users.some((u) => u.username === cleanUsername)) {
        return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
      }

      fallbackStore.branches.push(newBranch);

      if (adminPassword) {
        const newUser = {
          id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          username: cleanUsername,
          email: `${cleanUsername}@lakshmibhavan.com`,
          password: bcrypt.hashSync(adminPassword, 10),
          name: adminDisplayName,
          role: 'admin' as const,
          branchId,
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        fallbackStore.users.push(newUser);
      }

      saveFallbackToDisk();
      return res.status(201).json({
        success: true,
        message: 'Branch and Admin Account created successfully.',
        data: newBranch,
        adminCreated: !!adminPassword,
        username: adminPassword ? cleanUsername : undefined,
      });
    }

    const codeExists = await BranchModel.findOne({ code: cleanCode });
    if (codeExists) {
      return res.status(409).json({ success: false, message: `Branch code "${cleanCode}" already exists.` });
    }

    if (adminPassword) {
      const userExists = await UserModel.findOne({ username: cleanUsername });
      if (userExists) {
        return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken.` });
      }
    }

    const createdBranch = await BranchModel.create(newBranch);

    if (adminPassword) {
      await UserModel.create({
        id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        email: `${cleanUsername}@lakshmibhavan.com`,
        password: bcrypt.hashSync(adminPassword, 10),
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, location, password, pin, username, managerName } = req.body;

    const branchUpdates: any = { updatedAt: new Date() };
    if (name) branchUpdates.name = name.trim();
    if (code) branchUpdates.code = code.trim().toUpperCase();
    if (location !== undefined) branchUpdates.location = location.trim();

    const newPassword = (password || pin || '').trim();

    if (isUsingFallback()) {
      const index = (fallbackStore.branches || []).findIndex((b) => b.id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Branch not found' });

      fallbackStore.branches[index] = {
        ...fallbackStore.branches[index],
        ...branchUpdates,
      };

      // If updating password/pin or username for branch admin
      if (newPassword || username || managerName) {
        const userIdx = (fallbackStore.users || []).findIndex((u) => u.branchId === id);
        if (userIdx >= 0) {
          if (newPassword) fallbackStore.users[userIdx].password = bcrypt.hashSync(newPassword, 10);
          if (managerName) fallbackStore.users[userIdx].name = managerName.trim();
          if (username) fallbackStore.users[userIdx].username = username.trim().toLowerCase();
          fallbackStore.users[userIdx].updatedAt = new Date();
        } else if (newPassword) {
          // Create admin if none existed
          const cleanUser = (username || `${fallbackStore.branches[index].code.toLowerCase()}_admin`).trim().toLowerCase();
          fallbackStore.users.push({
            id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
            username: cleanUser,
            email: `${cleanUser}@lakshmibhavan.com`,
            password: bcrypt.hashSync(newPassword, 10),
            name: managerName || `${fallbackStore.branches[index].name} Manager`,
            role: 'admin',
            branchId: id,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      saveFallbackToDisk();
      return res.json({ success: true, message: 'Branch updated.', data: fallbackStore.branches[index] });
    }

    const updated = await BranchModel.findOneAndUpdate(
      { id },
      branchUpdates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Branch not found' });

    // Update or create associated admin password/pin if requested
    if (newPassword || username || managerName) {
      const existingUser = await UserModel.findOne({ branchId: id });
      if (existingUser) {
        const userUpdates: any = { updatedAt: new Date() };
        if (newPassword) userUpdates.password = bcrypt.hashSync(newPassword, 10);
        if (managerName) userUpdates.name = managerName.trim();
        if (username) userUpdates.username = username.trim().toLowerCase();
        await UserModel.updateOne({ _id: existingUser._id }, userUpdates);
      } else if (newPassword) {
        const cleanUser = (username || `${updated.code.toLowerCase()}_admin`).trim().toLowerCase();
        await UserModel.create({
          id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          username: cleanUser,
          email: `${cleanUser}@lakshmibhavan.com`,
          password: bcrypt.hashSync(newPassword, 10),
          name: managerName || `${updated.name} Manager`,
          role: 'admin',
          branchId: id,
          status: 'active',
        });
      }
    }

    res.json({ success: true, message: 'Branch updated.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if staff belong to this branch
    let staffCount = 0;
    if (isUsingFallback()) {
      staffCount = (fallbackStore.staff || []).filter((s) => s.branchId === id).length;
    } else {
      staffCount = await StaffModel.countDocuments({ branchId: id });
    }

    if (staffCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete branch because it contains ${staffCount} staff member(s). Please reassign or remove them first.`,
      });
    }

    if (isUsingFallback()) {
      fallbackStore.branches = (fallbackStore.branches || []).filter((b) => b.id !== id);
      // Remove branch admins belonging to this branch
      fallbackStore.users = (fallbackStore.users || []).filter((u) => u.branchId !== id);
      saveFallbackToDisk();
      return res.json({ success: true, message: 'Branch and associated admin accounts deleted.' });
    }

    await Promise.all([
      BranchModel.deleteOne({ id }),
      UserModel.deleteMany({ branchId: id }),
    ]);

    res.json({ success: true, message: 'Branch and associated admin accounts deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

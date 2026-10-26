import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User.js';
import { BranchModel } from '../models/Branch.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    let user: any = null;
    let branch: any = null;

    if (isUsingFallback()) {
      user = fallbackStore.users.find(
        (u) => (u.username || '').toLowerCase() === cleanUsername && u.status !== 'inactive'
      );
      if (user && user.branchId) {
        branch = fallbackStore.branches.find((b) => b.id === user.branchId) || null;
      }
    } else {
      user = await UserModel.findOne({ username: cleanUsername, status: 'active' }).lean();
      if (user && user.branchId) {
        branch = await BranchModel.findOne({ id: user.branchId }).lean();
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
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

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

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
  } catch (error: any) {
    console.error('[Auth Error] Login failure:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    let user: any = null;
    let branch: any = null;

    if (isUsingFallback()) {
      user = fallbackStore.users.find((u) => u.id === req.user?.id);
      if (user && user.branchId) {
        branch = fallbackStore.branches.find((b) => b.id === user.branchId) || null;
      }
    } else {
      user = await UserModel.findOne({ id: req.user.id }).lean();
      if (user && user.branchId) {
        branch = await BranchModel.findOne({ id: user.branchId }).lean();
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import bcrypt from 'bcryptjs';
import { SettingsModel } from '../models/Settings.js';
import { BranchModel } from '../models/Branch.js';
import { UserModel } from '../models/User.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';
import { defaultSettings } from '../controllers/settingsController.js';

export async function seedInitialData() {
  try {
    const hashedSuperPassword = bcrypt.hashSync('admin123', 10);

    const defaultSuperAdmin = {
      id: 'usr-superadmin',
      username: 'superadmin',
      email: 'superadmin@lakshmibhavan.com',
      password: hashedSuperPassword,
      name: 'Super Administrator',
      role: 'superadmin' as const,
      branchId: null,
      phone: '+91 90000 00001',
      status: 'active' as const,
    };

    if (isUsingFallback()) {
      if (!fallbackStore.settings || !fallbackStore.settings.companyName) {
        fallbackStore.settings = { ...defaultSettings };
      }

      // Remove any hardcoded default branch (e.g. branch-main)
      if (Array.isArray(fallbackStore.branches)) {
        fallbackStore.branches = fallbackStore.branches.filter((b) => b.id !== 'branch-main');
      } else {
        fallbackStore.branches = [];
      }

      // Remove any hardcoded branchadmin user
      if (Array.isArray(fallbackStore.users)) {
        fallbackStore.users = fallbackStore.users.filter(
          (u) => u.username !== 'branchadmin' && u.branchId !== 'branch-main'
        );
      } else {
        fallbackStore.users = [];
      }

      // Ensure master Super Admin exists
      const hasSuper = fallbackStore.users.some((u) => u.username === 'superadmin');
      if (!hasSuper) {
        fallbackStore.users.push({ ...defaultSuperAdmin, createdAt: new Date(), updatedAt: new Date() });
        console.log('[Seed] Initialized Master Super Admin into fallback store.');
      }

      saveFallbackToDisk();
      return;
    }

    // MongoDB initialization
    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      await SettingsModel.create(defaultSettings);
      console.log('[Seed] Seeded default company settings into MongoDB.');
    }

    // Remove any hardcoded default branch (branch-main)
    await BranchModel.deleteMany({ id: 'branch-main' });

    // Remove legacy default branchadmin if present
    await UserModel.deleteMany({
      $or: [{ username: 'branchadmin' }, { branchId: 'branch-main' }],
    });

    // Ensure master Super Admin exists
    const superAdminExists = await UserModel.findOne({ username: 'superadmin' });
    if (!superAdminExists) {
      await UserModel.create(defaultSuperAdmin);
      console.log('[Seed] Seeded master Super Admin (username: superadmin, pass: admin123).');
    }
  } catch (err: any) {
    console.warn('[Seed] Notice on data initialization:', err.message);
  }
}

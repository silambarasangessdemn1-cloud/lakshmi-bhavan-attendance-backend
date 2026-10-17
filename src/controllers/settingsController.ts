import { Request, Response } from 'express';
import { SettingsModel } from '../models/Settings.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

export const defaultSettings = {
  companyName: 'Shree Lakshmi Bhavan',
  tagline: 'Staff Salary & Attendance Manager',
  address: '',
  phone: '',
  currency: 'INR',
  currencySymbol: '₹',
};

export const getSettings = async (_req: Request, res: Response) => {
  try {
    if (isUsingFallback()) {
      return res.json({ success: true, data: fallbackStore.settings || defaultSettings });
    }

    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create(defaultSettings);
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    if (isUsingFallback()) {
      fallbackStore.settings = { ...fallbackStore.settings, ...updates };
      saveFallbackToDisk();
      return res.json({ success: true, data: fallbackStore.settings });
    }

    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({ ...defaultSettings, ...updates });
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetSettings = async (_req: Request, res: Response) => {
  try {
    if (isUsingFallback()) {
      fallbackStore.settings = { ...defaultSettings };
      saveFallbackToDisk();
      return res.json({ success: true, data: fallbackStore.settings, message: 'Settings reset to Shree Lakshmi Bhavan defaults.' });
    }

    await SettingsModel.deleteMany({});
    const created = await SettingsModel.create(defaultSettings);
    res.json({ success: true, data: created, message: 'Settings reset to Shree Lakshmi Bhavan defaults.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

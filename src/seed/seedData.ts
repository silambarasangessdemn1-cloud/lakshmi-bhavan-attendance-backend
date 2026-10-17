import { SettingsModel } from '../models/Settings.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';
import { defaultSettings } from '../controllers/settingsController.js';

export async function seedInitialData() {
  try {
    if (isUsingFallback()) {
      if (!fallbackStore.settings || !fallbackStore.settings.companyName) {
        fallbackStore.settings = { ...defaultSettings };
        saveFallbackToDisk();
        console.log('[Seed] Initialized default company settings into fallback store.');
      }
      return;
    }

    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      await SettingsModel.create(defaultSettings);
      console.log('[Seed] Seeded default company settings into MongoDB.');
    }
  } catch (err: any) {
    console.warn('[Seed] Notice on settings initialization:', err.message);
  }
}

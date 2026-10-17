"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = seedInitialData;
const Settings_js_1 = require("../models/Settings.js");
const db_js_1 = require("../config/db.js");
const settingsController_js_1 = require("../controllers/settingsController.js");
async function seedInitialData() {
    try {
        if ((0, db_js_1.isUsingFallback)()) {
            if (!db_js_1.fallbackStore.settings || !db_js_1.fallbackStore.settings.companyName) {
                db_js_1.fallbackStore.settings = { ...settingsController_js_1.defaultSettings };
                (0, db_js_1.saveFallbackToDisk)();
                console.log('[Seed] Initialized default company settings into fallback store.');
            }
            return;
        }
        const settingsCount = await Settings_js_1.SettingsModel.countDocuments();
        if (settingsCount === 0) {
            await Settings_js_1.SettingsModel.create(settingsController_js_1.defaultSettings);
            console.log('[Seed] Seeded default company settings into MongoDB.');
        }
    }
    catch (err) {
        console.warn('[Seed] Notice on settings initialization:', err.message);
    }
}

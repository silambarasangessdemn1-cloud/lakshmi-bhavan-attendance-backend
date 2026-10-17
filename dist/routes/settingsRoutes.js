"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_js_1 = require("../controllers/settingsController.js");
const router = (0, express_1.Router)();
router.get('/', settingsController_js_1.getSettings);
router.put('/', settingsController_js_1.updateSettings);
router.post('/reset', settingsController_js_1.resetSettings);
exports.default = router;

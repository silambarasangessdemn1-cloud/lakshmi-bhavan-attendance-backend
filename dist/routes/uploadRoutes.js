"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uploadController_js_1 = require("../controllers/uploadController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.optionalAuth);
// Accepts multipart/form-data with 'file' field OR application/json with 'image' (base64)
router.post('/', upload.single('file'), uploadController_js_1.uploadImage);
exports.default = router;

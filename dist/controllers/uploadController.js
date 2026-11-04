"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_js_1 = __importStar(require("../config/cloudinary.js"));
const uploadImage = async (req, res) => {
    try {
        let fileBuffer = null;
        let mimeType = 'image/jpeg';
        if (req.file) {
            fileBuffer = req.file.buffer;
            mimeType = req.file.mimetype || 'image/jpeg';
        }
        else if (req.body?.image) {
            // Direct base64 string
            const base64Data = req.body.image;
            if (typeof base64Data === 'string') {
                const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    mimeType = matches[1];
                    fileBuffer = Buffer.from(matches[2], 'base64');
                }
                else {
                    fileBuffer = Buffer.from(base64Data, 'base64');
                }
            }
        }
        if (!fileBuffer) {
            return res.status(400).json({
                success: false,
                message: 'No file or image data provided for upload.',
            });
        }
        const folder = req.body?.folder || 'shree-lakshmi-bhavan/aadhaar';
        // Check if Cloudinary credentials are provided in env
        if ((0, cloudinary_js_1.isCloudinaryConfigured)()) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_js_1.default.uploader.upload_stream({
                    folder,
                    resource_type: 'auto',
                }, (error, result) => {
                    if (error)
                        return reject(error);
                    if (!result)
                        return reject(new Error('Cloudinary upload returned empty response'));
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                });
                uploadStream.end(fileBuffer);
            });
            return res.status(200).json({
                success: true,
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id,
                storage: 'cloudinary',
                message: 'Image uploaded successfully to Cloudinary.',
            });
        }
        // Fallback: If Cloudinary keys are not yet configured in .env, convert to base64 Data URI so uploading still works seamlessly
        const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        return res.status(200).json({
            success: true,
            url: dataUri,
            storage: 'fallback_base64',
            message: 'Cloudinary not configured in .env, stored as optimized Data URI.',
        });
    }
    catch (error) {
        console.error('[Upload Error]', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image.',
        });
    }
};
exports.uploadImage = uploadImage;

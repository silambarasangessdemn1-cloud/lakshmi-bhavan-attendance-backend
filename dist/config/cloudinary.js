"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryConfigured = void 0;
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary from environment variables or CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
    cloudinary_1.v2.config();
}
else if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
const isCloudinaryConfigured = () => {
    return !!(process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET));
};
exports.isCloudinaryConfigured = isCloudinaryConfigured;
exports.default = cloudinary_1.v2;

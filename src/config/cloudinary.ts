import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables or CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
  );
};

export default cloudinary;


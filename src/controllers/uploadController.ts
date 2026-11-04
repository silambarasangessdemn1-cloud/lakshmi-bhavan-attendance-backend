import { Request, Response } from 'express';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body?.image) {
      // Direct base64 string
      const base64Data = req.body.image;
      if (typeof base64Data === 'string') {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], 'base64');
        } else {
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
    if (isCloudinaryConfigured()) {
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result) return reject(new Error('Cloudinary upload returned empty response'));
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          uploadStream.end(fileBuffer);
        }
      );

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
  } catch (error: any) {
    console.error('[Upload Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image.',
    });
  }
};


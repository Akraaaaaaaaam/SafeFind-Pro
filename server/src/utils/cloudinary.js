
import { v2 as cloudinary } from 'cloudinary';
const enabled = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.UPLOAD_MODE === 'cloudinary');
if (enabled) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
}
export async function uploadToCloudinary(localPath, folder='safefind') {
  if (!enabled) return null;
  const result = await cloudinary.uploader.upload(localPath, { folder, resource_type: 'image' });
  return result.secure_url;
}
export { enabled as cloudinaryEnabled };

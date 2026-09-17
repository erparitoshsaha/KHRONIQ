import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype && file.mimetype.startsWith('video');
    return {
      folder: 'zenith-watches',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm']
    };
  }
});

// Filter for image-only uploads (10 MB limit)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

// Filter for media gallery uploads (images and videos up to 50 MB)
const mediaFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WEBP images and MP4/WEBM videos are allowed.'), false);
  }
};

// 1. Single product image uploader (10 MB max)
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit for images
  },
  fileFilter: imageFileFilter
});

// 2. Admin media gallery uploader (50 MB max for videos & images)
export const mediaUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit for videos
  },
  fileFilter: mediaFileFilter
});

export default imageUpload;